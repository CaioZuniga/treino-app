import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EquipmentChecklist } from '../components/EquipmentChecklist'
import { ChoiceChips, Loading, ScreenHeader, Section, TextField } from '../components/ui'
import { EQUIPMENT, ENVIRONMENT_PRESETS } from '../data/equipment'
import { createEnvironment, deleteEnvironment, initials, setActiveEnvironment, updateEnvironment } from '../state/actions'
import { useEnvironment, useEnvironments, useProfile } from '../state/hooks'

const TOTAL = EQUIPMENT.length

export function Ambientes() {
  const profile = useProfile()
  const environments = useEnvironments()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [preset, setPreset] = useState(ENVIRONMENT_PRESETS[1].name)
  const [error, setError] = useState('')
  if (!profile || !environments) return <Loading />

  const create = async () => {
    if (!name.trim()) return setError('Dê um nome ao ambiente.')
    const equipment = ENVIRONMENT_PRESETS.find((p) => p.name === preset)!.equipment
    const id = await createEnvironment(name.trim(), initials(name), equipment)
    navigate(`/ambientes/${id}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader eyebrow="Seus locais" title="Ambientes de treino" />

      <div className="flex flex-col gap-2.5">
        {environments.map((e) => {
          const active = e.id === profile.activeEnvironmentId
          return (
            <Link key={e.id} to={`/ambientes/${e.id}`} className={`card flex items-center gap-3.5 p-3.5 ${active ? 'border-lime/45' : ''}`}>
              <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-card2 font-display text-lg text-lime">{e.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-bold">
                  {e.name}
                  {active && <span className="chip chip-on py-0.5 text-[10px]">em uso</span>}
                </div>
                <div className="mt-0.5 font-mono text-xs text-muted">
                  {e.equipment.length} de {TOTAL} equipamentos
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card2">
                  <i className="block h-full rounded-full bg-lime" style={{ width: `${Math.round((e.equipment.length / TOTAL) * 100)}%` }} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {creating ? (
        <div className="card flex flex-col gap-4">
          <TextField
            id="novo-ambiente"
            label="Nome"
            value={name}
            onChange={(v) => {
              setName(v)
              setError('')
            }}
            placeholder="Casa"
          />
          <Section title="Ponto de partida" hint="Depois você ajusta o checklist.">
            <ChoiceChips label="Ponto de partida" options={ENVIRONMENT_PRESETS.map((p) => ({ value: p.name, label: p.name }))} value={[preset]} onChange={(v) => setPreset(v[0])} />
          </Section>
          {error && (
            <p role="alert" className="text-[13px] text-cardio">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-lime flex-1" onClick={create}>
              Criar e editar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => setCreating(true)}>
          + Novo ambiente
        </button>
      )}
    </div>
  )
}

export function AmbienteEditor() {
  const id = Number(useParams().id)
  const env = useEnvironment(id)
  const profile = useProfile()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (env) setName(env.name)
  }, [env?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (env === undefined || !profile) return <Loading />
  if (env === null) return <ScreenHeader back title="Ambiente não encontrado" />

  const active = profile.activeEnvironmentId === id
  const saveName = () => {
    if (name.trim() && name.trim() !== env.name) updateEnvironment(id, { name: name.trim(), icon: initials(name) })
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader back eyebrow={active ? 'Ambiente em uso' : 'Ambiente'} title={env.name} right={<span className="chip chip-on font-mono">{env.equipment.length} itens</span>} />

      <TextField id="nome-ambiente" label="Nome" value={name} onChange={setName} onBlur={saveName} />

      {!active && (
        <button type="button" className="btn btn-lime" onClick={() => setActiveEnvironment(id)}>
          Treinar neste ambiente
        </button>
      )}

      <Section title="Equipamentos" hint={active ? 'Cada mudança adapta o treino na hora.' : 'O treino usa esta lista quando o ambiente estiver em uso.'}>
        <EquipmentChecklist value={env.equipment} onChange={(equipment) => updateEnvironment(id, { equipment })} />
      </Section>

      <div className="card flex flex-col gap-3">
        {confirmDelete ? (
          <>
            <p className="text-sm">Excluir “{env.name}”? Isso não apaga seus treinos registrados.</p>
            {error && (
              <p role="alert" className="text-[13px] text-cardio">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setConfirmDelete(false)}>
                Manter
              </button>
              <button
                type="button"
                className="btn flex-1 border border-cardio/50 bg-cardio/15 text-cardio"
                onClick={async () => {
                  try {
                    await deleteEnvironment(id)
                    navigate('/ambientes', { replace: true })
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              >
                Excluir
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="cursor-pointer text-sm font-semibold text-cardio" onClick={() => setConfirmDelete(true)}>
            Excluir ambiente
          </button>
        )}
      </div>
    </div>
  )
}
