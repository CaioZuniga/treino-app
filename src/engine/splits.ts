import type { Pattern, Priority, Split } from '../types'

// Regra 1: cada divisão tem dias, e cada dia tem vagas em ordem de execução.

export interface Slot {
  pattern: Pattern
  priority: Priority
}

export interface DayTemplate {
  key: string
  title: string
  subtitle: string
  region: 'superior' | 'inferior' | 'total'
  slots: Slot[]
}

export const SPLIT_LABELS: Record<Split, string> = {
  fullbody: 'Full body',
  abc: 'ABC',
  upperlower: 'Superiores/Inferiores',
  ppl: 'Empurrar/Puxar/Pernas',
  abcd: 'ABCD',
}

const P = (pattern: Pattern): Slot => ({ pattern, priority: 'principal' })
const S = (pattern: Pattern): Slot => ({ pattern, priority: 'secundario' })
const A = (pattern: Pattern): Slot => ({ pattern, priority: 'acessorio' })

const LEGS: DayTemplate = {
  key: 'C',
  title: 'Pernas',
  subtitle: 'Quadríceps, posterior, glúteos e panturrilha',
  region: 'inferior',
  slots: [P('agachar'), S('dobradica'), S('unilateral'), A('quadriceps_iso'), A('posterior_iso'), A('panturrilha'), A('core_estab')],
}

export const SPLITS: Record<Split, DayTemplate[]> = {
  fullbody: [
    {
      key: 'A',
      title: 'Corpo inteiro A',
      subtitle: 'Agachamento, empurrar e puxar',
      region: 'total',
      slots: [P('agachar'), P('empurrar_h'), S('puxar_v'), S('posterior_iso'), A('ombro_lateral'), A('core_estab')],
    },
    {
      key: 'B',
      title: 'Corpo inteiro B',
      subtitle: 'Dobradiça, remada e unilateral',
      region: 'total',
      slots: [P('dobradica'), P('puxar_h'), S('empurrar_inc'), S('unilateral'), A('biceps'), A('triceps'), A('core_flexao')],
    },
  ],
  abc: [
    {
      key: 'A',
      title: 'Peito, ombros e tríceps',
      subtitle: 'Empurrar',
      region: 'superior',
      slots: [P('empurrar_h'), S('empurrar_inc'), S('empurrar_v'), A('peito_iso'), A('ombro_lateral'), A('triceps')],
    },
    {
      key: 'B',
      title: 'Costas e bíceps',
      subtitle: 'Puxar',
      region: 'superior',
      slots: [P('puxar_v'), P('puxar_h'), S('puxar_v'), A('ombro_posterior'), A('biceps'), A('biceps')],
    },
    LEGS,
  ],
  upperlower: [
    {
      key: 'A',
      title: 'Superiores A',
      subtitle: 'Peito, costas, ombros e braços',
      region: 'superior',
      slots: [P('empurrar_h'), P('puxar_h'), S('empurrar_v'), S('puxar_v'), A('ombro_lateral'), A('biceps'), A('triceps')],
    },
    {
      key: 'B',
      title: 'Inferiores A',
      subtitle: 'Quadríceps, posterior e glúteos',
      region: 'inferior',
      slots: [P('agachar'), S('dobradica'), S('unilateral'), A('quadriceps_iso'), A('posterior_iso'), A('panturrilha'), A('core_estab')],
    },
    {
      key: 'C',
      title: 'Superiores B',
      subtitle: 'Costas, peito inclinado e braços',
      region: 'superior',
      slots: [P('puxar_v'), P('empurrar_inc'), S('puxar_h'), S('empurrar_h'), A('ombro_posterior'), A('triceps'), A('biceps')],
    },
    {
      key: 'D',
      title: 'Inferiores B',
      subtitle: 'Posterior, glúteos e quadríceps',
      region: 'inferior',
      slots: [P('dobradica'), S('gluteo'), S('agachar'), A('posterior_iso'), A('abdutor'), A('panturrilha'), A('core_flexao')],
    },
  ],
  ppl: [
    {
      key: 'A',
      title: 'Empurrar',
      subtitle: 'Peito, ombros e tríceps',
      region: 'superior',
      slots: [P('empurrar_h'), S('empurrar_v'), S('empurrar_inc'), A('peito_iso'), A('ombro_lateral'), A('triceps')],
    },
    {
      key: 'B',
      title: 'Puxar',
      subtitle: 'Costas, ombro posterior e bíceps',
      region: 'superior',
      slots: [P('puxar_v'), S('puxar_h'), S('puxar_h'), A('ombro_posterior'), A('biceps'), A('core_rot')],
    },
    LEGS,
  ],
  abcd: [
    {
      key: 'A',
      title: 'Peito e tríceps',
      subtitle: 'Empurrar horizontal',
      region: 'superior',
      slots: [P('empurrar_h'), S('empurrar_inc'), S('peito_iso'), A('peito_iso'), A('triceps'), A('triceps')],
    },
    {
      key: 'B',
      title: 'Costas e bíceps',
      subtitle: 'Puxar',
      region: 'superior',
      slots: [P('puxar_v'), S('puxar_h'), S('puxar_h'), A('biceps'), A('biceps'), A('lombar')],
    },
    { ...LEGS, slots: [...LEGS.slots.slice(0, 5), A('gluteo'), A('panturrilha')] },
    {
      key: 'D',
      title: 'Ombros e core',
      subtitle: 'Deltoides, trapézio e abdômen',
      region: 'superior',
      slots: [P('empurrar_v'), S('ombro_lateral'), S('ombro_posterior'), A('ombro_frontal'), A('trapezio'), A('core_estab'), A('core_rot')],
    },
  ],
}

/** Quando nenhum exercício do padrão cabe no ambiente, o motor tenta estes, em ordem. */
export const FALLBACK: Partial<Record<Pattern, Pattern[]>> = {
  puxar_v: ['puxar_h'],
  puxar_h: ['puxar_v'],
  empurrar_h: ['empurrar_inc'],
  empurrar_inc: ['empurrar_h'],
  empurrar_v: ['ombro_lateral', 'empurrar_inc'],
  peito_iso: ['empurrar_h'],
  ombro_lateral: ['empurrar_v'],
  ombro_frontal: ['ombro_lateral', 'empurrar_v'],
  ombro_posterior: ['puxar_h'],
  trapezio: ['ombro_posterior'],
  biceps: ['puxar_v', 'puxar_h'],
  triceps: ['empurrar_h'],
  agachar: ['unilateral'],
  unilateral: ['agachar'],
  quadriceps_iso: ['unilateral', 'agachar'],
  dobradica: ['gluteo', 'posterior_iso'],
  posterior_iso: ['dobradica'],
  gluteo: ['dobradica'],
  abdutor: ['gluteo'],
  adutor: ['unilateral'],
  lombar: ['core_estab'],
  core_estab: ['core_flexao'],
  core_flexao: ['core_estab'],
  core_rot: ['core_estab'],
}

/**
 * Último recurso, quando a vaga e os substitutos não cabem no ambiente (ex.: dia de costas só com peso do corpo):
 * qualquer exercício da mesma região, depois core. O motor nunca repete exercício na sessão.
 */
export const REGION_FALLBACK: Record<DayTemplate['region'], Pattern[]> = {
  superior: ['empurrar_h', 'puxar_h', 'empurrar_v', 'triceps', 'core_estab', 'core_flexao', 'core_rot'],
  inferior: ['agachar', 'unilateral', 'gluteo', 'dobradica', 'panturrilha', 'abdutor', 'core_estab'],
  total: ['agachar', 'empurrar_h', 'puxar_h', 'unilateral', 'gluteo', 'core_estab', 'core_flexao'],
}

/** Foco muscular escolhido pela pessoa vira uma vaga extra nos dias da região correspondente. */
export const FOCUS: Record<string, { pattern: Pattern; region: 'superior' | 'inferior' }> = {
  gluteos: { pattern: 'gluteo', region: 'inferior' },
  quadriceps: { pattern: 'quadriceps_iso', region: 'inferior' },
  posterior: { pattern: 'posterior_iso', region: 'inferior' },
  panturrilha: { pattern: 'panturrilha', region: 'inferior' },
  peito: { pattern: 'peito_iso', region: 'superior' },
  costas: { pattern: 'puxar_v', region: 'superior' },
  ombros: { pattern: 'ombro_lateral', region: 'superior' },
  biceps: { pattern: 'biceps', region: 'superior' },
  triceps: { pattern: 'triceps', region: 'superior' },
  abdomen: { pattern: 'core_flexao', region: 'superior' },
}
