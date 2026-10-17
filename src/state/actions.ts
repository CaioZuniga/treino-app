import { EXERCISE_BY_ID, EXERCISES } from '../data/catalog'
import { db } from '../db/db'
import { generateProgram, suggestLoad } from '../engine'
import { kcal, MET } from '../engine/cardio'
import { exerciseHistory, liveElapsedMs, localStamp } from '../engine/history'
import { prescribe } from '../engine/prescription'
import type { Environment, LiveWorkout, Profile, Program, SetLog, WorkoutLog } from '../types'

// Tudo que grava no banco local passa por aqui. As telas leem pelos hooks (state/hooks.ts).

export async function latestProgram(): Promise<Program | undefined> {
  return db.programs.orderBy('createdAt').last()
}

/**
 * Gera o treino de novo para o perfil e o ambiente ativo.
 * Mantém a semente atual, a não ser que `newVariation` peça outra combinação de exercícios.
 */
export async function regenerate(opts: { newVariation?: boolean } = {}): Promise<void> {
  const profile = await db.profile.get('me')
  if (!profile?.activeEnvironmentId) return
  const environment = await db.environments.get(profile.activeEnvironmentId)
  if (!environment) return
  const current = await latestProgram()
  const seed = opts.newVariation || !current ? Math.floor(Math.random() * 1e6) : current.seed
  const program = generateProgram({ profile, environment, exercises: EXERCISES, seed })
  await db.transaction('rw', db.programs, async () => {
    await db.programs.clear()
    await db.programs.add(program)
  })
}

export async function finishOnboarding(profile: Profile, environment: Omit<Environment, 'id'>): Promise<void> {
  const envId = await db.environments.add(environment as Environment)
  await db.profile.put({ ...profile, activeEnvironmentId: envId })
  await regenerate({ newVariation: true })
}

export async function saveProfile(profile: Profile): Promise<void> {
  await db.profile.put(profile)
  await regenerate()
}

export async function swapExercise(sessionKey: string, index: number, newExerciseId: string): Promise<void> {
  const [program, profile] = await Promise.all([latestProgram(), db.profile.get('me')])
  if (!program?.id || !profile) return
  const sessions = program.sessions.map((s) => {
    if (s.key !== sessionKey) return s
    const strength = s.strength.map((x, i) =>
      i === index ? prescribe(newExerciseId, x.slot, x.priority, profile.level, profile.goal) : x,
    )
    return { ...s, strength }
  })
  await db.programs.update(program.id, { sessions })
}

export async function createEnvironment(name: string, icon: string, equipment: string[]): Promise<number> {
  return (await db.environments.add({ name, icon, equipment } as Environment)) as number
}

export async function updateEnvironment(id: number, patch: Partial<Omit<Environment, 'id'>>): Promise<void> {
  await db.environments.update(id, patch)
  const profile = await db.profile.get('me')
  if (profile?.activeEnvironmentId === id && patch.equipment) await regenerate()
}

export async function setActiveEnvironment(id: number): Promise<void> {
  const profile = await db.profile.get('me')
  if (!profile) return
  await db.profile.put({ ...profile, activeEnvironmentId: id })
  await regenerate()
}

export async function deleteEnvironment(id: number): Promise<void> {
  const profile = await db.profile.get('me')
  if (profile?.activeEnvironmentId === id) throw new Error('Troque o ambiente ativo antes de excluir este.')
  await db.environments.delete(id)
}

// --- Treino ao vivo -------------------------------------------------------------------------------

/** Carga sugerida pela progressão dupla, a partir do histórico registrado. */
export async function suggestionsFor(sessionKey: string) {
  const [program, logs] = await Promise.all([latestProgram(), db.logs.toArray()])
  const session = program?.sessions.find((s) => s.key === sessionKey)
  if (!session) return []
  return session.strength.map((plan) => {
    const ex = EXERCISE_BY_ID.get(plan.exerciseId)
    return ex ? suggestLoad(plan, ex, exerciseHistory(logs, plan.exerciseId)) : { reason: 'sem_historico' as const }
  })
}

export async function startLive(sessionKey: string): Promise<void> {
  const existing = await db.live.get('current')
  if (existing?.sessionKey === sessionKey) return
  const program = await latestProgram()
  const session = program?.sessions.find((s) => s.key === sessionKey)
  if (!program?.id || !session) return
  const suggestions = await suggestionsFor(sessionKey)
  await db.live.put({
    id: 'current',
    programId: program.id,
    sessionKey,
    session,
    startedAt: Date.now(),
    step: 0,
    mobilityDone: [],
    sets: session.strength.map((plan, i) =>
      Array.from({ length: plan.sets }, () => ({
        loadKg: suggestions[i]?.loadKg ? String(suggestions[i].loadKg).replace('.', ',') : '',
        reps: '',
        done: false,
      })),
    ),
    cardioDone: false,
  })
}

export async function updateLive(patch: Partial<Omit<LiveWorkout, 'id'>>): Promise<void> {
  await db.live.update('current', patch)
}

export async function pauseLive(): Promise<void> {
  const live = await db.live.get('current')
  if (live && !live.pausedAt) await db.live.update('current', { pausedAt: Date.now() })
}

export async function resumeLive(): Promise<void> {
  const live = await db.live.get('current')
  if (!live?.pausedAt) return
  await db.live.update('current', { pausedAt: undefined, pausedMs: (live.pausedMs ?? 0) + (Date.now() - live.pausedAt) })
}

export async function discardLive(): Promise<void> {
  await db.live.delete('current')
}

const toNumber = (s: string) => {
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Grava o treino no histórico e devolve o id do registro. */
export async function finishLive(): Promise<number | undefined> {
  const [live, profile] = await Promise.all([db.live.get('current'), db.profile.get('me')])
  if (!live || !profile) return undefined
  const session = live.session

  const sets: SetLog[] = session.strength.flatMap((plan, i) =>
    (live.sets[i] ?? []).map((s, setIndex) => ({
      exerciseId: plan.exerciseId,
      setIndex,
      loadKg: toNumber(s.loadKg),
      reps: Math.round(toNumber(s.reps || String(plan.repsMax))),
      done: s.done,
    })),
  )
  const durationMin = Math.max(1, Math.round(liveElapsedMs(live) / 60000))
  const cardioMinutes = live.cardioDone && session.cardio ? session.cardio.minutes : 0
  const strengthMin = Math.max(0, durationMin - cardioMinutes)
  const log: WorkoutLog = {
    date: localStamp(new Date(live.startedAt)),
    programId: live.programId,
    sessionKey: session.key,
    sessionTitle: session.title,
    environmentId: profile.activeEnvironmentId ?? 0,
    sets,
    cardioMinutes,
    durationMin,
    kcal:
      kcal(MET.musculacao, profile.weightKg, strengthMin) +
      (cardioMinutes && session.cardio ? kcal(MET[session.cardio.kind], profile.weightKg, cardioMinutes) : 0),
  }
  const id = await db.transaction('rw', db.logs, db.live, async () => {
    const newId = await db.logs.add(log)
    await db.live.delete('current')
    return newId
  })
  return id as number
}

/** Primeiras duas letras do nome, para o ícone do ambiente. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}
