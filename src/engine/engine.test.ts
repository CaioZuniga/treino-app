import { describe, expect, it } from 'vitest'
import data from '../data/exercises.json'
import { ENVIRONMENT_PRESETS } from '../data/equipment'
import type { Environment, Exercise, Goal, Level, Profile, Split } from '../types'
import { maxHeartRate, planCardio } from './cardio'
import { fitsEnvironment, isSafeFor } from './equipment'
import { generateProgram, weekSchedule } from './generate'
import { jointsForDay } from './mobility'
import { suggestLoad } from './progression'
import { alternatives } from './select'

const exercises = data as Exercise[]
const byId = new Map(exercises.map((e) => [e.id, e]))

const profile = (p: Partial<Profile> = {}): Profile => ({
  id: 'me',
  name: 'Teste',
  age: 38,
  sex: 'M',
  weightKg: 82,
  heightCm: 178,
  level: 'intermediario',
  injuries: [],
  goal: 'hipertrofia',
  daysPerWeek: 4,
  minutesPerSession: 60,
  split: 'upperlower',
  likes: [],
  dislikes: [],
  focus: [],
  ...p,
})

const env = (name: string): Environment => {
  const preset = ENVIRONMENT_PRESETS.find((p) => p.name === name)!
  return { id: 1, name, icon: 'x', equipment: preset.equipment }
}
const GYM = env('Academia completa')
const HOME = env('Casa com halteres')
const BODY = env('Só peso corporal')

const SPLITS: Split[] = ['fullbody', 'abc', 'upperlower', 'ppl', 'abcd']
const GOALS: Goal[] = ['hipertrofia', 'emagrecimento', 'forca', 'condicionamento']
const LEVELS: Level[] = ['iniciante', 'intermediario', 'avancado']
const ENVS = [GYM, HOME, BODY]

describe('generateProgram — todas as combinações', () => {
  const cases = SPLITS.flatMap((split) =>
    GOALS.flatMap((goal) => LEVELS.flatMap((level) => ENVS.map((environment) => ({ split, goal, level, environment })))),
  )

  it.each(cases)('$split / $goal / $level / $environment.name', ({ split, goal, level, environment }) => {
    const p = profile({ split, goal, level, injuries: ['lombar'] })
    const program = generateProgram({ profile: p, environment, exercises })
    const available = new Set(environment.equipment)

    expect(program.sessions.length).toBeGreaterThan(0)
    for (const s of program.sessions) {
      expect(s.strength.length, s.title).toBeGreaterThanOrEqual(3)
      expect(s.mobility.length, s.title).toBeGreaterThanOrEqual(2)
      const ids = [...s.strength, ...s.mobility].map((x) => x.exerciseId)
      expect(new Set(ids).size, `${s.title}: exercício repetido`).toBe(ids.length)
      for (const id of [...ids, ...(s.cardio?.exerciseIds ?? [])]) {
        const e = byId.get(id)!
        expect(fitsEnvironment(e, available), `${id} fora do ambiente`).toBe(true)
        expect(isSafeFor(e, ['lombar']), `${id} contraindicado para lombar`).toBe(true)
      }
      // Pode passar um pouco só quando o corte já chegou no mínimo de exercícios.
      if (s.strength.length > 3) expect(s.estimatedMinutes, s.title).toBeLessThanOrEqual(60)
    }
  })
})

describe('generateProgram — regras', () => {
  it('é determinístico pela semente', () => {
    const a = generateProgram({ profile: profile(), environment: GYM, exercises, seed: 7, now: new Date(0) })
    const b = generateProgram({ profile: profile(), environment: GYM, exercises, seed: 7, now: new Date(0) })
    const c = generateProgram({ profile: profile(), environment: GYM, exercises, seed: 8, now: new Date(0) })
    expect(a).toEqual(b)
    expect(a.sessions.map((s) => s.strength.map((x) => x.exerciseId))).not.toEqual(
      c.sessions.map((s) => s.strength.map((x) => x.exerciseId)),
    )
  })

  it('usa o exercício favorito e nunca o evitado', () => {
    const p = profile({ likes: ['Leg_Press'], dislikes: ['Barbell_Squat'] })
    const program = generateProgram({ profile: p, environment: GYM, exercises })
    const all = program.sessions.flatMap((s) => s.strength.map((x) => x.exerciseId))
    expect(all).toContain('Leg_Press')
    expect(all).not.toContain('Barbell_Squat')
  })

  it('na academia, os principais usam carga (não peso do corpo nem elástico)', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const program = generateProgram({ profile: profile(), environment: GYM, exercises, seed })
      for (const s of program.sessions) {
        for (const x of s.strength.filter((y) => y.priority === 'principal')) {
          const options = byId.get(x.exerciseId)!.equipment.flat()
          expect(options.some((i) => !['elastico', 'colchonete', 'step', 'barra_fixa'].includes(i)) || x.exerciseId === 'Pullups', x.exerciseId).toBe(true)
        }
      }
    }
  })

  it('iniciante só recebe exercícios de nível iniciante', () => {
    const program = generateProgram({ profile: profile({ level: 'iniciante' }), environment: GYM, exercises })
    for (const s of program.sessions) for (const x of s.strength) expect(byId.get(x.exerciseId)!.level).toBe('iniciante')
  })

  it('principal tem mais séries e menos repetições que acessório na hipertrofia', () => {
    const s = generateProgram({ profile: profile(), environment: GYM, exercises }).sessions[0]
    const main = s.strength.find((x) => x.priority === 'principal')!
    const acc = s.strength.find((x) => x.priority === 'acessorio' && !x.slot.startsWith('core'))!
    expect(main.sets).toBeGreaterThan(acc.sets)
    expect(main.repsMax).toBeLessThan(acc.repsMax)
  })

  it('foco em glúteos adiciona vaga de glúteo nos dias de perna', () => {
    const p = profile({ focus: ['gluteos'] })
    const legs = generateProgram({ profile: p, environment: GYM, exercises }).sessions.find((s) => s.key === 'B')!
    expect(legs.strength.some((x) => x.slot === 'gluteo')).toBe(true)
  })

  it('pouco tempo corta acessórios antes dos principais', () => {
    const long = generateProgram({ profile: profile({ minutesPerSession: 90 }), environment: GYM, exercises }).sessions[0]
    const short = generateProgram({ profile: profile({ minutesPerSession: 35 }), environment: GYM, exercises }).sessions[0]
    expect(short.strength.length).toBeLessThan(long.strength.length)
    expect(short.strength.filter((x) => x.priority === 'principal').length).toBe(
      long.strength.filter((x) => x.priority === 'principal').length,
    )
    expect(short.estimatedMinutes).toBeLessThanOrEqual(35)
  })

  it('emagrecimento alterna HIIT e LISS em toda sessão', () => {
    const program = generateProgram({ profile: profile({ goal: 'emagrecimento' }), environment: GYM, exercises })
    expect(program.sessions.map((s) => s.cardio?.kind)).toEqual(['hiit', 'liss', 'hiit', 'liss'])
  })

  it('hipertrofia faz dois LISS, fora dos dias de perna', () => {
    const program = generateProgram({ profile: profile(), environment: GYM, exercises })
    const withCardio = program.sessions.filter((s) => s.cardio)
    expect(withCardio.map((s) => s.title)).toEqual(['Superiores A', 'Superiores B'])
    expect(withCardio.every((s) => s.cardio!.kind === 'liss')).toBe(true)
  })

  it('weekSchedule repete os dias da divisão e continua na semana seguinte', () => {
    const program = generateProgram({ profile: profile({ split: 'abc' }), environment: GYM, exercises })
    expect(weekSchedule(program, 4, 0)).toEqual(['A', 'B', 'C', 'A'])
    expect(weekSchedule(program, 4, 1)).toEqual(['B', 'C', 'A', 'B'])
  })
})

describe('aeróbico', () => {
  const ctxFor = (environment: Environment, p: Profile) => ({ profile: p, available: new Set(environment.equipment), exercises, seed: 1 })

  it('FC máxima pela fórmula de Tanaka', () => {
    expect(maxHeartRate(40)).toBe(180)
  })

  it('sem aparelho, o HIIT vira circuito de peso corporal', () => {
    const p = profile({ goal: 'emagrecimento' })
    const plan = planCardio('hiit', p, ctxFor(BODY, p))
    expect(plan.kind).toBe('circuito')
    expect(plan.exerciseIds.length).toBeGreaterThanOrEqual(2)
  })

  it('com lesão no joelho e só esteira, não manda correr', () => {
    const p = profile({ injuries: ['joelho'] })
    const onlyTreadmill: Environment = { name: 'Esteira', icon: 'x', equipment: ['esteira'] }
    const plan = planCardio('liss', p, ctxFor(onlyTreadmill, p))
    expect(plan.exerciseIds).toEqual(['Walking_Treadmill'])
  })

  it('LISS fica na zona 2 (60–70% da FC máxima)', () => {
    const p = profile({ age: 40 })
    const plan = planCardio('liss', p, ctxFor(GYM, p))
    expect([plan.hrMin, plan.hrMax]).toEqual([108, 126])
  })
})

describe('mobilidade', () => {
  it('prioriza a articulação lesionada e depois as do dia', () => {
    expect(jointsForDay(['agachar', 'dobradica'], ['ombro'])).toEqual(['ombro', 'quadril', 'tornozelo', 'joelho', 'lombar'])
  })

  it('dia de perna aquece quadril e tornozelo', () => {
    const legs = generateProgram({ profile: profile(), environment: GYM, exercises }).sessions.find((s) => s.key === 'B')!
    const joints = new Set(legs.mobility.flatMap((m) => byId.get(m.exerciseId)!.joints))
    expect(joints.has('quadril')).toBe(true)
    expect(joints.has('tornozelo')).toBe(true)
  })
})

describe('trocar exercício', () => {
  it('sugere só exercícios do mesmo padrão, no ambiente e fora da sessão', () => {
    const p = profile()
    const ctx = { profile: p, available: new Set(HOME.equipment), exercises, seed: 1 }
    const alts = alternatives('Dumbbell_Bench_Press', 'empurrar_h', 'principal', ctx, ['Pushups'])
    expect(alts.length).toBeGreaterThan(0)
    for (const a of alts) {
      expect(a.pattern).toBe('empurrar_h')
      expect(a.id).not.toBe('Dumbbell_Bench_Press')
      expect(a.id).not.toBe('Pushups')
      expect(fitsEnvironment(a, ctx.available)).toBe(true)
    }
  })
})

describe('progressão dupla', () => {
  const plan = { exerciseId: 'Barbell_Squat', slot: 'agachar', priority: 'principal', sets: 3, unit: 'reps', repsMin: 8, repsMax: 10, restSec: 120 } as const
  const squat = byId.get('Barbell_Squat')!
  const curl = byId.get('Dumbbell_Bicep_Curl')!
  const session = (load: number, reps: number[]) => ({ date: '2026-10-01', sets: reps.map((r) => ({ loadKg: load, reps: r, done: true })) })

  it('sem histórico não sugere carga', () => {
    expect(suggestLoad(plan, squat, [])).toEqual({ reason: 'sem_historico' })
  })

  it('fechou no topo: +5 kg no agachamento, +2,5 kg na rosca', () => {
    expect(suggestLoad(plan, squat, [session(60, [10, 10, 10])])).toEqual({ reason: 'subir', loadKg: 65 })
    expect(suggestLoad(plan, curl, [session(12, [10, 10, 10])])).toEqual({ reason: 'subir', loadKg: 14.5 })
  })

  it('dentro da faixa: mantém a carga', () => {
    expect(suggestLoad(plan, squat, [session(60, [10, 9, 8])])).toEqual({ reason: 'manter', loadKg: 60 })
  })

  it('abaixo do mínimo em duas sessões seguidas: deload de 10%', () => {
    expect(suggestLoad(plan, squat, [session(60, [8, 7, 6]), session(60, [8, 6, 6])])).toEqual({ reason: 'deload', loadKg: 54 })
  })

  it('uma falha só não dispara deload', () => {
    expect(suggestLoad(plan, squat, [session(60, [10, 10, 9]), session(60, [8, 7, 6])])).toEqual({ reason: 'manter', loadKg: 60 })
  })
})
