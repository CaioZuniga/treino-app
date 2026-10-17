import { useState } from 'react'
import { backupDue, backupNow, lastBackupAt, snoozeBackup } from '../state/backup'

export function BackupReminder({ firstLogDate }: { firstLogDate?: string }) {
  const [due, setDue] = useState(() => backupDue(firstLogDate))
  const [busy, setBusy] = useState(false)
  if (!due) return null

  const last = lastBackupAt()
  return (
    <div className="card flex flex-col gap-3 border-cardio/40">
      <div>
        <h2 className="font-display text-[15px] font-medium">Hora do backup</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {last
            ? `Seu último backup foi em ${new Date(last).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}.`
            : 'Você ainda não fez nenhum backup.'}{' '}
          Seus treinos ficam só neste celular: se o app for removido ou o celular for trocado, eles se perdem.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            snoozeBackup()
            setDue(false)
          }}
        >
          Depois
        </button>
        <button
          type="button"
          className="btn btn-lime flex-1"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            const result = await backupNow()
            setBusy(false)
            if (result !== 'cancelado') setDue(false)
          }}
        >
          Salvar backup agora
        </button>
      </div>
    </div>
  )
}
