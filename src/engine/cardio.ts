import type { CardioPlan, Exercise, Goal, Level, Profile } from '../types'
import { isEligible, type SelectionContext } from './select'

// Regra 5: aeróbico pelo objetivo, no aparelho disponível; zonas de FC pela fórmula de Tanaka.
// Regra 9: calorias por MET × peso × tempo.

export type CardioKind = CardioPlan['kind']

/** FC máxima estimada (Tanaka, Monahan e Seals, 2001). */
export function maxHeartRate(age: number): number {
  return Math.round(208 - 0.7 * age)
}

const HIIT_ORDER = ['Bicycling_Stationary', 'Rowing_Stationary', 'Elliptical_Trainer', 'Rope_Jumping', 'Running_Treadmill', 'Stairmaster', 'Recumbent_Bike']
const LISS_ORDER = ['Walking_Treadmill', 'Elliptical_Trainer', 'Bicycling_Stationary', 'Recumbent_Bike', 'Stairmaster', 'Rowing_Stationary', 'Jogging_Treadmill', 'Trail_Running_Walking']
/** Sem nenhum aparelho e com restrição para caminhar ou correr. */
const LISS_LAST_RESORT = 'custom_shadow_boxing'

export const MET = { musculacao: 5, mobilidade: 2.5, hiit: 8, circuito: 8, liss: 4.5 } as const

export function kcal(met: number, weightKg: number, minutes: number): number {
  return Math.round((met * weightKg * minutes) / 60)
}

/** Em quais sessões da semana entra aeróbico, e de que tipo. `regions` vem dos dias da divisão. */
export function cardioSchedule(goal: Goal, regions: readonly string[]): (CardioKind | null)[] {
  switch (goal) {
    case 'emagrecimento':
      return regions.map((_, i) => (i % 2 === 0 ? 'hiit' : 'liss'))
    case 'condicionamento':
      return regions.map(() => 'hiit')
    case 'hipertrofia':
    case 'forca': {
      // Dois LISS leves, de preferência fora dos dias de perna.
      const order = regions.map((r, i) => ({ r, i })).sort((a, b) => Number(a.r === 'inferior') - Number(b.r === 'inferior'))
      const chosen = new Set(order.slice(0, 2).map((x) => x.i))
      return regions.map((_, i) => (chosen.has(i) ? 'liss' : null))
    }
  }
}

function cardioMinutes(kind: CardioKind, goal: Goal, level: Level): number {
  if (kind === 'liss') return goal === 'emagrecimento' ? 20 : goal === 'hipertrofia' ? 15 : 10
  return level === 'iniciante' ? 10 : 12
}

const pick = (order: string[], ctx: SelectionContext, byId: Map<string, Exercise>) => {
  const ok = order.map((id) => byId.get(id)).filter((e): e is Exercise => !!e && isEligible(e, ctx))
  // Aparelho que a pessoa marcou como favorito vem primeiro.
  return ok.find((e) => ctx.profile.likes.includes(e.id)) ?? ok[0]
}

export function planCardio(
  kind: Exclude<CardioKind, 'circuito'>,
  profile: Pick<Profile, 'age' | 'goal' | 'level'>,
  ctx: SelectionContext,
  minutesOverride?: number,
): CardioPlan {
  const byId = new Map(ctx.exercises.map((e) => [e.id, e]))
  const fcMax = maxHeartRate(profile.age)
  const minutes = minutesOverride ?? cardioMinutes(kind, profile.goal, profile.level)

  if (kind === 'liss') {
    const ex = pick(LISS_ORDER, ctx, byId) ?? byId.get(LISS_LAST_RESORT)!
    const hrMin = Math.round(fcMax * 0.6)
    const hrMax = Math.round(fcMax * 0.7)
    return {
      kind,
      exerciseIds: [ex.id],
      minutes,
      hrMin,
      hrMax,
      description: `${minutes} min em ritmo constante, zona 2 (FC entre ${hrMin} e ${hrMax} bpm). Dá para conversar enquanto faz.`,
    }
  }

  const hrMin = Math.round(fcMax * 0.85)
  const hrMax = Math.round(fcMax * 0.9)
  const machine = pick(HIIT_ORDER, ctx, byId)
  if (machine) {
    // Cada rodada: 30 s forte + 60 s leve. Iniciante faz 20 s forte + 70 s leve.
    const hard = profile.level === 'iniciante' ? 20 : 30
    const rounds = Math.floor((minutes * 60) / 90)
    return {
      kind,
      exerciseIds: [machine.id],
      minutes,
      hrMin,
      hrMax,
      description: `${rounds} × (${hard} s forte / ${90 - hard} s leve). No trecho forte, FC entre ${hrMin} e ${hrMax} bpm.`,
    }
  }

  // Sem aparelho: circuito com exercícios de condicionamento, 40 s de esforço e 20 s de pausa.
  const moves = ctx.exercises.filter((e) => e.pattern === 'condicionamento' && isEligible(e, ctx)).slice(0, 4)
  if (moves.length < 2) return planCardio('liss', profile, ctx, minutes)
  const rounds = Math.max(1, Math.floor(minutes / moves.length))
  return {
    kind: 'circuito',
    exerciseIds: moves.map((e) => e.id),
    minutes: rounds * moves.length,
    hrMin,
    hrMax,
    description: `${rounds} voltas de ${moves.length} exercícios, 40 s de esforço e 20 s de pausa em cada um.`,
  }
}
