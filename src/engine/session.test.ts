import { describe, expect, it } from 'vitest'
import type { PlannedExercise } from '../types'
import { blockMinutes, cleanGroups, estimateStrengthMinutes, groupIndexes, pairAccessories } from './session'

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

describe('superséries', () => {
  const acc = (id: string, slot: PlannedExercise['slot'] = 'biceps') => ex({ exerciseId: id, slot, priority: 'acessorio', sets: 3, repsMin: 10, repsMax: 12, restSec: 60 })

  it('em supersérie o bloco fica mais curto que separado', () => {
    const separate = blockMinutes([acc('a'), acc('b')])
    const together = blockMinutes([{ ...acc('a'), group: 'S1' }, { ...acc('b'), group: 'S1' }])
    expect(together).toBeLessThan(separate)
  })

  it('pairAccessories junta acessórios vizinhos e deixa core e principais de fora', () => {
    const out = pairAccessories([ex({ exerciseId: 'p' }), acc('a'), acc('b'), acc('c'), acc('core', 'core_estab')])
    expect(out.map((x) => x.group)).toEqual([undefined, 'S1', 'S1', undefined, undefined])
    expect(groupIndexes(out)).toEqual([[0], [1, 2], [3], [4]])
  })

  it('pairAccessories aproxima acessórios separados por outro exercício', () => {
    const out = pairAccessories([acc('a'), ex({ exerciseId: 's', priority: 'secundario' }), acc('b')])
    expect(out.map((x) => x.exerciseId)).toEqual(['a', 'b', 's'])
    expect(out[0].group).toBe(out[1].group)
  })

  it('cleanGroups tira a marca de quem ficou sem par', () => {
    expect(cleanGroups([{ ...acc('a'), group: 'S1' }, acc('b')])[0].group).toBeUndefined()
  })
})
