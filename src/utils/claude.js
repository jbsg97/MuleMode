const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL    = 'llama-3.3-70b-versatile'

/**
 * Call the Groq API (OpenAI-compatible format).
 * @param {string} key  - Groq API key
 * @param {object} opts
 *   system     {string}   optional system prompt — sent as first message with role:'system'
 *   messages   {Array}    [{role:'user'|'assistant', content:'...'}]
 *              If the first message has role 'system' it is promoted automatically.
 *   max_tokens {number}   default 2000
 * @returns {string} text response
 */
export async function callClaude(key, { system, messages, max_tokens = 2000 }) {
  let sysPrompt = system
  let msgs      = messages

  // Allow passing system as first message for backwards compat
  if (!sysPrompt && msgs[0]?.role === 'system') {
    sysPrompt = msgs[0].content
    msgs      = msgs.slice(1)
  }

  // Groq (OpenAI-compatible): system prompt goes as first message with role:'system'
  const allMessages = sysPrompt
    ? [{ role: 'system', content: sysPrompt }, ...msgs]
    : msgs

  const body = { model: MODEL, messages: allMessages, max_tokens, temperature: 0.7 }

  const res  = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  checkClaudeError(data)
  return data?.choices?.[0]?.message?.content || ''
}

export function checkClaudeError(data) {
  if (!data?.error) return
  const { type, message } = data.error
  if (type === 'rate_limit_exceeded') {
    throw new Error('Límite de API alcanzado. Intenta en unos minutos o revisa tu plan en console.groq.com.')
  }
  throw new Error(message || 'Error de IA')
}
