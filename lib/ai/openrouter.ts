import { createOpenAI } from "@ai-sdk/openai"

/** Default matches OpenRouter model page: https://openrouter.ai/openai/gpt-oss-120b:free/api */
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-120b:free"

export function resolveOpenRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim()
  if (!key) {
    throw new Error(
      "No OpenRouter API key: set OPENROUTER_API_KEY in the environment."
    )
  }
  return key
}

export function openRouterModelId(): string {
  const id = process.env.OPENROUTER_MODEL?.trim()
  return id && id.length > 0 ? id : DEFAULT_OPENROUTER_MODEL
}

/** Optional attribution headers for [OpenRouter leaderboards](https://openrouter.ai/docs/app-attribution). */
function openRouterAttributionHeaders(): Record<string, string> {
  const refererRaw =
    process.env.OPENROUTER_HTTP_REFERER?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim()
  const title = process.env.OPENROUTER_APP_NAME?.trim() || "Ghost AI"

  const headers: Record<string, string> = { "X-Title": title }
  if (refererRaw) {
    headers["HTTP-Referer"] = refererRaw.includes("://")
      ? refererRaw
      : `https://${refererRaw}`
  }
  return headers
}

let cachedProvider: ReturnType<typeof createOpenAI> | null = null

function getOpenRouterProvider(): ReturnType<typeof createOpenAI> {
  if (!cachedProvider) {
    cachedProvider = createOpenAI({
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: resolveOpenRouterApiKey(),
      headers: openRouterAttributionHeaders(),
    })
  }
  return cachedProvider
}

/**
 * Chat/completions model routed through OpenRouter (OpenAI-compatible API).
 * Uses `OPENROUTER_MODEL`; defaults to `openai/gpt-oss-120b:free`.
 */
export function getOpenRouterChatModel() {
  return getOpenRouterProvider()(openRouterModelId())
}
