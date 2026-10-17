// Modelo de dados do app (ver PLANO.md, seção "Modelo de dados").

export type Sex = 'M' | 'F'
export type Level = 'iniciante' | 'intermediario' | 'avancado'
export type Goal = 'hipertrofia' | 'emagrecimento' | 'forca' | 'condicionamento'
export type Split = 'fullbody' | 'abc' | 'upperlower' | 'ppl' | 'abcd'

/** Tags de restrição usadas para filtrar exercícios contraindicados. */
export type Injury = 'joelho' | 'lombar' | 'ombro' | 'punho' | 'cotovelo' | 'quadril' | 'tornozelo' | 'cervical'

export interface Profile {
  id: 'me'
  name: string
  age: number
  sex: Sex
  weightKg: number
  heightCm: number
  level: Level
  injuries: Injury[]
  goal: Goal
  daysPerWeek: number
  minutesPerSession: number
  split: Split
  likes: string[]
  dislikes: string[]
  focus: string[]
  activeEnvironmentId?: number
}

export interface Environment {
  id?: number
  name: string
  icon: string
  /** Ids do catálogo de equipamentos (src/data/equipment.ts). */
  equipment: string[]
}

export interface PlannedExercise {
  exerciseId: string
  slot: string
  sets: number
  repsMin: number
  repsMax: number
  restSec: number
  loadKg?: number
}

export interface CardioPlan {
  kind: 'hiit' | 'liss'
  equipment: string
  minutes: number
  description: string
}

export interface SessionPlan {
  key: string
  title: string
  mobility: PlannedExercise[]
  strength: PlannedExercise[]
  cardio?: CardioPlan
}

export interface Program {
  id?: number
  createdAt: string
  split: Split
  environmentId: number
  sessions: SessionPlan[]
}

export interface SetLog {
  exerciseId: string
  setIndex: number
  loadKg: number
  reps: number
  done: boolean
}

export interface WorkoutLog {
  id?: number
  date: string
  programId: number
  sessionKey: string
  environmentId: number
  sets: SetLog[]
  durationMin: number
  kcal: number
}
