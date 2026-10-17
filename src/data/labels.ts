import type { Goal, Injury, Level, Muscle, Sex, Split } from '../types'

export const SEX_LABELS: Record<Sex, string> = { M: 'Masculino', F: 'Feminino' }

export const LEVEL_LABELS: Record<Level, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export const LEVEL_HINTS: Record<Level, string> = {
  iniciante: 'Menos de 6 meses treinando com regularidade',
  intermediario: 'De 6 meses a 2 anos, já domina os básicos',
  avancado: 'Mais de 2 anos, treina perto da falha com boa técnica',
}

export const GOAL_LABELS: Record<Goal, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  forca: 'Força',
  condicionamento: 'Condicionamento',
}

export const GOAL_HINTS: Record<Goal, string> = {
  hipertrofia: 'Ganhar massa muscular',
  emagrecimento: 'Perder gordura mantendo músculo',
  forca: 'Levantar mais carga',
  condicionamento: 'Fôlego e resistência',
}

export const INJURY_LABELS: Record<Injury, string> = {
  joelho: 'Joelho',
  lombar: 'Lombar',
  ombro: 'Ombro',
  punho: 'Punho',
  cotovelo: 'Cotovelo',
  quadril: 'Quadril',
  tornozelo: 'Tornozelo',
  cervical: 'Pescoço',
}

export const SPLIT_HINTS: Record<Split, string> = {
  fullbody: 'Corpo inteiro em todo treino. Bom para 2 ou 3 dias.',
  abc: 'Peito e tríceps, costas e bíceps, pernas. Bom para 3 ou 6 dias.',
  upperlower: 'Superiores e inferiores alternados. Bom para 4 dias.',
  ppl: 'Empurrar, puxar e pernas. Bom para 3 ou 6 dias.',
  abcd: 'Um grupo grande por dia. Bom para 4 ou 5 dias.',
}

/** Divisão sugerida para os dias disponíveis; a pessoa escolhe a que quiser. */
export function suggestedSplit(days: number): Split {
  if (days <= 3) return 'fullbody'
  if (days === 4) return 'upperlower'
  if (days === 5) return 'abcd'
  return 'ppl'
}

export const MUSCLE_LABELS: Record<Muscle, string> = {
  abdomen: 'Abdômen',
  adutores: 'Adutores',
  abdutores: 'Abdutores',
  antebraco: 'Antebraço',
  biceps: 'Bíceps',
  dorsal: 'Dorsal',
  gluteos: 'Glúteos',
  lombar: 'Lombar',
  meio_costas: 'Meio das costas',
  ombros: 'Ombros',
  panturrilha: 'Panturrilha',
  peito: 'Peito',
  pescoco: 'Pescoço',
  posterior: 'Posterior de coxa',
  quadriceps: 'Quadríceps',
  trapezio: 'Trapézio',
  triceps: 'Tríceps',
}

/** Opções de foco muscular (chaves de FOCUS no motor). */
export const FOCUS_OPTIONS: { id: string; label: string }[] = [
  { id: 'gluteos', label: 'Glúteos' },
  { id: 'quadriceps', label: 'Quadríceps' },
  { id: 'posterior', label: 'Posterior' },
  { id: 'panturrilha', label: 'Panturrilha' },
  { id: 'peito', label: 'Peito' },
  { id: 'costas', label: 'Costas' },
  { id: 'ombros', label: 'Ombros' },
  { id: 'biceps', label: 'Bíceps' },
  { id: 'triceps', label: 'Tríceps' },
  { id: 'abdomen', label: 'Abdômen' },
]

/** Aeróbicos que a pessoa pode marcar como preferidos (ids de exercícios). */
export const CARDIO_OPTIONS: { id: string; label: string }[] = [
  { id: 'Bicycling_Stationary', label: 'Bike' },
  { id: 'Walking_Treadmill', label: 'Caminhada' },
  { id: 'Running_Treadmill', label: 'Corrida' },
  { id: 'Elliptical_Trainer', label: 'Elíptico' },
  { id: 'Rowing_Stationary', label: 'Remo' },
  { id: 'Stairmaster', label: 'Escada' },
  { id: 'Rope_Jumping', label: 'Corda' },
]

export const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
