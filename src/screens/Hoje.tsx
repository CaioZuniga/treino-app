import { Link } from 'react-router-dom'
import { BackupReminder } from '../components/BackupReminder'
import { CycleBar, CycleNotices } from '../components/CycleCard'
import { InstallCard } from '../components/InstallCard'
import { Dot, Loading } from '../components/ui'
import { dayKey, WeekStrip } from '../components/WeekStrip'
import { SPLIT_LABELS } from '../engine'
import { blockMinutes } from '../engine/session'
import { currentCycle, initials, sessionForToday, setActiveEnvironment } from '../state/actions'
import { useEnvironments, useLive, useLogs, useProfile, useProgram } from '../state/hooks'

const CARDIO_SHORT = { hiit: 'HIIT', liss: 'LISS', circuito: 'circuito' } as const

export function Hoje() {
  const profile = useProfile()
  const program = useProgram()
  const environments = useEnvironments()
  const logs = useLogs()
  const live = useLive()
  if (!profile || !program || !environments || !logs || live === undefined) return <Loading />

  // Próximo treino: segue a ordem da divisão a partir de quantos treinos já foram feitos.
  const cycle = currentCycle(program, profile)
  const session = live ? live.session : sessionForToday(program.sessions[logs.length % program.sessions.length], cycle)
  const env = environments.find((e) => e.id === profile.activeEnvironmentId)
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const thisWeek = logs.filter((l) => l.date.slice(0, 10) >= dayKey(monday)).length
  const dateLabel = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow">{dateLabel}</div>
          <h1 className="mt-1.5 font-display text-[26px] leading-tight font-bold">Bora, {profile.name}.</h1>
        </div>
        <Link to="/perfil" aria-label="Seu perfil" className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card2 text-[13px] font-bold">
          {initials(profile.name)}
        </Link>
      </div>

      <WeekStrip logs={logs} today={today} />

      <div className="card relative flex flex-col gap-3.5 overflow-hidden border-lime-edge bg-[linear-gradient(140deg,var(--color-lime-deep)_0%,var(--color-card)_62%)]">
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(200,255,61,.28), transparent 70%)' }}
          aria-hidden="true"
        />
        <div className="flex flex-wrap gap-1.5">
          <span className="chip chip-on">
            Treino {session.key} · {SPLIT_LABELS[program.split]}
          </span>
          {env && <span className="chip">{env.name}</span>}
        </div>
        <div>
          <h2 className="font-display text-2xl leading-tight font-bold">{session.title}</h2>
          <p className="mt-1.5 text-xs text-muted">
            {session.subtitle} · {session.estimatedMinutes} min · ~{session.kcal} kcal
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Dot color="mob" /> {blockMinutes(session.mobility, 15)} min mobilidade
          </span>
          <span className="flex items-center gap-1.5">
            <Dot color="lime" /> {session.strength.length} exercícios
          </span>
          {session.cardio && (
            <span className="flex items-center gap-1.5">
              <Dot color="cardio" /> {session.cardio.minutes} min {CARDIO_SHORT[session.cardio.kind]}
            </span>
          )}
        </div>
        {cycle && (
          <div className="relative">
            <CycleBar cycle={cycle} />
          </div>
        )}
        <div className="relative flex gap-2">
          <Link to={`/aovivo/${session.key}`} className="btn btn-lime flex-1">
            {live ? 'Continuar treino' : 'Começar treino'}
          </Link>
          <Link to={`/treino/${session.key}`} className="btn btn-ghost">
            Ver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat value={`${thisWeek}/${profile.daysPerWeek}`} label="treinos na semana" />
        <Stat value={String(logs.length)} label="treinos no total" />
        <Stat value={String(program.sessions.length)} label={`dias na divisão`} />
      </div>

      {cycle && <CycleNotices cycle={cycle} />}

      <BackupReminder firstLogDate={logs[0]?.date} />

      <InstallCard dismissible />

      {environments.length > 1 && (
        <div className="card flex flex-col gap-2.5">
          <h2 className="font-display text-[15px] font-medium">Onde você vai treinar?</h2>
          <div className="flex flex-wrap gap-2">
            {environments.map((e) => (
              <button
                key={e.id}
                type="button"
                aria-pressed={e.id === profile.activeEnvironmentId}
                onClick={() => e.id && setActiveEnvironment(e.id)}
                className={`chip cursor-pointer px-3 py-2 text-[13px] ${e.id === profile.activeEnvironmentId ? 'chip-on' : ''}`}
              >
                {e.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">Trocar o ambiente adapta os exercícios na hora.</p>
        </div>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-card p-3">
      <b className="block font-display text-[19px] font-medium tabular-nums">{value}</b>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  )
}
