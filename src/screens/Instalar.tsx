import { Navigate, useNavigate } from 'react-router-dom'
import { InstallSteps } from '../components/InstallCard'
import { isStandalone, skipInstall, useInstallState } from '../state/platform'

const BENEFITS = ['Abre em tela cheia, como um app', 'Funciona sem internet na academia', 'Seus treinos ficam guardados no celular']

/** Primeira tela de quem abre o link no navegador do celular: instala antes de fazer o cadastro. */
export function Instalar() {
  const navigate = useNavigate()
  const state = useInstallState()
  const ios = state.startsWith('ios')

  // Já está no app instalado: segue para o cadastro.
  if (isStandalone()) return <Navigate to="/onboarding" replace />

  return (
    <div
      className="mx-auto flex h-full max-w-[480px] flex-col overflow-y-auto bg-bg"
      style={{
        paddingLeft: 'max(24px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(24px, env(safe-area-inset-right, 0px))',
        paddingTop: 'calc(40px + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="screen-enter flex flex-1 flex-col gap-7">
        <div className="relative flex flex-col items-center gap-5 pt-4 text-center">
          <div
            className="pointer-events-none absolute -top-10 h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(200,255,61,.22), transparent 70%)' }}
            aria-hidden="true"
          />
          <img
            src={`${import.meta.env.BASE_URL}pwa-192x192.png`}
            alt=""
            width={96}
            height={96}
            className="relative h-24 w-24 rounded-[26px] border border-line shadow-[0_0_40px_rgba(200,255,61,.25)]"
          />
          <div className="relative">
            <div className="eyebrow">Musculação · aeróbico · mobilidade</div>
            <h1 className="mt-2 font-display text-[30px] leading-tight font-bold text-balance">Instale o Treino</h1>
            <p className="mx-auto mt-2 max-w-[30ch] text-sm leading-relaxed text-muted">
              Leva 10 segundos. Depois você faz o cadastro já dentro do app.
            </p>
          </div>
        </div>

        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime/15 text-xs font-extrabold text-lime" aria-hidden="true">
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>

        <div className="card flex flex-col gap-3.5">
          <h2 className="font-display text-[15px] font-medium">{ios ? 'Como instalar no iPhone' : 'Como instalar no Android'}</h2>
          <InstallSteps state={state} />
          {ios && (
            <p className="text-xs leading-relaxed text-muted">
              Faça o cadastro no app instalado: no iPhone, o que você preencher aqui no Safari não passa para ele.
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-col items-center gap-1 pt-2">
          <button
            type="button"
            className="cursor-pointer py-2 text-sm font-semibold text-muted"
            onClick={() => {
              skipInstall()
              navigate('/onboarding', { replace: true })
            }}
          >
            Continuar no navegador
          </button>
          <span className="text-[11px] text-dim">Dá para instalar depois em Perfil.</span>
        </div>
      </div>
    </div>
  )
}
