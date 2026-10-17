import { describe, expect, it } from 'vitest'
import type { PlannedExercise } from '../types'
import { blockMinutes, estimateStrengthMinutes } from './session'

const ex = (p: Partial<PlannedExercise>): PlannedExercise => ({
  exerciseId: 'x',
  slot: 'agachar',
  priority: 'principal',
  sets: 4,
  unit: 'reps',
  repsMin: 8,
  repsMax: 10,
  restSec: 90,
  ...p,
})

describe('estimateStrengthMinutes', () => {
  it('soma execução e descanso entre séries', () => {
    // 4 séries de 9 reps (27 s cada) + 3 descansos de 90 s = 378 s ≈ 6 min
    expect(estimateStrengthMinutes([ex({})])).toBe(6)
  })

  it('conta segundos direto nos exercícios de sustentação', () => {
    // 3 × 30 s + 2 × 45 s = 180 s = 3 min
    expect(estimateStrengthMinutes([ex({ unit: 'seg', sets: 3, repsMin: 30, repsMax: 30, restSec: 45 })])).toBe(3)
  })

  it('retorna zero sem exercícios', () => {
    expect(estimateStrengthMinutes([])).toBe(0)
  })
})

describe('blockMinutes', () => {
  it('soma um minuto de transição por exercício', () => {
    expect(blockMinutes([ex({}), ex({})])).toBe(15)
  })
})
