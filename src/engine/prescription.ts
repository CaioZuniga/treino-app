import type { Goal, Level, Pattern, PlannedExercise, Priority } from '../types'

// Regra 3: séries pelo nível, repetições e descanso pelo objetivo, ambos ajustados pela prioridade da vaga.

const SETS: Record<Level, Record<Priority, number>> = {
  iniciante: { principal: 3, secundario: 3, acessorio: 2 },
  intermediario: { principal: 4, secundario: 3, acessorio: 3 },
  avancado: { principal: 4, secundario: 4, acessorio: 3 },
}

interface Scheme {
  repsMin: number
  repsMax: number
  restSec: number
}

const SCHEMES: Record<Goal, Record<Priority, Scheme>> = {
  hipertrofia: {
    principal: { repsMin: 6, repsMax: 10, restSec: 120 },
    secundario: { repsMin: 8, repsMax: 12, restSec: 90 },
    acessorio: { repsMin: 10, repsMax: 15, restSec: 60 },
  },
  forca: {
    principal: { repsMin: 3, repsMax: 6, restSec: 180 },
    secundario: { repsMin: 6, repsMax: 8, restSec: 120 },
    acessorio: { repsMin: 8, repsMax: 12, restSec: 90 },
  },
  emagrecimento: {
    principal: { repsMin: 8, repsMax: 12, restSec: 75 },
    secundario: { repsMin: 10, repsMax: 15, restSec: 60 },
    acessorio: { repsMin: 12, repsMax: 15, restSec: 45 },
  },
  condicionamento: {
    principal: { repsMin: 10, repsMax: 12, restSec: 60 },
    secundario: { repsMin: 12, repsMax: 15, restSec: 45 },
    acessorio: { repsMin: 15, repsMax: 20, restSec: 30 },
  },
}

/** Exercícios de sustentação: a prescrição é em segundos. */
export const TIMED_IDS = new Set(['Plank', 'Side_Bridge', 'custom_deep_squat_hold'])

const CORE: Pattern[] = ['core_estab', 'core_flexao', 'core_rot', 'lombar']

export function prescribe(
  exerciseId: string,
  slot: Pattern,
  priority: Priority,
  level: Level,
  goal: Goal,
): PlannedExercise {
  const sets = SETS[level][priority]
  if (TIMED_IDS.has(exerciseId)) {
    const hold = level === 'iniciante' ? [20, 30] : level === 'intermediario' ? [30, 45] : [45, 60]
    return { exerciseId, slot, priority, sets, unit: 'seg', repsMin: hold[0], repsMax: hold[1], restSec: 45 }
  }
  // Core não precisa de carga máxima: faixa alta e descanso curto em qualquer objetivo.
  if (CORE.includes(slot)) {
    return { exerciseId, slot, priority, sets, unit: 'reps', repsMin: 10, repsMax: 15, restSec: 45 }
  }
  return { exerciseId, slot, priority, sets, unit: 'reps', ...SCHEMES[goal][priority] }
}
