import { EXERCISES } from '../data/catalog'
import { db } from '../db/db'
import { generateProgram } from '../engine'
import { prescribe } from '../engine/prescription'
import type { Environment, Profile, Program } from '../types'

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

/** Primeiras duas letras do nome, para o ícone do ambiente. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}
