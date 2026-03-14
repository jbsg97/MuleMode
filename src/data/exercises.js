// Base de datos de ejercicios con activación muscular basada en estudios EMG
// Fuentes: PubMed, NSCA JSCR, ACE, Bret Contreras research

export const EXERCISE_DB = [
  {
    nombres: ['kb swing', 'kettlebell swing', 'swing con kettlebell', 'swing finalizador', 'kb swing finalizador'],
    primario: ['gluteal', 'hamstring'],
    secundario: ['lower-back', 'abs', 'obliques'],
    terciario: ['forearm', 'trapezius', 'quadriceps'],
  },
  {
    nombres: ['kb goblet squat', 'sentadilla goblet', 'goblet squat kettlebell', 'goblet squat'],
    primario: ['quadriceps', 'gluteal'],
    secundario: ['hamstring', 'abs', 'lower-back'],
    terciario: ['forearm', 'upper-back', 'adductor'],
  },
  {
    nombres: ['kb press militar', 'press militar kettlebell', 'overhead press kettlebell', 'kb military press', 'press militar un brazo', 'press militar'],
    primario: ['front-deltoids', 'triceps'],
    secundario: ['trapezius', 'upper-back'],
    terciario: ['abs', 'obliques', 'forearm'],
  },
  {
    nombres: ['kb floor press', 'press de piso kettlebell', 'floor press kettlebell', 'floor press un brazo', 'floor press'],
    primario: ['chest', 'triceps'],
    secundario: ['front-deltoids'],
    terciario: ['forearm', 'abs'],
  },
  {
    nombres: ['kb clean', 'cargada kettlebell', 'clean kettlebell', 'kb clean un brazo', 'clean un brazo'],
    primario: ['gluteal', 'hamstring'],
    secundario: ['trapezius', 'back-deltoids', 'lower-back'],
    terciario: ['forearm', 'abs', 'front-deltoids'],
  },
  {
    nombres: ['kb farmer carry', 'farmer carry kettlebell', 'farmer carry', 'marcha del granjero', 'kb farmer'],
    primario: ['forearm', 'trapezius'],
    secundario: ['abs', 'lower-back', 'quadriceps'],
    terciario: ['gluteal', 'upper-back', 'obliques'],
  },
  {
    nombres: ['kb snatch', 'arrancada kettlebell', 'snatch kettlebell', 'kb arrancada'],
    primario: ['gluteal', 'hamstring', 'front-deltoids'],
    secundario: ['trapezius', 'lower-back', 'triceps'],
    terciario: ['abs', 'obliques', 'forearm', 'quadriceps'],
  },
  {
    nombres: ['kb turkish get-up', 'turkish get up', 'get-up turco', 'tgu kettlebell', 'turkish getup', 'get up turco'],
    primario: ['front-deltoids', 'abs', 'gluteal'],
    secundario: ['obliques', 'trapezius', 'upper-back', 'triceps'],
    terciario: ['quadriceps', 'hamstring', 'lower-back', 'forearm'],
  },
  {
    nombres: ['kb renegade row', 'renegade row kettlebell', 'remo renegado', 'renegade row'],
    primario: ['upper-back', 'back-deltoids'],
    secundario: ['abs', 'obliques', 'biceps'],
    terciario: ['chest', 'triceps', 'forearm'],
  },
  {
    nombres: ['kb thruster', 'thruster kettlebell', 'sentadilla a press kettlebell', 'thruster'],
    primario: ['quadriceps', 'gluteal', 'front-deltoids'],
    secundario: ['hamstring', 'triceps', 'abs'],
    terciario: ['lower-back', 'trapezius', 'forearm'],
  },
  {
    nombres: ['kb windmill', 'windmill kettlebell', 'molino de viento kettlebell', 'windmill'],
    primario: ['obliques', 'abs', 'front-deltoids'],
    secundario: ['lower-back', 'gluteal', 'trapezius'],
    terciario: ['hamstring', 'upper-back', 'adductor'],
  },
  {
    nombres: ['sandbag bear hug squat', 'bear hug squat', 'squat abrazo saco', 'sentadilla abrazo sandbag', 'bear hug squat sandbag'],
    primario: ['quadriceps', 'gluteal'],
    secundario: ['hamstring', 'abs', 'lower-back'],
    terciario: ['chest', 'upper-back', 'adductor', 'forearm'],
  },
  {
    nombres: ['sandbag shouldering', 'hombro sandbag', 'cargada al hombro sandbag', 'shouldering saco', 'shouldering'],
    primario: ['gluteal', 'hamstring', 'lower-back'],
    secundario: ['trapezius', 'upper-back', 'obliques'],
    terciario: ['abs', 'forearm', 'quadriceps'],
  },
  {
    nombres: ['sandbag over shoulder', 'over the shoulder sandbag', 'lanzada por encima', 'sandbag por encima del hombro', 'over shoulder'],
    primario: ['gluteal', 'hamstring', 'lower-back'],
    secundario: ['trapezius', 'obliques', 'abs'],
    terciario: ['upper-back', 'forearm', 'quadriceps'],
  },
  {
    nombres: ['sandbag bent over row', 'remo inclinado sandbag', 'remo con saco', 'bent over row sandbag', 'bent over row'],
    primario: ['upper-back', 'back-deltoids'],
    secundario: ['biceps', 'lower-back', 'trapezius'],
    terciario: ['forearm', 'abs', 'obliques'],
  },
  {
    nombres: ['sandbag bear hug carry', 'bear hug carry', 'cargada abrazo sandbag', 'acarreo abrazo saco'],
    primario: ['abs', 'lower-back', 'forearm'],
    secundario: ['trapezius', 'upper-back', 'gluteal'],
    terciario: ['chest', 'obliques', 'quadriceps'],
  },
  {
    nombres: ['sandbag zercher squat', 'zercher squat sandbag', 'zercher squat', 'sentadilla zercher sandbag', 'sentadilla zercher'],
    primario: ['quadriceps', 'gluteal', 'abs'],
    secundario: ['lower-back', 'hamstring', 'upper-back'],
    terciario: ['forearm', 'obliques', 'adductor'],
  },
  {
    nombres: ['sandbag drag', 'arrastre de saco', 'drag sandbag', 'arrastre sandbag'],
    primario: ['gluteal', 'hamstring', 'forearm'],
    secundario: ['lower-back', 'trapezius', 'quadriceps'],
    terciario: ['abs', 'upper-back', 'calves'],
  },
  {
    nombres: ['sandbag shouldering squat', 'shouldering con sentadilla', 'cargada al hombro con squat', 'sandbag shouldering and squat', 'shouldering + squat'],
    primario: ['gluteal', 'quadriceps', 'hamstring'],
    secundario: ['lower-back', 'trapezius', 'obliques'],
    terciario: ['abs', 'forearm', 'upper-back'],
  },
  {
    nombres: ['plancha', 'plank', 'plank isometrico', 'plancha abdominal', 'plancha en sandbag', 'plancha en kettlebell'],
    primario: ['abs', 'obliques'],
    secundario: ['lower-back', 'front-deltoids', 'triceps'],
    terciario: ['chest', 'quadriceps', 'gluteal'],
  },
  {
    nombres: ['dominada', 'pull-up', 'jalon al pecho barra', 'chin-up', 'pullup', 'dominada negativa', 'pull up negativo'],
    primario: ['upper-back', 'biceps'],
    secundario: ['back-deltoids', 'trapezius'],
    terciario: ['abs', 'forearm', 'chest'],
  },
  {
    nombres: ['fondos', 'dips', 'fondos en paralelas', 'fondos de triceps', 'parallel bar dips', 'fondos triceps'],
    primario: ['triceps', 'chest'],
    secundario: ['front-deltoids'],
    terciario: ['abs', 'trapezius', 'forearm'],
  },
  {
    nombres: ['push-up', 'flexion', 'flexiones', 'flexiones de pecho', 'lagartija', 'pushup'],
    primario: ['chest', 'triceps'],
    secundario: ['front-deltoids', 'abs'],
    terciario: ['obliques', 'upper-back', 'forearm'],
  },
  {
    nombres: ['sentadilla', 'squat', 'sentadilla libre', 'air squat', 'bodyweight squat', 'sentadilla peso corporal'],
    primario: ['quadriceps', 'gluteal'],
    secundario: ['hamstring', 'lower-back', 'abs'],
    terciario: ['adductor', 'calves', 'obliques'],
  },
  {
    nombres: ['hip thrust', 'empuje de cadera', 'puente de gluteos', 'glute bridge', 'hip thrust con sandbag', 'hip thrust sandbag'],
    primario: ['gluteal'],
    secundario: ['hamstring', 'abs'],
    terciario: ['lower-back', 'adductor', 'quadriceps'],
  },
  {
    nombres: ['zancada', 'lunge', 'lunges', 'estocada', 'forward lunge', 'reverse lunge'],
    primario: ['quadriceps', 'gluteal'],
    secundario: ['hamstring', 'adductor'],
    terciario: ['abs', 'calves', 'lower-back'],
  },
  {
    nombres: ['burpee', 'burpees', 'burpee completo'],
    primario: ['quadriceps', 'chest', 'front-deltoids'],
    secundario: ['gluteal', 'triceps', 'abs'],
    terciario: ['hamstring', 'calves', 'obliques'],
  },
  {
    nombres: ['mountain climber', 'escalador', 'mountain climbers', 'escaladores'],
    primario: ['abs', 'obliques', 'front-deltoids'],
    secundario: ['quadriceps', 'triceps', 'chest'],
    terciario: ['gluteal', 'hamstring', 'lower-back'],
  },
  {
    nombres: ['superman', 'ejercicio superman', 'back extension superman'],
    primario: ['lower-back', 'gluteal'],
    secundario: ['hamstring', 'upper-back'],
    terciario: ['back-deltoids', 'abs', 'trapezius'],
  },
  {
    nombres: ['bird dog', 'perro pajaro', 'bird-dog', 'extension alterna cuadrupeda'],
    primario: ['lower-back', 'abs', 'gluteal'],
    secundario: ['obliques', 'hamstring'],
    terciario: ['back-deltoids', 'upper-back', 'quadriceps'],
  },
  {
    nombres: ['dead bug', 'insecto muerto', 'dead bug exercise'],
    primario: ['abs', 'obliques'],
    secundario: ['lower-back'],
    terciario: ['front-deltoids', 'quadriceps', 'hamstring'],
  },
  {
    nombres: ['hollow body', 'hollow hold', 'cuerpo hueco', 'hollow body hold'],
    primario: ['abs', 'obliques'],
    secundario: ['front-deltoids', 'quadriceps'],
    terciario: ['lower-back', 'chest', 'adductor'],
  },
  {
    nombres: ['press en banca', 'bench press', 'press banca', 'press de pecho', 'flat bench press'],
    primario: ['chest', 'triceps'],
    secundario: ['front-deltoids'],
    terciario: ['forearm', 'abs', 'upper-back'],
  },
  {
    nombres: ['peso muerto', 'deadlift', 'peso muerto convencional', 'conventional deadlift'],
    primario: ['hamstring', 'gluteal', 'lower-back'],
    secundario: ['upper-back', 'trapezius', 'quadriceps'],
    terciario: ['forearm', 'abs', 'adductor'],
  },
  {
    nombres: ['sentadilla con barra', 'barbell squat', 'back squat', 'sentadilla trasera', 'squat con barra'],
    primario: ['quadriceps', 'gluteal'],
    secundario: ['hamstring', 'lower-back', 'abs'],
    terciario: ['adductor', 'calves', 'trapezius'],
  },
  {
    nombres: ['press militar con barra', 'barbell overhead press', 'overhead press barra', 'military press barra'],
    primario: ['front-deltoids', 'triceps'],
    secundario: ['trapezius', 'upper-back'],
    terciario: ['abs', 'lower-back', 'forearm'],
  },
  {
    nombres: ['remo con barra', 'barbell row', 'bent over barbell row', 'remo inclinado barra', 'remo barra'],
    primario: ['upper-back', 'back-deltoids'],
    secundario: ['biceps', 'trapezius', 'lower-back'],
    terciario: ['forearm', 'hamstring', 'abs'],
  },
  {
    nombres: ['curl de biceps', 'bicep curl', 'curl biceps', 'barbell curl', 'dumbbell curl', 'curl con barra'],
    primario: ['biceps'],
    secundario: ['forearm'],
    terciario: ['front-deltoids'],
  },
  {
    nombres: ['press inclinado', 'incline press', 'incline bench press', 'press inclinado con barra', 'press inclinado mancuernas'],
    primario: ['chest', 'triceps'],
    secundario: ['front-deltoids'],
    terciario: ['forearm', 'abs', 'upper-back'],
  },
  {
    nombres: ['remo con mancuerna', 'dumbbell row', 'remo mancuerna', 'single arm dumbbell row', 'remo unilateral'],
    primario: ['upper-back', 'back-deltoids'],
    secundario: ['biceps', 'trapezius'],
    terciario: ['forearm', 'lower-back', 'obliques'],
  },
  {
    nombres: ['extension de triceps', 'tricep extension', 'skull crusher', 'overhead tricep extension', 'press frances'],
    primario: ['triceps'],
    secundario: ['forearm'],
    terciario: ['front-deltoids'],
  },
]

function normalize(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
}

export function detectarMusculos(nombre) {
  if (!nombre || nombre.trim().length < 3) return null
  const input = normalize(nombre)
  let bestMatch = null
  let bestScore = 0

  for (const ex of EXERCISE_DB) {
    for (const n of ex.nombres) {
      const norm = normalize(n)
      // Coincidencia exacta
      if (input === norm) return ex
      // El nombre del ejercicio contiene el candidato o viceversa
      if (input.includes(norm) || norm.includes(input)) {
        const score = norm.length
        if (score > bestScore) { bestScore = score; bestMatch = ex }
        continue
      }
      // Coincidencia por palabras clave (al menos 2 palabras en común)
      const inputWords = input.split(/\s+/).filter(w => w.length > 2)
      const normWords  = norm.split(/\s+/).filter(w => w.length > 2)
      const common = inputWords.filter(w => normWords.includes(w)).length
      if (common >= 2) {
        const score = common * 10
        if (score > bestScore) { bestScore = score; bestMatch = ex }
      }
    }
  }
  return bestMatch
}
