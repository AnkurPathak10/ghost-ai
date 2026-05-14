export type AiArchitectChatRole = "user" | "assistant"

export type AiArchitectChatMessage = {
  id: string
  role: AiArchitectChatRole
  content: string
}
