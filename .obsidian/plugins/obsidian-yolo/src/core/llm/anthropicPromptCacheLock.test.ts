import { LLMProvider } from '../../types/provider.types'

import { AnthropicProvider } from './anthropic'

const provider = (promptCaching?: boolean): LLMProvider => ({
  id: 'anthropic',
  presetType: 'anthropic',
  apiType: 'anthropic',
  apiKey: 'sk-test',
  ...(promptCaching === undefined
    ? {}
    : { additionalSettings: { promptCaching } }),
})

type Internals = {
  isPromptCachingEnabled: (modelId: string) => boolean
  useExtendedPromptCacheTtl: (modelId: string) => boolean
}
const internals = (
  promptCaching?: boolean,
  options?: ConstructorParameters<typeof AnthropicProvider>[1],
) =>
  new AnthropicProvider(
    provider(promptCaching),
    options,
  ) as unknown as Internals

describe('AnthropicProvider prompt caching lock', () => {
  it('keeps caching on for Claude models even when the toggle is off', () => {
    expect(internals(false).isPromptCachingEnabled('claude-opus-5-5')).toBe(
      true,
    )
  })

  it('lets the toggle turn caching off for non-Claude models', () => {
    expect(internals(false).isPromptCachingEnabled('kimi-k2')).toBe(false)
    expect(internals().isPromptCachingEnabled('kimi-k2')).toBe(true)
  })

  it('leaves Claude to the toggle when the lock is opted out', () => {
    const unlocked = internals(false, { lockClaudePromptCaching: false })
    expect(unlocked.isPromptCachingEnabled('claude-opus-5-5')).toBe(false)
  })
})

describe('AnthropicProvider 1-hour cache TTL', () => {
  it('uses the 1-hour TTL for Claude models', () => {
    expect(internals().useExtendedPromptCacheTtl('claude-opus-5-5')).toBe(true)
  })

  it('keeps non-Claude models on the default TTL', () => {
    expect(internals().useExtendedPromptCacheTtl('deepseek-v4-pro')).toBe(false)
    expect(internals().useExtendedPromptCacheTtl('kimi-k2')).toBe(false)
  })

  it('keeps Claude on the default TTL when the gateway opts out', () => {
    const gateway = internals(undefined, { extendedPromptCacheTtl: false })
    expect(gateway.useExtendedPromptCacheTtl('claude-opus-5-5')).toBe(false)
  })
})
