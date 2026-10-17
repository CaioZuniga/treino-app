import { describe, expect, it } from 'vitest'
import type { SetLog, WorkoutLog } from '../types'
import { exerciseHistory, liveElapsedMs, loadSeries, localStamp, personalRecords, trackedExercises, volumeKg } from './history'

const set = (exerciseId: string, loadKg: number, reps: number, done = true): SetLog => ({ exerciseId, setIndex: 0, loadKg, reps, done })
const log = (date: string, sets: SetLog[]): WorkoutLog => ({
  date,
  programId: 1,
  sessionKey: 'A',
  sessionTitle: 'A',
  environmentId: 1,
  sets,
  cardioMinutes: 0,
  durationMin: 50,
  kcal: 300,
})

const logs = [
  log('2026-10-10T08:00', [set('squat', 60, 10), set('squat', 60, 9), set('curl', 12, 12)]),
  log('2026-10-03T08:00', [set('squat', 55, 10), set('squat', 55, 10, false)]),
  log('2026-10-14T08:00', [set('curl', 14, 10)]),
]

describe('histórico', () => {
  it('exerciseHistory ordena por data e ignora séries não feitas', () => {
    const h = exerciseHistory(logs, 'squat')
    expect(h.map((s) => s.date)).toEqual(['2026-10-03T08:00', '2026-10-10T08:00'])
    expect(h[0].sets).toHaveLength(1)
  })

  it('volumeKg soma carga × repetições das séries feitas', () => {
    expect(volumeKg(logs[1])).toBe(550)
  })

  it('personalRecords só conta quando supera o histórico', () => {
    const today = log('2026-10-17T08:00', [set('squat', 62.5, 8), set('curl', 12, 12), set('novo', 20, 10)])
    expect(personalRecords(today, logs)).toEqual([{ exerciseId: 'squat', loadKg: 62.5, previousKg: 60 }])
  })

  it('loadSeries traz a maior carga de cada sessão', () => {
    expect(loadSeries(logs, 'squat').map((p) => p.loadKg)).toEqual([55, 60])
  })

  it('trackedExercises ordena pelos mais frequentes', () => {
    expect(trackedExercises(logs)).toEqual(['squat', 'curl'])
  })

  it('liveElapsedMs desconta as pausas, inclusive a que está em curso', () => {
    // Começou em 0, ficou 5 min pausado antes e está pausado desde 20 min: em 30 min, contam 15 min.
    const min = 60_000
    expect(liveElapsedMs({ startedAt: 0, pausedMs: 5 * min, pausedAt: 20 * min }, 30 * min)).toBe(15 * min)
    expect(liveElapsedMs({ startedAt: 0 }, 30 * min)).toBe(30 * min)
  })

  it('localStamp usa a hora local', () => {
    expect(localStamp(new Date(2026, 9, 17, 7, 5))).toBe('2026-10-17T07:05')
  })
})
