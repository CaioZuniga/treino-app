import type { PlannedExercise } from '../types'

// Regra 4 (estimativa): cada série conta o tempo de execução (cerca de 3 s por repetição) mais o descanso.

const SECONDS_PER_REP = 3
/** Tempo para trocar de aparelho, ajustar carga e se posicionar. */
export const TRANSITION_SEC = 60

function workSeconds(ex: PlannedExercise): number {
  const avg = (ex.repsMin + ex.repsMax) / 2
  return ex.unit === 'seg' ? avg : avg * SECONDS_PER_REP
}

export function exerciseSeconds(ex: PlannedExercise): number {
  // O descanso depois da última série não conta: a pessoa já vai para o próximo exercício.
  return ex.sets * workSeconds(ex) + (ex.sets - 1) * ex.restSec
}

export function estimateStrengthMinutes(exercises: PlannedExercise[]): number {
  return Math.round(exercises.reduce((total, ex) => total + exerciseSeconds(ex), 0) / 60)
}

/** Duração do bloco inteiro, incluindo a troca entre exercícios. */
export function blockMinutes(exercises: PlannedExercise[], transitionSec = TRANSITION_SEC): number {
  const seconds = exercises.reduce((total, ex) => total + exerciseSeconds(ex) + transitionSec, 0)
  return Math.round(seconds / 60)
}
