import { useState, type ReactNode } from 'react'
import { promptInstall, useInstallState, type InstallState } from '../state/platform'

const DISMISS_KEY = 'treino:instalar-dispensado'
const APP_URL = 'https://caiozuniga.github.io/treino-app/'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/** Passo a passo de instalação para cada situação (usado na tela Instalar e no cartão). */
export function InstallSteps({ state }: { state: InstallState }) {
  const [copied, setCopied] = useState(false)

  if (state === 'android') {
    return (
      <button type="button" className="btn btn-lime w-full" onClick={() => promptInstall()}>
        Instalar app
      </button>
    )
  }

  if (state === 'recem-instalado') {
    return (
      <p className="rounded-2xl border border-lime/35 bg-lime/10 p-3.5 text-sm">
        Pronto! Feche o navegador e abra o <b>Treino</b> pelo ícone na tela inicial.
      </p>
    )
  }

  if (state === 'android-menu') {
    return (
      <Steps
        items={[
          <>
            Toque no menu <b>⋮</b> do Chrome, no canto de cima.
          </>,
          <>
            Escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).
          </>,
          <>Abra o Treino pelo ícone novo.</>,
        ]}
      />
    )
  }

  if (state === 'ios-outro-navegador') {
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(APP_URL)
        setCopied(true)
      } catch {
        setCopied(false)
      }
    }
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed">
          No iPhone, a instalação funciona pelo <b>Safari</b>. Copie o endereço e cole no Safari.
        </p>
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-card2 p-2 pl-3">
          <code className="min-w-0 flex-1 font-mono text-xs break-all text-lime select-all">{APP_URL}</code>
          <button type="button" className="btn btn-lime px-3 py-2 text-sm" onClick={copy}>
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    )
  }

  if (state === 'ios') {
    return (
      <Steps
        items={[
          <span className="flex flex-wrap items-center gap-1.5">
            Toque em <b>Compartilhar</b> <ShareIcon /> na barra do Safari.
          </span>,
          <>
            Role e toque em <b>Adicionar à Tela de Início</b>.
          </>,
          <>
            Toque em <b>Adicionar</b> e abra o Treino pelo ícone novo.
          </>,
        ]}
      />
    )
  }

  return null
}

/** Convite para instalar dentro do app (Hoje e Perfil), para quem pulou a tela Instalar. */
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
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Abre em tela cheia e funciona sem internet.
            {state.startsWith('ios') && ' No iPhone, o app instalado começa sem os dados deste navegador: exporte um backup em Perfil e importe lá.'}
          </p>
        </div>
        {dismissible && (
          <button type="button" onClick={dismiss} aria-label="Dispensar" className="cursor-pointer px-1 text-lg text-dim">
            ×
          </button>
        )}
      </div>
      <InstallSteps state={state} />
    </div>
  )
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-card2 font-mono text-xs text-lime">{i + 1}</span>
          <span className="leading-snug">{item}</span>
        </li>
      ))}
    </ol>
  )
}

export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="inline h-[18px] w-[18px] text-lime" fill="none" stroke="currentColor" strokeWidth="2" role="img" aria-label="ícone de compartilhar">
      <path d="M12 3v12M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}
