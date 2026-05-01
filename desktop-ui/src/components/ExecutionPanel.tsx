import { Bot, Zap, Hand } from 'lucide-react'
import type { BetExecutionMode, Surebet } from '../types'

const BOOKMAKER_NAMES: Record<string, string> = {
  pari: 'Пари', fonbet: 'Фонбет', marathon: 'Марафон', leon: 'Леон',
  betcity: 'Бетсити', zenit: 'Зенит', baltbet: 'Балтбет', bettery: 'Беттери',
  bet24: '24бет', tennisi: 'Тенниси', olimp: 'Олимп',
}

const MODE_CONFIG: Record<BetExecutionMode, { icon: typeof Bot; label: string; description: string; actionLabel: string }> = {
  auto: {
    icon: Bot,
    label: 'Авто',
    description: 'Полностью автоматическое размещение ставок',
    actionLabel: 'АВТОСТАВКА',
  },
  semi_auto: {
    icon: Zap,
    label: 'Полуавто',
    description: 'Заполнение купона + ожидание подтверждения',
    actionLabel: 'ПОЛУАВТОСТАВКА',
  },
  manual: {
    icon: Hand,
    label: 'Ручной',
    description: 'Открытие событий для ручного размещения',
    actionLabel: 'ОТКРЫТЬ СОБЫТИЯ',
  },
}

const ACTION_LABELS: Record<BetExecutionMode, string> = {
  auto: 'Автоставка',
  semi_auto: 'Заполнить купон',
  manual: 'Открыть событие',
}

interface ExecutionPanelProps {
  fork: Surebet
  mode: BetExecutionMode
  onModeChange: (mode: BetExecutionMode) => void
  onExecute: () => void
}

export function ExecutionPanel({ fork, mode, onModeChange, onExecute }: ExecutionPanelProps) {
  const config = MODE_CONFIG[mode]

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
          Режим исполнения:
        </label>
        <div className="flex gap-2">
          {(Object.keys(MODE_CONFIG) as BetExecutionMode[]).map(m => {
            const cfg = MODE_CONFIG[m]
            const Icon = cfg.icon
            const active = mode === m
            return (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(88, 166, 255, 0.15)' : 'var(--bg-secondary)',
                  border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                  color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <Icon size={16} />
                {cfg.label}
              </button>
            )
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          {config.description}
        </p>
      </div>

      <div className="mb-4">
        <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Предпросмотр действий:
        </h5>
        <div className="space-y-2">
          {fork.legs.map((leg, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--accent-blue)', color: '#fff' }}
              >
                {idx + 1}
              </span>
              <div className="flex-1">
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {ACTION_LABELS[mode]} в <strong>{BOOKMAKER_NAMES[leg.bookmaker] || leg.bookmaker}</strong>
                </span>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {leg.market} — {leg.selection} @ {leg.odds.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onExecute}
        className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, var(--accent-blue, #4f46e5), var(--accent-purple, #7c3aed))',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14,
        }}
      >
        {(() => { const Icon = config.icon; return <Icon size={18} /> })()}
        {config.actionLabel}
      </button>
    </div>
  )
}
