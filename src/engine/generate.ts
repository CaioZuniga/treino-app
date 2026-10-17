import type { CardioPlan, Environment, Exercise, PlannedExercise, Profile, Program, SessionPlan } from '../types'
import { cardioSchedule, kcal, MET, planCardio } from './cardio'
import { planMobility } from './mobility'
import { prescribe } from './prescription'
import { rankCandidates, type SelectionContext } from './select'
import { blockMinutes } from './session'
import { FALLBACK, FOCUS, REGION_FALLBACK, SPLITS, type DayTemplate, type Slot } from './splits'

// Junta as regras 1 a 6 e 9: monta cada dia da divisão escolhida para o ambiente e o perfil.

export interface GenerateInput {
  profile: Profile
  environment: Environment
  exercises: readonly Exercise[]
  seed?: number
  now?: Date
}

/** Menos que isso não é treino: o ajuste de tempo nunca corta abaixo disso. */
const MIN_STRENGTH_EXERCISES = 3
const MIN_CARDIO_MINUTES = 10

/** A vaga de foco entra como secundária, logo depois das secundárias, para não ser a primeira a sair por tempo. */
function withFocus(day: DayTemplate, focus: readonly string[]): Slot[] {
  const extra = focus
    .map((f) => FOCUS[f])
    .filter((f) => f && (day.region === 'total' || day.region === f.region))
    .map((f): Slot => ({ pattern: f.pattern, priority: 'secundario' }))
  const at = day.slots.findIndex((s) => s.priority === 'acessorio')
  const cut = at < 0 ? day.slots.length : at
  return [...day.slots.slice(0, cut), ...extra, ...day.slots.slice(cut)]
}

function fillSlots(
  slots: Slot[],
  region: DayTemplate['region'],
  ctx: SelectionContext,
  input: GenerateInput,
  usedElsewhere: Set<string>,
): PlannedExercise[] {
  const inSession = new Set<string>()
  const out: PlannedExercise[] = []
  for (const slot of slots) {
    for (const pattern of [slot.pattern, ...(FALLBACK[slot.pattern] ?? []), ...REGION_FALLBACK[region]]) {
      const best = rankCandidates(pattern, slot.priority, ctx, inSession, usedElsewhere)[0]
      if (!best) continue
      inSession.add(best.id)
      out.push(prescribe(best.id, slot.pattern, slot.priority, input.profile.level, input.profile.goal))
      break
    }
  }
  return out
}

function sessionMinutes(mobility: PlannedExercise[], strength: PlannedExercise[], cardio?: CardioPlan): number {
  return blockMinutes(mobility, 15) + blockMinutes(strength) + (cardio?.minutes ?? 0)
}

/**
 * Regra 4: corta até caber no tempo informado, nesta ordem —
 * acessórios do fim, séries extras dos não principais, minutos de aeróbico e, por último, secundários do fim.
 */
function fitToTime(
  mobility: PlannedExercise[],
  strength: PlannedExercise[],
  cardio: CardioPlan | undefined,
  budget: number,
  replanCardio: (minutes: number) => CardioPlan,
): { strength: PlannedExercise[]; cardio?: CardioPlan } {
  let s = [...strength]
  let c = cardio
  const over = () => sessionMinutes(mobility, s, c) > budget

  const dropLast = (priority: PlannedExercise['priority']) => {
    while (over() && s.length > MIN_STRENGTH_EXERCISES) {
      const i = s.map((x) => x.priority).lastIndexOf(priority)
      if (i < 0) return
      s = s.filter((_, k) => k !== i)
    }
  }

  dropLast('acessorio')
  if (over()) s = s.map((x) => (x.priority !== 'principal' && x.sets > 2 ? { ...x, sets: 2 } : x))
  if (over() && c && c.minutes > MIN_CARDIO_MINUTES) {
    const excess = sessionMinutes(mobility, s, c) - budget
    c = replanCardio(Math.max(MIN_CARDIO_MINUTES, c.minutes - excess))
  }
  dropLast('secundario')
  return { strength: s, cardio: c }
}

export function generateProgram(input: GenerateInput): Program {
  const { profile, environment, exercises } = input
  const seed = input.seed ?? 1
  const ctx: SelectionContext = { profile, available: new Set(environment.equipment), exercises, seed }
  const days = SPLITS[profile.split]
  const cardioKinds = cardioSchedule(profile.goal, days.map((d) => d.region))
  const usedElsewhere = new Set<string>()

  const sessions: SessionPlan[] = days.map((day, i) => {
    const strength = fillSlots(withFocus(day, profile.focus), day.region, ctx, input, usedElsewhere)
    strength.forEach((x) => usedElsewhere.add(x.exerciseId))

    const mobility = planMobility(strength.map((x) => x.slot), profile.injuries, ctx)
    const kind = cardioKinds[i]
    const replan = (minutes?: number) => planCardio(kind === 'liss' ? 'liss' : 'hiit', profile, ctx, minutes)
    const cardio = kind ? replan() : undefined
    const fitted = fitToTime(mobility, strength, cardio, profile.minutesPerSession, replan)

    const strengthMin = blockMinutes(fitted.strength)
    const mobilityMin = blockMinutes(mobility, 15)
    const cardioMet = fitted.cardio ? MET[fitted.cardio.kind] : 0
    return {
      key: day.key,
      title: day.title,
      subtitle: day.subtitle,
      mobility,
      strength: fitted.strength,
      cardio: fitted.cardio,
      estimatedMinutes: sessionMinutes(mobility, fitted.strength, fitted.cardio),
      kcal:
        kcal(MET.mobilidade, profile.weightKg, mobilityMin) +
        kcal(MET.musculacao, profile.weightKg, strengthMin) +
        (fitted.cardio ? kcal(cardioMet, profile.weightKg, fitted.cardio.minutes) : 0),
    }
  })

  return {
    createdAt: (input.now ?? new Date()).toISOString(),
    split: profile.split,
    environmentId: environment.id ?? 0,
    seed,
    sessions,
  }
}

/** Ordem dos treinos na semana: os dias da divisão se repetem até completar os dias disponíveis. */
export function weekSchedule(program: Pick<Program, 'sessions'>, daysPerWeek: number, weekIndex = 0): string[] {
  const keys = program.sessions.map((s) => s.key)
  const start = (weekIndex * daysPerWeek) % keys.length
  return Array.from({ length: daysPerWeek }, (_, i) => keys[(start + i) % keys.length])
}
