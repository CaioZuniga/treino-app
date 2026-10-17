import type { Exercise, Level, Pattern, Priority, Profile } from '../types'
import { fitsEnvironment, isSafeFor } from './equipment'

// Regra 2: filtra pelo ambiente, nível e lesões; tira o que a pessoa evita; ordena por preferência e variação.
// Regra 8 (trocar exercício) usa o mesmo filtro e a mesma ordem.

const LEVEL_RANK: Record<Level, number> = { iniciante: 0, intermediario: 1, avancado: 2 }

export interface SelectionContext {
  profile: Pick<Profile, 'level' | 'injuries' | 'likes' | 'dislikes'>
  available: ReadonlySet<string>
  exercises: readonly Exercise[]
  seed: number
}

/** Número entre 0 e 1 estável para o mesmo texto: dá variação entre sementes sem ser aleatório. */
export function hash01(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

export function isEligible(e: Exercise, ctx: SelectionContext): boolean {
  return (
    fitsEnvironment(e, ctx.available) &&
    isSafeFor(e, ctx.profile.injuries) &&
    LEVEL_RANK[e.level] <= LEVEL_RANK[ctx.profile.level] &&
    !ctx.profile.dislikes.includes(e.id)
  )
}

/** Exercícios clássicos e fáceis de progredir em carga: ganham preferência quando cabem no ambiente. */
const STAPLES = new Set([
  'Barbell_Bench_Press_-_Medium_Grip', 'Dumbbell_Bench_Press', 'Incline_Dumbbell_Press', 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'Pullups', 'Wide-Grip_Lat_Pulldown', 'Seated_Cable_Rows', 'One-Arm_Dumbbell_Row', 'Bent_Over_Barbell_Row',
  'Dumbbell_Shoulder_Press', 'Side_Lateral_Raise', 'Face_Pull', 'Barbell_Squat', 'Leg_Press', 'Hack_Squat',
  'Goblet_Squat', 'Romanian_Deadlift', 'Stiff-Legged_Dumbbell_Deadlift', 'Dumbbell_Lunges', 'Split_Squat_with_Dumbbells',
  'Leg_Extensions', 'Lying_Leg_Curls', 'Seated_Leg_Curl', 'Barbell_Hip_Thrust', 'Standing_Calf_Raises',
  'Triceps_Pushdown', 'Triceps_Pushdown_-_Rope_Attachment', 'Dumbbell_Bicep_Curl', 'Hammer_Curls', 'Plank',
])

/** Ambiente com pelo menos isso de equipamentos conta como academia. */
const GYM_SIZE = 12
const LIGHT = new Set(['elastico', 'colchonete', 'step'])
const isLight = (e: Exercise) => e.equipment.length === 0 || e.equipment.every((opt) => opt.every((i) => LIGHT.has(i)))

export function score(e: Exercise, priority: Priority, ctx: SelectionContext, usedElsewhere: ReadonlySet<string>): number {
  let s = 0
  if (ctx.profile.likes.includes(e.id)) s += 4
  if (STAPLES.has(e.id)) s += 1.5
  // Na academia, peso do corpo e elástico perdem para opções com carga (exceto core).
  if (ctx.available.size >= GYM_SIZE && isLight(e) && !e.pattern.startsWith('core')) s -= 2
  if (priority === 'principal' && e.mechanic === 'composto') s += 2
  if (priority === 'acessorio' && e.mechanic === 'isolado') s += 1
  if (e.level === ctx.profile.level) s += 0.5
  // Exercícios próprios não têm fotos; ficam como plano B.
  if (e.id.startsWith('custom_')) s -= 0.5
  // Evita repetir o mesmo exercício em dias diferentes da semana.
  if (usedElsewhere.has(e.id)) s -= 3
  return s + hash01(`${e.id}:${ctx.seed}`) * 1.5
}

export function rankCandidates(
  pattern: Pattern,
  priority: Priority,
  ctx: SelectionContext,
  exclude: ReadonlySet<string>,
  usedElsewhere: ReadonlySet<string> = new Set(),
): Exercise[] {
  return ctx.exercises
    .filter((e) => e.pattern === pattern && !exclude.has(e.id) && isEligible(e, ctx))
    .map((e) => ({ e, s: score(e, priority, ctx, usedElsewhere) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.e)
}

/**
 * Exercícios que podem substituir `exerciseId` na mesma vaga: mesmo padrão, dentro do ambiente,
 * seguros para as lesões informadas e fora da sessão atual.
 */
export function alternatives(
  exerciseId: string,
  slot: Pattern,
  priority: Priority,
  ctx: SelectionContext,
  sessionIds: readonly string[] = [],
): Exercise[] {
  const exclude = new Set([exerciseId, ...sessionIds])
  const current = ctx.exercises.find((e) => e.id === exerciseId)
  const pattern = current?.pattern ?? slot
  return rankCandidates(pattern, priority, ctx, exclude)
}
