import type { Effort, Exercise, Pattern, PlannedExercise } from '../types'

// Regra 7: progressão dupla, ajustada pelo esforço percebido de cada série.
// - Fechou todas as séries no topo da faixa → sobe a carga. Se todas foram "fácil", sobe o dobro.
// - Ainda dentro da faixa, mas todas as séries "fácil" → a carga está leve: sobe mesmo assim.
// - Abaixo do mínimo da faixa em duas sessões seguidas → deload de 10%.

export interface SessionSets {
  date: string
  sets: { loadKg: number; reps: number; done: boolean; effort?: Effort }[]
}

export type LoadReason = 'sem_historico' | 'subir' | 'subir_mais' | 'leve' | 'manter' | 'deload' | 'semana_deload'

export interface LoadSuggestion {
  loadKg?: number
  reason: LoadReason
}

const HEAVY_LOWER: Pattern[] = ['agachar', 'dobradica', 'gluteo']

export function loadIncrement(exercise: Pick<Exercise, 'pattern' | 'mechanic'>): number {
  return HEAVY_LOWER.includes(exercise.pattern) && exercise.mechanic === 'composto' ? 5 : 2.5
}

/** Arredonda para o múltiplo de 0,5 kg mais próximo (menor anilha comum). */
const round05 = (kg: number) => Math.round(kg * 2) / 2

const topLoad = (s: SessionSets) => Math.max(...s.sets.map((x) => x.loadKg))
const doneSets = (s: SessionSets) => s.sets.filter((x) => x.done)

function hitTop(s: SessionSets, plan: PlannedExercise): boolean {
  const done = doneSets(s)
  return done.length >= plan.sets && done.every((x) => x.reps >= plan.repsMax)
}

function missed(s: SessionSets, plan: PlannedExercise): boolean {
  return s.sets.some((x) => x.done && x.reps < plan.repsMin)
}

/** Todas as séries feitas foram marcadas como fáceis (precisa de pelo menos uma marcação). */
function allEasy(s: SessionSets): boolean {
  const done = doneSets(s)
  return done.length > 0 && done.every((x) => x.effort === 'facil')
}

/** `history` em ordem cronológica (a sessão mais recente por último). */
export function suggestLoad(
  plan: PlannedExercise,
  exercise: Pick<Exercise, 'pattern' | 'mechanic'>,
  history: readonly SessionSets[],
): LoadSuggestion {
  const sessions = history.filter((s) => s.sets.length > 0)
  const last = sessions.at(-1)
  if (!last) return { reason: 'sem_historico' }

  const current = topLoad(last)
  const step = loadIncrement(exercise)
  if (hitTop(last, plan)) {
    return allEasy(last) ? { reason: 'subir_mais', loadKg: round05(current + 2 * step) } : { reason: 'subir', loadKg: round05(current + step) }
  }

  const previous = sessions.at(-2)
  if (previous && missed(last, plan) && missed(previous, plan)) {
    return { reason: 'deload', loadKg: round05(current * 0.9) }
  }
  if (allEasy(last) && !missed(last, plan)) return { reason: 'leve', loadKg: round05(current + step) }
  return { reason: 'manter', loadKg: current }
}
