import { Placeholder } from '../components/Placeholder'

export function Hoje() {
  return (
    <Placeholder
      eyebrow="Treino do dia"
      title="Hoje"
      phase="Fase 3"
      items={[
        'Semana com os dias treinados',
        'Card do treino do dia com mobilidade, musculação e aeróbico',
        'Sequência de dias e sugestão de progressão',
      ]}
    />
  )
}

export function Semana() {
  return (
    <Placeholder
      eyebrow="Plano"
      title="Sua semana"
      phase="Fase 3"
      items={['Dias A, B, C… da divisão escolhida', 'Dias de aeróbico conforme o objetivo', 'Trocar a ordem dos dias']}
    />
  )
}

export function Ambientes() {
  return (
    <Placeholder
      eyebrow="Seus locais"
      title="Ambientes de treino"
      phase="Fase 3"
      items={[
        'Criar Ambiente 1, 2… a partir de um ponto de partida',
        'Checklist completo de equipamentos por ambiente',
        'O treino se adapta ao ambiente escolhido',
      ]}
    />
  )
}

export function Progresso() {
  return (
    <Placeholder
      eyebrow="Evolução"
      title="Progresso"
      phase="Fase 4"
      items={['Carga máxima por exercício', 'Volume e tempo de aeróbico', 'Recordes recentes']}
    />
  )
}

export function Perfil() {
  return (
    <Placeholder
      eyebrow="Base do motor de regras"
      title="Seu perfil"
      phase="Fase 3"
      items={[
        'Dados físicos, nível e lesões',
        'Objetivo, divisão, dias e tempo por sessão',
        'Preferências e backup em arquivo',
      ]}
    />
  )
}
