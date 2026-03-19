const KEYWORDS_INFERIOR = [
  'sentadilla', 'squat', 'hip thrust', 'peso muerto', 'deadlift',
  'curl isquiotibiales', 'extensión de pierna', 'leg curl', 'leg extension',
  'zancada', 'lunges', 'lunge', 'rdl', 'zercher', 'goblet',
  'leg press', 'split squat', 'step up', 'hip hinge', 'drag',
]

export function esTrenInferior(nombre) {
  const n = nombre.toLowerCase()
  return KEYWORDS_INFERIOR.some(k => n.includes(k))
}

/**
 * Determina el estado de progresión de un ejercicio.
 * @param {string} nombre
 * @param {Array}  historial - Pinia historial (newest first)
 * @param {Array}  rutinas   - Pinia rutinas (to read target reps)
 * @param {number} incrementoSuperior - kg a subir en tren superior
 * @param {number} incrementoInferior - kg a subir en tren inferior
 * @returns {{ estado: 'mantener'|'calentar'|'subirReps'|'subirPeso', mensaje: string } | null}
 */
export function calcularProgresion(nombre, historial, rutinas, incrementoSuperior = 2.5, incrementoInferior = 5) {
  // Read target reps from current rutinas definition
  let repsStr = ''
  for (const r of (rutinas || [])) {
    const ex = r.ejercicios?.find(e => e.nombre === nombre)
    if (ex?.reps) { repsStr = ex.reps; break }
  }

  // Parse "8-10" → {min:8, max:10}; "10" or "5 c/lado" → {min:5, max:5}
  let targetMin = 0, targetMax = 0
  if (repsStr) {
    const parts = repsStr.match(/(\d+)(?:\s*[-–]\s*(\d+))?/)
    if (parts) {
      targetMin = parseInt(parts[1])
      targetMax = parts[2] ? parseInt(parts[2]) : targetMin
    }
  }

  // Last 2 sessions that include this exercise
  const sesiones = (historial || [])
    .filter(h => h.ejercicios?.some(e => e.nombre === nombre))
    .slice(0, 2)

  if (sesiones.length === 0) return null

  const getEx = (s) => s.ejercicios?.find(e => e.nombre === nombre)

  // "Complete" = all series done AND each series met targetMin reps (if known)
  const isComplete = (ex) => {
    if (!ex?.series?.length) return false
    const done = ex.series.filter(s => s.done)
    if (done.length < ex.series.length) return false
    if (targetMin > 0) return done.every(s => (parseInt(s.reps) || 0) >= targetMin)
    return true
  }

  const ultimaEx = getEx(sesiones[0])
  if (!ultimaEx || !isComplete(ultimaEx)) {
    return { estado: 'mantener', mensaje: 'Completa todas las series' }
  }

  if (sesiones.length < 2 || !isComplete(getEx(sesiones[1]))) {
    return { estado: 'calentar', mensaje: 'Una sesión más' }
  }

  // 2 consecutive complete sessions
  const seriesDone = ultimaEx.series.filter(s => s.done)
  const repsPromedio = seriesDone.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0) / seriesDone.length

  if (targetMax > 0 && Math.floor(repsPromedio) < targetMax) {
    const siguienteReps = Math.min(targetMax, Math.round(repsPromedio) + 1)
    return { estado: 'subirReps', mensaje: `Sube a ${siguienteReps} reps` }
  }

  // At or beyond upper range → increase weight
  const pesoVals = seriesDone.filter(s => s.peso).map(s => parseFloat(s.peso) || 0)
  if (pesoVals.length > 0) {
    const maxPeso = Math.max(...pesoVals)
    const incremento = esTrenInferior(nombre) ? incrementoInferior : incrementoSuperior
    return { estado: 'subirPeso', mensaje: `Sube a ${maxPeso + incremento}kg` }
  }

  return { estado: 'subirReps', mensaje: 'Aumenta las reps' }
}
