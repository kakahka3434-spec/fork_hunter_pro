import { Zap, Star, EyeOff, Clock } from 'lucide-react'
import type { Surebet } from '../types'

const BOOKMAKER_NAMES: Record<string, string> = {
  pari: 'Пари', fonbet: 'Фонбет', marathon: 'Марафон', leon: 'Леон',
  betcity: 'Бетсити', zenit: 'Зенит', baltbet: 'Балтбет', bettery: 'Беттери',
  bet24: '24бет', tennisi: 'Тенниси', olimp: 'Олимп', sportbet: 'Спортбет',
}

const SPORT_ICONS: Record<string, string> = {
  Football: '\u26BD', Tennis: '\uD83C\uDFBE', Basketball: '\uD83C\uDFC0',
  Hockey: '\uD83C\uDFD2', Volleyball: '\uD83C\uDFD0', Baseball: '\u26BE',
  Handball: '\uD83E\uDD3E', TableTennis: '\uD83C\uDFD3',
}

function getProfitClass(profit: number): string {
  if (profit > 2.0) return 'super-profit'
  if (profit > 1.0) return 'high-profit'
  if (profit > 0.5) return 'normal-profit'
  return 'low-profit'
}

function getProfitColor(profit: number): string {
  if (profit > 2.0) return 'var(--profit-super, #00ff88)'
  if (profit > 1.0) return 'var(--profit-high, #22c55e)'
  if (profit > 0.5) return 'var(--profit-normal, #84cc16)'
  return 'var(--profit-low, #eab308)'
}

function formatAge(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

interface ForkCardProps {
  fork: Surebet
  isSelected?: boolean
  isNew?: boolean
  onClick?: () => void
  onExecute?: () => void
  onFavorite?: () => void
  onHide?: () => void
}

export function ForkCard({ fork, isSelected, isNew, onClick, onExecute, onFavorite, onHide }: ForkCardProps) {
  const profitClass = getProfitClass(fork.profit_percent)
  const profitColor = getProfitColor(fork.profit_percent)
  const sportIcon = SPORT_ICONS[String(fork.sport)] || '\u26BD'
  const profitAmount = Math.round(fork.profit_percent / 100 * 10000)

  return (
    <div
      className={`fork-card ${profitClass} ${isSelected ? 'selected' : ''} ${isNew ? 'new' : ''}`}
      onClick={onClick}
      style={{
        background: 'var(--bg-card, var(--bg-secondary))',
        border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
        borderLeft: `4px solid ${profitColor}`,
        borderRadius: 'var(--border-radius, 8px)',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isSelected ? `0 0 0 2px ${profitColor}33` : undefined,
      }}
    >
      {isNew && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'var(--accent-red)', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '2px 6px',
          borderRadius: 4, animation: 'pulse 1.5s infinite',
        }}>NEW</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{sportIcon}</span>
        <span>{fork.league}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          {fork.is_live ? (
            <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-red)', marginRight: 4, animation: 'pulse 1.5s infinite' }} />
              LIVE
            </span>
          ) : (
            <span><Clock size={12} style={{ marginRight: 2 }} />Прематч</span>
          )}
        </span>
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
        <span>{fork.home_team}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>vs</span>
        <span>{fork.away_team}</span>
      </div>

      {/* Legs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {fork.legs.map((leg, idx) => (
          <div key={idx} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr auto',
            alignItems: 'center', gap: 12, padding: '8px 12px',
            background: 'var(--bg-secondary, var(--bg-tertiary))',
            borderRadius: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4 }}>
                {(BOOKMAKER_NAMES[leg.bookmaker] || leg.bookmaker).slice(0, 4).toUpperCase()}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{BOOKMAKER_NAMES[leg.bookmaker] || leg.bookmaker}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{leg.market}</span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)', marginLeft: 4, fontWeight: 500 }}>{leg.selection}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 16, fontWeight: 700, color: 'var(--accent-blue, #3b82f6)' }}>
              {leg.odds.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Profit */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>Прибыль:</span>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 20, fontWeight: 700, color: profitColor }}>
            {fork.profit_percent.toFixed(2)}%
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          ~{profitAmount.toLocaleString()} \u20BD на 10к
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={e => { e.stopPropagation(); onExecute?.() }}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, var(--accent-blue, #4f46e5), var(--accent-purple, #7c3aed))',
            color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Zap size={14} /> Ставить
        </button>
        <button
          onClick={e => { e.stopPropagation(); onFavorite?.() }}
          style={{
            padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          <Star size={14} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onHide?.() }}
          style={{
            padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          <EyeOff size={14} />
        </button>
      </div>
    </div>
  )
}
