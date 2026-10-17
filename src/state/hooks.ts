import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { latestProgram } from './actions'

// `undefined` = ainda carregando; `null` = não existe.

export function useProfile() {
  return useLiveQuery(async () => (await db.profile.get('me')) ?? null)
}

export function useEnvironments() {
  return useLiveQuery(() => db.environments.toArray())
}

export function useEnvironment(id: number | undefined) {
  return useLiveQuery(async () => (id ? ((await db.environments.get(id)) ?? null) : null), [id])
}

export function useProgram() {
  return useLiveQuery(async () => (await latestProgram()) ?? null)
}

export function useLogs() {
  return useLiveQuery(() => db.logs.orderBy('date').toArray())
}
