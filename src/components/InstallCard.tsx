import { useState } from 'react'
import { promptInstall, useInstallState } from '../state/platform'

const DISMISS_KEY = 'treino:instalar-dispensado'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/** Convite para instalar: botão nativo no Android, passo a passo no iPhone (o Safari não tem botão de instalar). */
export function InstallCard({ dismissible = false }: { dismissible?: boolean }) {
  const state = useInstallState()
  const [dismissed, setDismissed] = useState(readDismissed)

  if (state === 'instalado' || state === 'indisponivel' || (dismissible && dismissed)) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Sem armazenamento: some só nesta visita.
    }
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[15px] font-medium">Instale o app no celular</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">Abre em tela cheia, funciona sem internet e mantém seus dados guardados.</p>
        </div>
        {dismissible && (
          <button type="button" onClick={dismiss} aria-label="Dispensar" className="cursor-pointer px-1 text-lg text-dim">
            ×
          </button>
        )}
      </div>

      {state === 'android' && (
        <button type="button" className="btn btn-lime" onClick={() => promptInstall()}>
          Instalar app
        </button>
      )}

      {state === 'ios' && (
        <ol className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
          <li className="flex items-center gap-3">
            <Step n={1} />
            <span>
              Abra este endereço no <b>Safari</b>.
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Step n={2} />
            <span className="flex items-center gap-1.5">
              Toque em <b>Compartilhar</b> <ShareIcon />
            </span>
          </li>
          <li className="flex items-center gap-3">
            <Step n={3} />
            <span>
              Escolha <b>Adicionar à Tela de Início</b>.
            </span>
          </li>
        </ol>
      )}
    </div>
  )
}

function Step({ n }: { n: number }) {
  return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-card2 font-mono text-xs text-lime">{n}</span>
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-lime" fill="none" stroke="currentColor" strokeWidth="2" aria-label="ícone de compartilhar">
      <path d="M12 3v12M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}
