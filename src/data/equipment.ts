// Catálogo de equipamentos do checklist de cada ambiente.
// A Fase 1 liga cada exercício do free-exercise-db a estes ids.

export type EquipmentCategory = 'livres' | 'maquinas' | 'aerobico' | 'acessorios'

export interface EquipmentItem {
  id: string
  name: string
  category: EquipmentCategory
}

export const EQUIPMENT_CATEGORIES: Record<EquipmentCategory, string> = {
  livres: 'Pesos livres',
  maquinas: 'Máquinas',
  aerobico: 'Aeróbico',
  acessorios: 'Acessórios',
}

export const EQUIPMENT: EquipmentItem[] = [
  { id: 'barra', name: 'Barra olímpica', category: 'livres' },
  { id: 'barra_w', name: 'Barra W', category: 'livres' },
  { id: 'halteres', name: 'Halteres', category: 'livres' },
  { id: 'kettlebell', name: 'Kettlebell', category: 'livres' },
  { id: 'anilhas', name: 'Anilhas', category: 'livres' },
  { id: 'banco', name: 'Banco', category: 'livres' },
  { id: 'banco_inclinavel', name: 'Banco inclinável', category: 'livres' },
  { id: 'rack', name: 'Rack', category: 'livres' },
  { id: 'smith', name: 'Smith', category: 'maquinas' },
  { id: 'leg_press', name: 'Leg press', category: 'maquinas' },
  { id: 'extensora', name: 'Cadeira extensora', category: 'maquinas' },
  { id: 'flexora', name: 'Mesa flexora', category: 'maquinas' },
  { id: 'abdutora', name: 'Abdutora/adutora', category: 'maquinas' },
  { id: 'panturrilha', name: 'Panturrilha', category: 'maquinas' },
  { id: 'polia', name: 'Polia/cross', category: 'maquinas' },
  { id: 'puxador', name: 'Puxador alto', category: 'maquinas' },
  { id: 'remada_maquina', name: 'Remada máquina', category: 'maquinas' },
  { id: 'peck_deck', name: 'Peck deck', category: 'maquinas' },
  { id: 'supino_maquina', name: 'Supino máquina', category: 'maquinas' },
  { id: 'hack', name: 'Hack', category: 'maquinas' },
  { id: 'desenvolvimento_maquina', name: 'Desenvolvimento máquina', category: 'maquinas' },
  { id: 'banco_scott', name: 'Banco Scott', category: 'maquinas' },
  { id: 'hiperextensao', name: 'Banco romano (lombar)', category: 'maquinas' },
  { id: 'esteira', name: 'Esteira', category: 'aerobico' },
  { id: 'bike', name: 'Bike', category: 'aerobico' },
  { id: 'eliptico', name: 'Elíptico', category: 'aerobico' },
  { id: 'remo', name: 'Remo', category: 'aerobico' },
  { id: 'escada', name: 'Escada', category: 'aerobico' },
  { id: 'corda', name: 'Corda de pular', category: 'aerobico' },
  { id: 'elastico', name: 'Elástico', category: 'acessorios' },
  { id: 'barra_fixa', name: 'Barra fixa', category: 'acessorios' },
  { id: 'paralelas', name: 'Paralelas', category: 'acessorios' },
  { id: 'bola_suica', name: 'Bola suíça', category: 'acessorios' },
  { id: 'step', name: 'Step', category: 'acessorios' },
  { id: 'trx', name: 'TRX/suspensão', category: 'acessorios' },
  { id: 'colchonete', name: 'Colchonete', category: 'acessorios' },
  { id: 'rolo', name: 'Rolo de liberação', category: 'acessorios' },
]

/** Pontos de partida ao criar um ambiente; a pessoa ajusta o checklist depois. */
export const ENVIRONMENT_PRESETS: { name: string; equipment: string[] }[] = [
  { name: 'Academia completa', equipment: EQUIPMENT.filter((e) => e.id !== 'trx').map((e) => e.id) },
  { name: 'Casa com halteres', equipment: ['halteres', 'banco', 'elastico', 'colchonete', 'corda'] },
  { name: 'Só peso corporal', equipment: ['colchonete'] },
]
