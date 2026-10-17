import { describe, expect, it } from 'vitest'
import { estimateStrengthMinutes } from './session'

describe('estimateStrengthMinutes', () => {
  it('soma execução e descanso entre séries', () => {
    // 4 séries de 9 reps (27 s cada) + 3 descansos de 90 s = 378 s ≈ 6 min
    const min = estimateStrengthMinutes([
      { exerciseId: 'agachamento', slot: 'quad', sets: 4, repsMin: 8, repsMax: 10, restSec: 90 },
    ])
    expect(min).toBe(6)
  })

  it('retorna zero sem exercícios', () => {
    expect(estimateStrengthMinutes([])).toBe(0)
  })
})
