import Dexie, { type EntityTable } from 'dexie'
import type { Environment, LiveWorkout, Profile, Program, WorkoutLog } from '../types'

// Banco local (IndexedDB). Os dados ficam só neste aparelho; o backup exporta tudo para JSON.
export const db = new Dexie('treino-app') as Dexie & {
  profile: EntityTable<Profile, 'id'>
  environments: EntityTable<Environment, 'id'>
  programs: EntityTable<Program, 'id'>
  logs: EntityTable<WorkoutLog, 'id'>
  live: EntityTable<LiveWorkout, 'id'>
}

db.version(1).stores({
  profile: 'id',
  environments: '++id, name',
  programs: '++id, createdAt',
  logs: '++id, date, programId',
})

db.version(2).stores({ live: 'id' })

export interface Backup {
  app: 'treino-app'
  version: 1
  exportedAt: string
  profile: Profile[]
  environments: Environment[]
  programs: Program[]
  logs: WorkoutLog[]
}

export async function exportBackup(): Promise<Backup> {
  const [profile, environments, programs, logs] = await Promise.all([
    db.profile.toArray(),
    db.environments.toArray(),
    db.programs.toArray(),
    db.logs.toArray(),
  ])
  return { app: 'treino-app', version: 1, exportedAt: new Date().toISOString(), profile, environments, programs, logs }
}

export async function importBackup(data: Backup): Promise<void> {
  if (data.app !== 'treino-app') throw new Error('Este arquivo não é um backup do Treino.')
  await db.transaction('rw', [db.profile, db.environments, db.programs, db.logs], async () => {
    await Promise.all([db.profile.clear(), db.environments.clear(), db.programs.clear(), db.logs.clear()])
    await db.profile.bulkAdd(data.profile)
    await db.environments.bulkAdd(data.environments)
    await db.programs.bulkAdd(data.programs)
    await db.logs.bulkAdd(data.logs)
  })
}
