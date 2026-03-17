import { defineStore } from 'pinia'
import { db } from '../firebase.js'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const EQUIPO_MAP = {
  'kb':   { label: 'Kettlebell',  color: '#44cc88', bg: '#1a2e1a' },
  'sb':   { label: 'Sandbag',     color: '#ff8844', bg: '#2e1a1a' },
  'bb':   { label: 'Barra',       color: '#4488ff', bg: '#1a1a2e' },
  'db':   { label: 'Mancuerna',   color: '#cc88ff', bg: '#2a1a2e' },
  'bw':   { label: 'Peso corporal', color: '#a0a0a0', bg: '#222222' },
  'band': { label: 'Banda',       color: '#44cccc', bg: '#1a2e2e' },
  'trx':  { label: 'TRX',         color: '#ffcc44', bg: '#2e2a1a' },
}

export const MUSCLE_LABELS = {
  'chest':          'Pecho',
  'obliques':       'Oblicuos',
  'abs':            'Abdomen',
  'biceps':         'Bíceps',
  'triceps':        'Tríceps',
  'neck':           'Cuello',
  'front-deltoids': 'Hombros (front.)',
  'abductors':      'Abductores',
  'quadriceps':     'Cuádriceps',
  'calves':         'Gemelos',
  'forearm':        'Antebrazos',
  'trapezius':      'Trapecio',
  'upper-back':     'Dorsales',
  'lower-back':     'Lumbar',
  'back-deltoids':  'Hombros (post.)',
  'gluteal':        'Glúteos',
  'adductor':       'Aductores',
  'hamstring':      'Isquiotibiales',
  'left-soleus':    'Sóleos',
}

export const EQUIPO_OPTIONS = [
  ['', '—'],
  ['kb', 'Kettlebell (KB)'],
  ['sb', 'Sandbag (SB)'],
  ['bb', 'Barra'],
  ['db', 'Mancuerna'],
  ['bw', 'Peso corporal'],
  ['band', 'Banda'],
  ['trx', 'TRX'],
]

function defaultRutinas() {
  return [
    { id: 'r1', nombre: 'Día 1 — Empuje', desc: 'Pecho · Hombros · Core', ejercicios: [
      { id: 'e1', nombre: 'Sandbag bear hug squat', series: 3, reps: '10', equipo: 'sb', tipoMedida: 'reps', notas: '' },
      { id: 'e2', nombre: 'KB floor press un brazo', series: 4, reps: '8 c/lado', equipo: 'kb', tipoMedida: 'reps', notas: '' },
      { id: 'e3', nombre: 'Sandbag shouldering', series: 4, reps: '5 c/lado', equipo: 'sb', tipoMedida: 'reps', notas: '' },
      { id: 'e4', nombre: 'KB press militar un brazo', series: 3, reps: '8 c/lado', equipo: 'kb', tipoMedida: 'reps', notas: '' },
      { id: 'e5', nombre: 'Sandbag over shoulder', series: 3, reps: '6 c/lado', equipo: 'sb', tipoMedida: 'reps', notas: '' },
      { id: 'e6', nombre: 'Plancha en sandbag', series: 3, reps: '40', equipo: 'sb', tipoMedida: 'time', notas: '' }
    ]},
    { id: 'r2', nombre: 'Día 2 — Jalón', desc: 'Espalda · Bíceps · Agarre', ejercicios: [
      { id: 'e7', nombre: 'KB swing', series: 4, reps: '15', equipo: 'kb', tipoMedida: 'reps', notas: '' },
      { id: 'e8', nombre: 'Sandbag bent over row', series: 4, reps: '10', equipo: 'sb', tipoMedida: 'reps', notas: '' },
      { id: 'e9', nombre: 'Dominada negativa', series: 4, reps: '5', equipo: '', tipoMedida: 'reps', notas: '' },
      { id: 'e10', nombre: 'Sandbag bear hug carry', series: 3, reps: '30', equipo: 'sb', tipoMedida: 'dist', notas: '' },
      { id: 'e11', nombre: 'KB clean un brazo', series: 3, reps: '6 c/lado', equipo: 'kb', tipoMedida: 'reps', notas: '' },
      { id: 'e12', nombre: 'KB farmer carry', series: 3, reps: '40', equipo: 'kb', tipoMedida: 'dist', notas: '' }
    ]},
    { id: 'r3', nombre: 'Día 3 — Piernas', desc: 'Glúteos · Cuádriceps · Potencia', ejercicios: [
      { id: 'e13', nombre: 'Sandbag zercher squat', series: 4, reps: '8', equipo: 'sb', tipoMedida: 'reps', notas: '' },
      { id: 'e14', nombre: 'KB goblet squat', series: 4, reps: '10', equipo: 'kb', tipoMedida: 'reps', notas: '' },
      { id: 'e15', nombre: 'Sandbag shouldering + squat', series: 3, reps: '4 c/lado', equipo: 'sb', tipoMedida: 'reps', notas: '' },
      { id: 'e16', nombre: 'Hip thrust con sandbag', series: 4, reps: '12', equipo: 'sb', tipoMedida: 'reps', notas: '' },
      { id: 'e17', nombre: 'KB swing finalizador', series: 3, reps: '15', equipo: 'kb', tipoMedida: 'reps', notas: '' },
      { id: 'e18', nombre: 'Sandbag drag', series: 3, reps: '10', equipo: 'sb', tipoMedida: 'dist', notas: '' }
    ]}
  ]
}

export const useStore = defineStore('mulemode', {
  state: () => ({
    uid: null,
    authChecked: false,
    rutinas: [],
    historial: [],
    videos: {},
    geminiKey: '',
    genero: '',
    equipoPreferido: [],
    equipoCustom: [],   // [{ id: 'cx_...', label: 'Anillas' }]
    planes: [],         // [{ id: 'p_...', nombre: '...' }]
    peso: '',
    altura: '',
    diasSemana: 4,
    memoriaEntrenador: '',
    workout: null,
    pendingRegistro: null,
    // timer
    restTotal: 90,
    restRemaining: 0,
    restStartTime: 0,
    restVisible: false,
    restInterval: null,
    wkElapsed: 0,
    wkInterval: null,
    // modals
    editingRutinaId: null,
    rutinaModalVisible: false,
    generarRutinaModalVisible: false,
    videoModalVisible: false,
    videoModalTitle: '',
    videoModalUrl: '',
    currentVideoExKey: null,
    summaryVisible: false,
    // toast
    toastMessage: '',
    toastVisible: false,
    _toastTimeout: null,
  }),

  getters: {
    // Merge standard equipment with user custom equipment
    allEquipos: (s) => {
      const custom = Object.fromEntries(
        (s.equipoCustom || []).map(e => [e.id, { label: e.label, color: '#c0c0c0', bg: '#252525' }])
      )
      return { ...EQUIPO_MAP, ...custom }
    },
    allEquipoOptions: (s) => {
      const custom = (s.equipoCustom || []).map(e => [e.id, e.label])
      return [['', '—'], ...Object.entries(EQUIPO_MAP).map(([v, { label }]) => [v, label]), ...custom]
    },

    totalEntrenamientos: (s) => s.historial.length,

    totalVolumen: (s) => {
      let total = 0
      s.historial.forEach(h => h.ejercicios && h.ejercicios.forEach(e =>
        e.series && e.series.forEach(serie => {
          if (serie.peso && serie.reps && serie.done)
            total += (parseFloat(serie.peso) || 0) * (parseFloat(serie.reps) || 0)
        })
      ))
      return total
    },

    totalVolStr() {
      const v = this.totalVolumen
      return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v).toString()
    },

    semanaActual: (s) => {
      const hoyD = new Date(); hoyD.setHours(0, 0, 0, 0)
      const inicioSemana = new Date(hoyD)
      inicioSemana.setDate(hoyD.getDate() - hoyD.getDay())
      return s.historial.filter(h => new Date(h.fecha) >= inicioSemana).length
    },

    rachaActiva: (s) => {
      if (s.historial.length === 0) return 0
      const fechas = [...new Set(s.historial.map(h => h.fecha.split('T')[0]))].sort().reverse()
      let racha = 0
      let prev = new Date(); prev.setHours(0, 0, 0, 0)
      for (const f of fechas) {
        const d = new Date(f); d.setHours(0, 0, 0, 0)
        const diff = (prev - d) / 86400000
        if (diff <= 1) { racha++; prev = d } else break
      }
      return racha
    },

    wkTimerStr: (s) => {
      const m = Math.floor(s.wkElapsed / 60)
      const sec = s.wkElapsed % 60
      return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    },

    restProgress: (s) => s.restTotal > 0 ? s.restRemaining / s.restTotal : 0,

    restDashOffset: (s) => {
      const progress = s.restTotal > 0 ? s.restRemaining / s.restTotal : 0
      return (502.65 * (1 - progress)).toFixed(2)
    },

    fechaHoy: () => {
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const hoy = new Date()
      return `${dias[hoy.getDay()]}, ${hoy.getDate()} ${meses[hoy.getMonth()]}`
    },

    allExerciseNames: (s) =>
      [...new Set(s.historial.flatMap(h => h.ejercicios ? h.ejercicios.map(e => e.nombre) : []))],
  },

  actions: {
    // ── PERSISTENCIA ──────────────────────────────────────────────
    async load(uid) {
      this.uid = uid
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        if (snap.exists()) {
          const d = snap.data()
          this.rutinas   = d.rutinas  || defaultRutinas()
          this.historial = d.historial || []
          this.videos    = d.videos   || {}
          this.geminiKey         = d.geminiKey         || ''
          this.genero            = d.genero            || ''
          this.equipoPreferido   = d.equipoPreferido   || []
          this.equipoCustom      = d.equipoCustom      || []
          this.planes            = d.planes            || []
          this.peso              = d.peso              || ''
          this.altura            = d.altura            || ''
          this.diasSemana        = d.diasSemana        || 4
          this.memoriaEntrenador = d.memoriaEntrenador || ''
          if (d.workout) {
            this.workout = d.workout
            this.wkElapsed = Math.floor((Date.now() - d.workout.startTime) / 1000)
            if (this.wkInterval) clearInterval(this.wkInterval)
            this.wkInterval = setInterval(() => {
              if (this.workout) this.wkElapsed = Math.floor((Date.now() - this.workout.startTime) / 1000)
            }, 1000)
          }
        } else {
          this.rutinas  = defaultRutinas()
          this.historial = []
          this.videos   = {}
        }
      } catch (e) {
        console.error('load error', e)
        this.rutinas  = defaultRutinas()
        this.historial = []
        this.videos   = {}
      }
    },

    save() {
      if (!this.uid) return
      const data = JSON.parse(JSON.stringify({
        rutinas:           this.rutinas,
        historial:         this.historial,
        videos:            this.videos,
        geminiKey:         this.geminiKey,
        genero:            this.genero,
        equipoPreferido:   this.equipoPreferido,
            equipoCustom:      this.equipoCustom,
        planes:            this.planes,
        peso:              this.peso,
        altura:            this.altura,
        diasSemana:        this.diasSemana,
        memoriaEntrenador: this.memoriaEntrenador,
        workout:           this.workout || null,
      }))
      setDoc(doc(db, 'users', this.uid), data).catch(e => console.error('save error', e))
    },

    // ── RUTINAS ──────────────────────────────────────────────────
    abrirNuevaRutina() {
      this.editingRutinaId = null
      this.rutinaModalVisible = true
    },

    editarRutina(id) {
      this.editingRutinaId = id
      this.rutinaModalVisible = true
    },

    guardarRutina(nombre, desc, ejercicios) {
      if (this.editingRutinaId) {
        const idx = this.rutinas.findIndex(r => r.id === this.editingRutinaId)
        if (idx !== -1) this.rutinas[idx] = { ...this.rutinas[idx], nombre, desc, ejercicios }
      } else {
        this.rutinas.push({ id: 'r' + Date.now(), nombre, desc, ejercicios })
      }
      this.save()
      this.rutinaModalVisible = false
      this.showToast('Rutina guardada ✓')
    },

    eliminarRutinaActual() {
      this.rutinas = this.rutinas.filter(r => r.id !== this.editingRutinaId)
      this.save()
      this.rutinaModalVisible = false
      this.showToast('Rutina eliminada')
    },

    agregarEjercicioARutina(rutinaId, ejercicio) {
      const r = this.rutinas.find(r => r.id === rutinaId)
      if (r) { r.ejercicios.push(ejercicio); this.save() }
    },

    quitarEjercicioDeRutina(rutinaId, ejercicioNombre) {
      const r = this.rutinas.find(r => r.id === rutinaId)
      if (r) { r.ejercicios = r.ejercicios.filter(e => e.nombre !== ejercicioNombre); this.save() }
    },

    // ── PLANES ────────────────────────────────────────────────────
    crearPlan(nombre) {
      const id = 'p_' + Date.now()
      this.planes.push({ id, nombre })
      this.save()
      return id
    },

    eliminarPlan(planId) {
      this.planes = this.planes.filter(p => p.id !== planId)
      this.rutinas.forEach(r => { if (r.planId === planId) r.planId = null })
      this.save()
    },

    renamePlan(planId, nombre) {
      const p = this.planes.find(p => p.id === planId)
      if (p) { p.nombre = nombre; this.save() }
    },

    moverRutinaAPlan(rutinaId, planId) {
      const r = this.rutinas.find(r => r.id === rutinaId)
      if (r) { r.planId = planId; this.save() }
    },

    quitarRutinaDePlan(rutinaId) {
      const r = this.rutinas.find(r => r.id === rutinaId)
      if (r) { r.planId = null; this.save() }
    },

    crearRutinaConEjercicio(ejercicio) {
      this.rutinas.push({ id: 'r' + Date.now(), nombre: 'Nueva rutina', desc: '', ejercicios: [ejercicio] })
      this.save()
    },

    // ── ENTRENAMIENTO ─────────────────────────────────────────────
    iniciarEntrenamiento(rutinaId) {
      const rutina = this.rutinas.find(r => r.id === rutinaId)
      if (!rutina) return
      this.workout = {
        rutinaId,
        rutinaName: rutina.nombre,
        startTime: Date.now(),
        ejercicios: rutina.ejercicios.map(e => ({
          ...e,
          notaSession: '',
          pr: [],
          series: Array.from({ length: e.series }, (_, i) => ({
            idx: i + 1,
            peso: '',
            reps: e.reps.replace(/[^0-9]/g, '') || '',
            done: false,
          })),
        })),
      }
      this.restTotal = 90
      this.wkElapsed = 0
      if (this.wkInterval) clearInterval(this.wkInterval)
      this.wkInterval = setInterval(() => {
        if (this.workout) this.wkElapsed = Math.floor((Date.now() - this.workout.startTime) / 1000)
      }, 1000)
      this.save()
    },

    updateSerie(ei, si, field, val) {
      if (this.workout) this.workout.ejercicios[ei].series[si][field] = val
    },

    toggleSerie(ei, si) {
      if (!this.workout) return
      const ex = this.workout.ejercicios[ei]
      const s = ex.series[si]
      s.done = !s.done
      if (s.done) {
        if (this.checkPR(ex.nombre, s.peso)) {
          this.showToast('⭐ Nuevo récord: ' + ex.nombre)
          if (!ex.pr) ex.pr = []
          ex.pr.push(s.peso)
        }
        this.iniciarDescanso(ex.descansoRecomendado || 90)
      }
      this.save()
    },

    addSerie(ei) {
      if (!this.workout) return
      const ex = this.workout.ejercicios[ei]
      ex.series.push({ idx: ex.series.length + 1, peso: '', reps: '', done: false })
    },

    updateExNota(ei, val) {
      if (this.workout) this.workout.ejercicios[ei].notaSession = val
    },

    updateWorkoutExercise(ei, { nombre, reps, equipo, descansoRecomendado, series }) {
      if (!this.workout) return
      const ex = this.workout.ejercicios[ei]
      if (nombre !== undefined)              ex.nombre = nombre
      if (reps !== undefined)               ex.reps   = reps
      if (equipo !== undefined)             ex.equipo = equipo
      if (descansoRecomendado !== undefined) ex.descansoRecomendado = descansoRecomendado
      if (series !== undefined) {
        const current = ex.series.length
        if (series > current) {
          for (let i = current; i < series; i++)
            ex.series.push({ idx: i + 1, peso: '', reps: ex.reps.replace(/[^0-9]/g, '') || '', done: false })
        } else if (series < current && series >= 1) {
          ex.series = ex.series.slice(0, series)
        }
        // Re-index
        ex.series.forEach((s, i) => { s.idx = i + 1 })
      }
      this.save()
    },

    terminarEntrenamiento() {
      if (!this.workout) return
      if (this.wkInterval) clearInterval(this.wkInterval)
      const duracion = Math.floor((Date.now() - this.workout.startTime) / 1000)
      const vol = this.workout.ejercicios.reduce((a, e) =>
        a + e.series.filter(s => s.done && s.peso && s.reps)
          .reduce((b, s) => b + (parseFloat(s.peso) || 0) * (parseFloat(s.reps) || 0), 0), 0)
      const prs = this.workout.ejercicios.filter(e => e.pr && e.pr.length > 0).map(e => e.nombre)
      this.pendingRegistro = {
        id: 'h' + Date.now(),
        fecha: new Date().toISOString(),
        rutinaName: this.workout.rutinaName,
        duracion,
        volumen: vol,
        prs,
        ejercicios: this.workout.ejercicios.map(e => ({
          nombre: e.nombre,
          equipo: e.equipo || '',
          tipoMedida: e.tipoMedida || 'reps',
          notas: e.notaSession || '',
          descansoSeg: e.descansoRecomendado || 90,
          musculos: e.musculos || [],
          series: e.series,
          pr: e.pr || [],
        })),
      }
      this.summaryVisible = true
    },

    guardarYSalir() {
      if (!this.pendingRegistro) return
      this.historial.unshift(this.pendingRegistro)
      this.pendingRegistro = null
      this.workout = null
      this.summaryVisible = false
      this.save()
      this.showToast('Entrenamiento guardado ✓')
    },

    descartarEntrenamiento() {
      if (this.wkInterval) clearInterval(this.wkInterval)
      this.workout = null
      this.pendingRegistro = null
      this.summaryVisible = false
      this.save()
    },

    // ── DESCANSO ──────────────────────────────────────────────────
    iniciarDescanso(seg) {
      const duration = seg ?? this.restTotal
      if (this.restInterval) clearInterval(this.restInterval)
      this.restTotal     = duration
      this.restStartTime = Date.now()
      this.restRemaining = duration
      this.restVisible   = true
      // Persist so the timer survives if Android kills the PWA in background
      localStorage.setItem('mulemode_rest_timer', JSON.stringify({ startTime: this.restStartTime, total: duration }))
      this.restInterval  = setInterval(() => {
        this.restRemaining = Math.max(0, this.restTotal - Math.floor((Date.now() - this.restStartTime) / 1000))
        if (this.restRemaining <= 0) this.saltarDescanso()
      }, 500)
    },

    saltarDescanso() {
      if (this.restInterval) clearInterval(this.restInterval)
      this.restVisible = false
      localStorage.removeItem('mulemode_rest_timer')
    },

    ajustarDescanso(delta) {
      // Shift the virtual start time so restRemaining changes by delta
      this.restStartTime -= delta * 1000
      this.restRemaining = Math.max(5, this.restTotal - Math.floor((Date.now() - this.restStartTime) / 1000))
    },

    recalcularTimers() {
      if (this.workout) this.wkElapsed = Math.floor((Date.now() - this.workout.startTime) / 1000)

      if (this.restVisible && this.restStartTime) {
        this.restRemaining = Math.max(0, this.restTotal - Math.floor((Date.now() - this.restStartTime) / 1000))
        if (this.restRemaining <= 0) this.saltarDescanso()
      } else {
        // App may have been killed and reloaded — try to restore from localStorage
        try {
          const saved = localStorage.getItem('mulemode_rest_timer')
          if (saved) {
            const { startTime, total } = JSON.parse(saved)
            const remaining = Math.max(0, total - Math.floor((Date.now() - startTime) / 1000))
            if (remaining > 0) {
              this.restTotal     = total
              this.restStartTime = startTime
              this.restRemaining = remaining
              this.restVisible   = true
              if (this.restInterval) clearInterval(this.restInterval)
              this.restInterval = setInterval(() => {
                this.restRemaining = Math.max(0, this.restTotal - Math.floor((Date.now() - this.restStartTime) / 1000))
                if (this.restRemaining <= 0) this.saltarDescanso()
              }, 500)
            } else {
              localStorage.removeItem('mulemode_rest_timer')
            }
          }
        } catch {}
      }
    },

    // ── HELPERS ───────────────────────────────────────────────────
    getLastPeso(exNombre, serieIdx) {
      for (const h of this.historial) {
        const ex = h.ejercicios && h.ejercicios.find(e => e.nombre === exNombre)
        if (ex && ex.series && ex.series[serieIdx] && ex.series[serieIdx].peso) {
          return ex.series[serieIdx].peso
        }
      }
      return ''
    },

    checkPR(exNombre, peso) {
      if (!peso || parseFloat(peso) <= 0) return false
      const pesoNum = parseFloat(peso)
      let historicalMax = 0
      for (const h of this.historial) {
        const ex = h.ejercicios && h.ejercicios.find(e => e.nombre === exNombre)
        if (ex && ex.series) {
          ex.series.filter(s => s.done && s.peso).forEach(s => {
            const p = parseFloat(s.peso) || 0
            if (p > historicalMax) historicalMax = p
          })
        }
      }
      return pesoNum > historicalMax
    },

    // ── VIDEO ─────────────────────────────────────────────────────
    abrirVideo(exId, exNombre) {
      this.currentVideoExKey = exId
      this.videoModalTitle = exNombre
      this.videoModalUrl = this.videos[exId] || ''
      this.videoModalVisible = true
    },

    guardarVideo(url) {
      if (this.currentVideoExKey) {
        if (url) this.videos[this.currentVideoExKey] = url
        else delete this.videos[this.currentVideoExKey]
        this.rutinas.forEach(r => r.ejercicios && r.ejercicios.forEach(e => {
          if (e.id === this.currentVideoExKey) e.video = url
        }))
        this.save()
      }
      this.showToast('Video guardado ✓')
    },

    // ── HISTORIAL ─────────────────────────────────────────────────
    eliminarHistorial(id) {
      this.historial = this.historial.filter(h => h.id !== id)
      this.save()
      this.showToast('Entrenamiento eliminado')
    },

    // ── TOAST ─────────────────────────────────────────────────────
    showToast(message) {
      if (this._toastTimeout) clearTimeout(this._toastTimeout)
      this.toastMessage = message
      this.toastVisible = true
      this._toastTimeout = setTimeout(() => { this.toastVisible = false }, 2500)
    },
  },
})
