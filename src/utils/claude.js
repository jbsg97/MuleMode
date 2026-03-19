const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const MODEL    = 'claude-sonnet-4-6'
const VERSION  = '2023-06-01'

/**
 * Call the Claude API.
 * @param {string} key  - Anthropic API key
 * @param {object} opts
 *   system     {string}   optional system prompt
 *   messages   {Array}    [{role:'user'|'assistant', content:'...'}]
 *              If the first message has role 'system' it is promoted to the system field automatically.
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

  const body = { model: MODEL, max_tokens, messages: msgs }
  if (sysPrompt) body.system = sysPrompt

  const res  = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  checkClaudeError(data)
  return data?.content?.[0]?.text || ''
}

export function checkClaudeError(data) {
  if (!data?.error) return
  const { type, message } = data.error
  if (type === 'rate_limit_error') {
    throw new Error('Límite diario de API alcanzado. Intenta mañana o revisa tu plan en console.anthropic.com.')
  }
  throw new Error(message || 'Error de IA')
}
