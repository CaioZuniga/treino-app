import { describe, expect, it } from 'vitest'
import type { SessionPlan } from '../types'
import { cycleInfo, deloadSession, deloadSuggestion } from './periodization'

const start = '2026-10-01T08:00:00'
const at = (days: number) => new Date(new Date(start).getTime() + days * 86_400_000 + 3_600_000)

describe('periodização', () => {
  it('conta as semanas do ciclo a partir do início', () => {
    expect(cycleInfo(start, at(0))).toEqual({ week: 1, deload: false, expired: false })
    expect(cycleInfo(start, at(13)).week).toBe(2)
    expect(cycleInfo(start, at(28))).toEqual({ week: 5, deload: true, expired: false })
    expect(cycleInfo(start, at(35))).toEqual({ week: 6, deload: false, expired: true })
  })

  it('deload reduz as séries em cerca de 40%, sem zerar', () => {
    const ex = (sets: number) => ({ exerciseId: 'x', slot: 'agachar', priority: 'principal', sets, unit: 'reps', repsMin: 8, repsMax: 10, restSec: 90 }) as const
    const session = { strength: [ex(4), ex(3), ex(2)], estimatedMinutes: 40, kcal: 300 } as unknown as SessionPlan
    const d = deloadSession(session)
    expect(d.strength.map((x) => x.sets)).toEqual([2, 2, 1])
    expect(d.estimatedMinutes).toBeLessThan(40)
    expect(d.kcal).toBeLessThan(300)
  })

  it('deload deixa a carga sugerida 10% mais leve', () => {
    // 62,5 × 0,9 = 56,25 → arredonda para a anilha de 0,5 kg mais próxima.
    expect(deloadSuggestion({ reason: 'subir', loadKg: 62.5 })).toEqual({ reason: 'semana_deload', loadKg: 56.5 })
    expect(deloadSuggestion({ reason: 'sem_historico' })).toEqual({ reason: 'sem_historico' })
  })
})
