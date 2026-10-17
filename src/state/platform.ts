import { useSyncExternalStore } from 'react'
import { EXERCISE_BY_ID, imageUrl } from '../data/catalog'
import type { Program } from '../types'

// Diferenças entre iPhone e Android que o app precisa tratar.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let installEvent: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Aberto pelo ícone da tela de início (app instalado), e não pelo navegador. */
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export function initPlatform() {
  // Android/Chrome: guarda o convite de instalação para mostrar no nosso botão.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installEvent = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    installEvent = null
    justInstalled = true
    notify()
  })
  // Pede para o navegador não apagar os dados do app quando faltar espaço (o iPhone apaga dados de sites
  // não instalados depois de 7 dias sem uso; instalado na tela de início, isso não acontece).
  navigator.storage?.persist?.().catch(() => {})
}

export const isAndroid = () => /android/i.test(navigator.userAgent)

/** No iPhone, só o Safari mostra "Adicionar à Tela de Início" de forma confiável. */
export const isIOSSafari = () => isIOS() && !/crios|fxios|edgios|opios|gsa\//i.test(navigator.userAgent)

let justInstalled = false

/**
 * 'instalado': aberto pelo ícone. 'recem-instalado': o Android acabou de instalar e o app está no navegador.
 * 'android': temos o botão nativo de instalar. 'android-menu': Android sem o convite (instalar pelo menu ⋮).
 * 'ios' / 'ios-outro-navegador': passo a passo no Safari, ou pedir para abrir no Safari.
 */
export type InstallState = 'instalado' | 'recem-instalado' | 'android' | 'android-menu' | 'ios' | 'ios-outro-navegador' | 'indisponivel'

function installState(): InstallState {
  if (isStandalone()) return 'instalado'
  if (justInstalled) return 'recem-instalado'
  if (installEvent) return 'android'
  if (isIOS()) return isIOSSafari() ? 'ios' : 'ios-outro-navegador'
  if (isAndroid()) return 'android-menu'
  return 'indisponivel'
}

const SKIP_KEY = 'treino:instalar-pulado'

/**
 * Celular abrindo pelo navegador: mostra a tela de instalação antes do cadastro. No iPhone isso evita
 * cadastrar duas vezes, porque o Safari e o app instalado guardam os dados separados.
 */
export function shouldOfferInstallFirst(): boolean {
  if (isStandalone() || !(isIOS() || isAndroid())) return false
  try {
    return localStorage.getItem(SKIP_KEY) !== '1'
  } catch {
    return true
  }
}

export function skipInstall() {
  try {
    localStorage.setItem(SKIP_KEY, '1')
  } catch {
    // Sem armazenamento: a tela volta a aparecer na próxima visita.
  }
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    installState,
  )
}

export async function promptInstall(): Promise<boolean> {
  if (!installEvent) return false
  await installEvent.prompt()
  const { outcome } = await installEvent.userChoice
  installEvent = null
  notify()
  return outcome === 'accepted'
}

// --- Som ------------------------------------------------------------------------------------------
// O iPhone só libera áudio criado durante um toque. O contexto é criado no primeiro toque em "concluir série"
// e reaproveitado no aviso de fim de descanso.

let audio: AudioContext | null = null

export function unlockAudio() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') audio.resume()
  } catch {
    audio = null
  }
}

export function beep() {
  if (!audio) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.25, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.5)
  osc.connect(gain).connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + 0.5)
}

/** Vibração curta. No iPhone a API não existe e nada acontece. */
export function haptic(pattern: number | number[] = 12) {
  navigator.vibrate?.(pattern)
}

// --- Offline --------------------------------------------------------------------------------------

/** Baixa as fotos dos exercícios do treino atual; o service worker guarda cada uma no cache. */
export async function prefetchProgramImages(program: Program, onProgress?: (done: number, total: number) => void): Promise<number> {
  const ids = new Set(program.sessions.flatMap((s) => [...s.mobility, ...s.strength].map((x) => x.exerciseId)))
  const urls = [...ids].flatMap((id) => EXERCISE_BY_ID.get(id)?.images ?? []).map(imageUrl)
  let done = 0
  let ok = 0
  await Promise.all(
    urls.map(async (u) => {
      try {
        const res = await fetch(u, { mode: 'no-cors' })
        if (res.type === 'opaque' || res.ok) ok++
      } catch {
        // Sem conexão: a foto fica para a próxima.
      }
      onProgress?.(++done, urls.length)
    }),
  )
  return ok
}

// --- Compartilhar arquivo -------------------------------------------------------------------------

/** iPhone e Android: abre a folha de compartilhar (salvar em Arquivos, Drive, WhatsApp…). Senão, baixa. */
export async function shareOrDownload(file: File): Promise<'compartilhado' | 'baixado' | 'cancelado'> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name })
      return 'compartilhado'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelado'
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  return 'baixado'
}
