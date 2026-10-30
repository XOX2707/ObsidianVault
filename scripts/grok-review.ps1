<#
.SYNOPSIS
  Ask Grok (Grok Build CLI) to review a git diff. Grok only sees the diff text:
  it runs in an empty temp folder with no file, shell or web tools.

  Untracked files are never sent (the vault has private notes that are not in git).
  To review a new file, `git add` it first.

.EXAMPLE
  .\scripts\grok-review.ps1                        # staged + unstaged changes (git diff --staged, then git diff)
  .\scripts\grok-review.ps1 -Staged                # staged changes only (git diff --staged)
  .\scripts\grok-review.ps1 -Range main...HEAD     # everything on this branch
  .\scripts\grok-review.ps1 -Path CLAUDE.md,AGENTS.md -Focus "are the two files consistent?"
#>
param(
    [string]$Range,
    [switch]$Staged,
    [string[]]$Path,
    [string]$Focus,
    [string]$Model
)

$ErrorActionPreference = 'Stop'
$MaxDiffChars = 300000

# Paths that may hold secrets. Matched against git's forward-slash paths.
$ForbiddenPath = '(^|/)\.mcp\.json$|(^|/)obsidian-yolo/data\.json$|(^|/)plugins/yolo-xox/|(^|/)\.env($|\.|/)|\.env$|(^|/)auth\.json$|(^|/)config\.json$'

# Key-shaped strings. On a match we refuse without printing the match.
$SecretPatterns = @(
    '(sk-ant-|sk-|xai-)[A-Za-z0-9_\-]{20,}',
    '-----BEGIN [A-Z ]*PRIVATE KEY-----',
    'eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}',
    '(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}',
    'github_pat_[A-Za-z0-9_]{30,}',
    'AKIA[A-Z0-9]{16}',
    'Bearer\s+[A-Za-z0-9_\-\.=]{20,}'
)

function Assert-NoSecret([string]$Text, [string]$What) {
    foreach ($p in $SecretPatterns) {
        if ($Text -match $p) {
            throw "Refusing: $What contains a string that looks like a key or token. Remove it before review."
        }
    }
}

# PowerShell 5.1 turns any native stderr line (e.g. git's CRLF warnings) into a terminating error under 'Stop',
# so native commands run with a local 'Continue'.
function Invoke-Git {
    $ErrorActionPreference = 'Continue'
    $out = & git @args 2>&1
    $stdout = @($out | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] })
    if ($LASTEXITCODE -ne 0) {
        $stderr = @($out | Where-Object { $_ -is [System.Management.Automation.ErrorRecord] } | ForEach-Object { $_.ToString() })
        throw "git $($args -join ' ') failed with exit code ${LASTEXITCODE}: $($stderr -join ' ')"
    }
    $stdout
}

function Invoke-Grok([string]$Exe, [string[]]$GrokArgs) {
    $ErrorActionPreference = 'Continue'
    & $Exe @GrokArgs
    if ($LASTEXITCODE -ne 0) { throw "grok exited with code $LASTEXITCODE" }
}

function Remove-WorkDir([string]$Dir) {
    # grok may still hold a handle on its --cwd for a moment after exiting.
    for ($i = 0; $i -lt 5; $i++) {
        if (-not [System.IO.Directory]::Exists($Dir)) { return }
        try { [System.IO.Directory]::Delete($Dir, $true); return } catch { Start-Sleep -Milliseconds 500 }
    }
    Write-Warning "Could not delete temp folder $Dir - delete it by hand (it holds the diff text)."
}

# Billing guard: with XAI_API_KEY set, Grok bills the pay-per-use API instead of the grok.com subscription.
if ($env:XAI_API_KEY) {
    throw "XAI_API_KEY is set in this shell. Remove it first; Grok must use the grok.com login, not the API."
}
if ($Staged -and $Range) {
    throw "Use either -Staged or -Range, not both."
}

$grokCmd = Get-Command grok -ErrorAction SilentlyContinue
$grokExe = if ($grokCmd) { $grokCmd.Source } else { Join-Path $env:USERPROFILE '.grok\bin\grok.exe' }
if (-not (Test-Path $grokExe)) {
    throw "grok not found. Install Grok Build and run 'grok login' first."
}

$repo = (@(Invoke-Git rev-parse --show-toplevel)[0]).ToString().Trim()
# --no-renames: a renamed secret file shows up under its old name too, so the path check sees it.
$baseArgs = @('-c', 'core.quotepath=false', '-c', 'core.safecrlf=false', '-C', $repo, 'diff', '--no-renames')

# Default reviews the index and the worktree separately (git diff --staged + git diff):
# `git diff HEAD` alone misses index changes that the worktree has reverted, which a commit would still include.
$parts = if ($Staged) { @('--staged') } elseif ($Range) { @($Range) } else { @('--staged', 'worktree') }

$pathArgs = @('--')
if ($Path) { $pathArgs += $Path }

function Get-PartArgs([string]$Part) {
    if ($Part -eq 'worktree') { return $baseArgs }
    return $baseArgs + $Part
}

function Assert-NoSecretPath([string[]]$Paths, [string]$What) {
    $hit = @($Paths | Where-Object { $_ -match $ForbiddenPath } | Select-Object -Unique)
    if ($hit.Count -gt 0) {
        throw ("Refusing: $What includes files that may hold secrets: " + ($hit -join ', '))
    }
}

foreach ($part in $parts) {
    $a = Get-PartArgs $part
    Assert-NoSecretPath @(Invoke-Git @a --name-only @pathArgs) 'the diff'
}
if ($Focus) { Assert-NoSecret $Focus '-Focus' }

$work = Join-Path $env:TEMP ("grok-review-" + [guid]::NewGuid().ToString('N'))
[System.IO.Directory]::CreateDirectory($work) | Out-Null
try {
    # git writes each diff to a file so non-ASCII paths and text keep their UTF-8 bytes;
    # it is read back and deleted at once, before any check can fail.
    $utf8 = New-Object System.Text.UTF8Encoding $false
    $diff = ''
    $i = 0
    foreach ($part in $parts) {
        $i++
        $a = Get-PartArgs $part
        $diffFile = Join-Path $work "diff-$i.txt"
        Invoke-Git @a "--output=$diffFile" @pathArgs | Out-Null
        $text = [System.IO.File]::ReadAllText($diffFile, $utf8)
        [System.IO.File]::Delete($diffFile)
        if (-not $text.Trim()) { continue }
        if ($parts.Count -gt 1) {
            $label = if ($part -eq '--staged') { 'STAGED CHANGES (index vs HEAD)' } else { 'UNSTAGED CHANGES (worktree vs index)' }
            $diff += "`n### $label`n"
        }
        $diff += $text
    }

    # Second path check on the UTF-8 diff headers, so it does not depend on console encoding.
    $headerPaths = @([regex]::Matches($diff, '(?m)^(?:diff --git a/\S+ b/|--- a/|\+\+\+ b/)(.+?)\s*$') | ForEach-Object { $_.Groups[1].Value })
    Assert-NoSecretPath $headerPaths 'the diff'

    if (-not $diff.Trim()) {
        $scope = if ($Staged) { 'staged' } elseif ($Range) { "range $Range" } else { 'staged or unstaged (untracked files are not included)' }
        Write-Host "No $scope changes to review."
        return
    }
    if ($diff.Length -gt $MaxDiffChars) {
        throw "Diff is $($diff.Length) characters; narrow it with -Path or -Range (limit $MaxDiffChars)."
    }
    Assert-NoSecret $diff 'the diff'

    $prompt = @"
You are a strict reviewer of code and documentation. Below is a git diff from an Obsidian vault repository
(personal notes, rules for AI assistants, and an Obsidian plugin written in TypeScript).

Reply in Simplified Chinese with:
1. Verdict: pass, or needs changes.
2. Problems sorted by severity (high / medium / low). For each: where it is, why it is a problem, and a concrete fix.
3. If nothing is wrong, say so plainly.

Judge only from the diff. Do not invent content that is not in it. You cannot read files or run commands; do not try.
"@
    if ($Focus) { $prompt += "`n`nPay special attention to: $Focus" }
    $prompt += "`n`n--- DIFF START ---`n" + $diff + "`n--- DIFF END ---`n"

    $promptFile = Join-Path $work 'prompt.txt'
    [System.IO.File]::WriteAllText($promptFile, $prompt, $utf8)

    $grokArgs = @(
        '--prompt-file', $promptFile,
        '--cwd', $work,
        '--tools', 'todo_write',
        '--permission-mode', 'plan',
        '--disable-web-search',
        '--no-subagents',
        '--max-turns', '3'
    )
    if ($Model) { $grokArgs += @('-m', $Model) }

    Invoke-Grok $grokExe $grokArgs
}
finally {
    Remove-WorkDir $work
}
