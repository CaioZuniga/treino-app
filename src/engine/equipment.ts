import type { Exercise, Injury } from '../types'

/** O exercício cabe no ambiente se ele tem todos os itens de pelo menos uma das alternativas. */
export function fitsEnvironment(exercise: Exercise, available: ReadonlySet<string>): boolean {
  if (exercise.equipment.length === 0) return true
  return exercise.equipment.some((option) => option.every((item) => available.has(item)))
}

/** O exercício é seguro para a pessoa se não tem contraindicação para nenhuma lesão informada. */
export function isSafeFor(exercise: Exercise, injuries: readonly Injury[]): boolean {
  return !exercise.contraindications.some((c) => injuries.includes(c))
}
