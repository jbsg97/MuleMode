import { callClaude } from './claude.js'

const MAX_LINES = 30
const MAX_CHARS = 2000

const CATEGORIAS = ['[FÍSICO]', '[EQUIPO]', '[OBJETIVOS]', '[PREFERENCIAS]', '[HISTORIAL]']

/**
 * Extrae hechos de un diálogo, actualiza la memoria del entrenador
 * con deduplicación/reemplazo de contradicciones, y la persiste.
 *
 * @param {object} store  - Pinia store
 * @param {string} dialogo - Turnos de conversación formateados como:
 *                           "Atleta: ...\nEntrenador: ..."
 */
export async function actualizarMemoria(store, dialogo) {
  const key = store.geminiKey
  if (!key || !dialogo.trim()) return

  const memoriaActual = store.memoriaEntrenador
  const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

  const prompt = `Eres el sistema de memoria de un entrenador personal. Mantén una memoria actualizada, concisa y sin contradicciones sobre el atleta.

MEMORIA ACTUAL:
${memoriaActual || '(vacía)'}

CONVERSACIÓN RECIENTE:
${dialogo}

INSTRUCCIONES:
1. Analiza si la conversación contiene hechos relevantes: lesiones, limitaciones físicas, equipo disponible, objetivos, preferencias de ejercicio, logros o PRs.
2. Si un hecho nuevo CONTRADICE la memoria actual (ej: peso diferente, lesión resuelta), REEMPLAZA el dato antiguo.
3. Si un hecho nuevo es REDUNDANTE con la memoria actual, ignóralo.
4. Si es GENUINAMENTE NUEVO, añádelo en la categoría correcta.
5. Devuelve la memoria COMPLETA actualizada con este formato (incluye solo las categorías con contenido):

[FÍSICO]
- peso, altura, lesiones activas, limitaciones

[EQUIPO]
- herramientas disponibles para entrenar

[OBJETIVOS]
- metas declaradas

[PREFERENCIAS]
- ejercicios que le gustan o no, estilo de entrenamiento

[HISTORIAL]
- logros, PRs, progresiones notables

Reglas de formato:
- Cada hecho en una línea que empiece con "- "
- Añade la fecha solo a hechos nuevos o actualizados: "(${fecha})"
- Máximo ${MAX_LINES} líneas en total entre todas las categorías
- Si hay que recortar, prioriza: FÍSICO > EQUIPO > OBJETIVOS > PREFERENCIAS > HISTORIAL
- Si la conversación no aporta nada nuevo ni hay contradicciones que corregir, responde exactamente: NADA
- Devuelve SOLO la memoria con encabezados, o NADA — sin explicaciones, sin texto extra`

  try {
    const resultado = (await callClaude(key, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    })).trim()

    if (!resultado || resultado === 'NADA') return

    const memoriaFinal = aplicarLimite(resultado)
    store.memoriaEntrenador     = memoriaFinal
    store.memoriaActualizadaEn  = new Date().toISOString()
    store.save()
  } catch { /* silencioso — nunca bloquear el flujo principal */ }
}

function aplicarLimite(texto) {
  const lineas = texto.split('\n').filter(l => l.trim())
  if (lineas.length <= MAX_LINES && texto.length <= MAX_CHARS) return texto

  // Parse into sections
  const secciones = {}
  let actual = null
  for (const linea of lineas) {
    const cat = CATEGORIAS.find(c => linea.startsWith(c))
    if (cat) { actual = cat; secciones[cat] = [] }
    else if (actual && linea.startsWith('- ')) secciones[actual].push(linea)
  }

  // Rebuild prioritizing high-importance categories
  const resultado = []
  let total = 0
  for (const cat of CATEGORIAS) {
    if (!secciones[cat]?.length) continue
    resultado.push(cat)
    total++
    for (const linea of secciones[cat]) {
      if (total >= MAX_LINES) break
      resultado.push(linea)
      total++
    }
  }

  return resultado.join('\n').slice(0, MAX_CHARS)
}
