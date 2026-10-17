import type { WorkoutLog } from '../types'
import type { SessionSets } from './progression'

// Leituras do histórico de treinos: base da progressão (regra 7), do resumo e da aba Progresso.

/** Sessões em que o exercício apareceu, em ordem cronológica, só com as séries feitas. */
export function exerciseHistory(logs: readonly WorkoutLog[], exerciseId: string): SessionSets[] {
  return [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({ date: l.date, sets: l.sets.filter((s) => s.exerciseId === exerciseId && s.done) }))
    .filter((s) => s.sets.length > 0)
}

/** Volume em kg: soma de carga × repetições das séries feitas. */
export function volumeKg(log: Pick<WorkoutLog, 'sets'>): number {
  return log.sets.filter((s) => s.done).reduce((t, s) => t + s.loadKg * s.reps, 0)
}

export function bestLoad(sets: readonly { loadKg: number; done: boolean }[]): number {
  return sets.filter((s) => s.done).reduce((m, s) => Math.max(m, s.loadKg), 0)
}

export interface PersonalRecord {
  exerciseId: string
  loadKg: number
  previousKg: number
}

/** Exercícios em que a maior carga deste treino superou todas as anteriores (com carga > 0). */
export function personalRecords(log: Pick<WorkoutLog, 'sets'>, previous: readonly WorkoutLog[]): PersonalRecord[] {
  const ids = [...new Set(log.sets.filter((s) => s.done).map((s) => s.exerciseId))]
  const out: PersonalRecord[] = []
  for (const exerciseId of ids) {
    const now = bestLoad(log.sets.filter((s) => s.exerciseId === exerciseId))
    const before = previous.flatMap((l) => l.sets.filter((s) => s.exerciseId === exerciseId))
    if (before.length === 0 || now <= 0) continue
    const previousKg = bestLoad(before)
    if (now > previousKg) out.push({ exerciseId, loadKg: now, previousKg })
  }
  return out
}

/** Maior carga de cada sessão, para o gráfico de evolução. */
export function loadSeries(logs: readonly WorkoutLog[], exerciseId: string): { date: string; loadKg: number }[] {
  return exerciseHistory(logs, exerciseId).map((s) => ({ date: s.date, loadKg: bestLoad(s.sets) }))
}

/** Exercícios já registrados com carga, do mais frequente para o menos. */
export function trackedExercises(logs: readonly WorkoutLog[]): string[] {
  const count = new Map<string, number>()
  for (const l of logs) {
    for (const id of new Set(l.sets.filter((s) => s.done && s.loadKg > 0).map((s) => s.exerciseId))) {
      count.set(id, (count.get(id) ?? 0) + 1)
    }
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

/** Data e hora local no formato AAAA-MM-DDTHH:MM. */
export function localStamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Volume legível: em kg abaixo de 1 tonelada, em toneladas com uma casa acima. */
export function formatVolume(kg: number): string {
  if (kg < 1000) return `${Math.round(kg)} kg`
  return `${String(Math.round(kg / 100) / 10).replace('.', ',')} t`
}
