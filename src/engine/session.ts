import type { PlannedExercise } from '../types'

// Primeiro pedaço do motor (a Fase 2 completa o resto): estimativa da duração de uma sessão.
// Cada série conta o tempo de execução (cerca de 3 s por repetição) mais o descanso.

const SECONDS_PER_REP = 3

export function estimateStrengthMinutes(exercises: PlannedExercise[]): number {
  const seconds = exercises.reduce((total, ex) => {
    const avgReps = (ex.repsMin + ex.repsMax) / 2
    const work = avgReps * SECONDS_PER_REP
    // O descanso depois da última série não conta: a pessoa já vai para o próximo exercício.
    return total + ex.sets * work + (ex.sets - 1) * ex.restSec
  }, 0)
  return Math.round(seconds / 60)
}
