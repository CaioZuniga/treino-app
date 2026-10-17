import type { Exercise } from '../types'
import data from './exercises.json'

export const EXERCISES = data as Exercise[]
export const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

/** Mesmo commit usado em scripts/build-exercises.ts. */
const FEDB_COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5'

export function imageUrl(path: string): string {
  return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${FEDB_COMMIT}/exercises/${path}`
}

export function exerciseName(id: string): string {
  return EXERCISE_BY_ID.get(id)?.name ?? id
}
