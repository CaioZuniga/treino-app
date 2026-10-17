import { exportBackup } from '../db/db'
import { shareOrDownload } from './platform'

// Lembrete de backup: os dados só existem no celular, então o app pede um backup a cada 2 semanas.

const LAST_KEY = 'treino:ultimo-backup'
const SNOOZE_KEY = 'treino:backup-adiado-ate'
const DAY = 24 * 60 * 60 * 1000
export const BACKUP_EVERY_DAYS = 14
const SNOOZE_DAYS = 3

const read = (key: string): number | null => {
  try {
    const v = localStorage.getItem(key)
    return v ? Number(v) : null
  } catch {
    return null
  }
}
const write = (key: string, value: number) => {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Sem armazenamento: o lembrete volta na próxima abertura.
  }
}

export const lastBackupAt = () => read(LAST_KEY)

/**
 * Lembrar quando já existe histórico e o último backup (ou o primeiro treino, se nunca houve backup)
 * passou de 14 dias, a não ser que a pessoa tenha adiado.
 */
export function backupDue(firstLogDate: string | undefined, now = Date.now()): boolean {
  if (!firstLogDate) return false
  const snooze = read(SNOOZE_KEY)
  if (snooze && snooze > now) return false
  const since = lastBackupAt() ?? new Date(firstLogDate).getTime()
  return now - since >= BACKUP_EVERY_DAYS * DAY
}

export function snoozeBackup(now = Date.now()) {
  write(SNOOZE_KEY, now + SNOOZE_DAYS * DAY)
}

/** Gera o arquivo e abre a folha de compartilhar (ou baixa). Marca a data quando não foi cancelado. */
export async function backupNow(): Promise<'compartilhado' | 'baixado' | 'cancelado'> {
  const data = await exportBackup()
  const file = new File([JSON.stringify(data, null, 1)], `treino-backup-${data.exportedAt.slice(0, 10)}.json`, { type: 'application/json' })
  const result = await shareOrDownload(file)
  if (result !== 'cancelado') write(LAST_KEY, Date.now())
  return result
}
