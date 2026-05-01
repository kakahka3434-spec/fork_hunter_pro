import { useState, useEffect } from 'react'
import { Target, Check, X, Edit3, Clock, AlertTriangle } from 'lucide-react'
import type { PendingBet, BetUrgency } from '../types'

const URGENCY_COLORS: Record<BetUrgency, string> = {
  low: 'var(--accent-blue)',
  medium: 'var(--accent-yellow)',
  high: 'var(--accent-orange, #f0883e)',
  critical: 'var(--accent-red)',
}

const URGENCY_LABELS: Record<BetUrgency, string> = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
  critical: 'Критическая',
}

export function BettingPage() {
  const [pendingBets, setPendingBets] = useState<PendingBet[]>([])
  const [editingStake, setEditingStake] = useState<string | null>(null)
  const [newStake, setNewStake] = useState('')
  const [completedBets, setCompletedBets] = useState<{ id: string; status: 'confirmed' | 'cancelled'; time: string }[]>([])

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingBets(prev =>
        prev
          .map(b => ({ ...b, time_left_secs: Math.max(0, b.time_left_secs - 1) }))
          .filter(b => b.time_left_secs > 0)
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleConfirm = (betId: string) => {
    setPendingBets(prev => prev.filter(b => b.id !== betId))
    setCompletedBets(prev => [...prev, { id: betId, status: 'confirmed', time: new Date().toLocaleTimeString() }])
  }

  const handleCancel = (betId: string) => {
    setPendingBets(prev => prev.filter(b => b.id !== betId))
    setCompletedBets(prev => [...prev, { id: betId, status: 'cancelled', time: new Date().toLocaleTimeString() }])
  }

  const handleEditStake = (betId: string) => {
    if (editingStake === betId && newStake) {
      setPendingBets(prev =>
        prev.map(b => b.id === betId ? { ...b, stake: parseFloat(newStake) } : b)
      )
      setEditingStake(null)
      setNewStake('')
    } else {
      const bet = pendingBets.find(b => b.id === betId)
      setEditingStake(betId)
      setNewStake(bet?.stake.toString() || '')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Исполнение ставок
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Полуавтоматический режим — подтверждение ставок
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--accent-yellow)' }}>{pendingBets.length}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ожидают</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>{completedBets.filter(b => b.status === 'confirmed').length}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Подтверждено</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--accent-red)' }}>{completedBets.filter(b => b.status === 'cancelled').length}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Отменено</p>
          </div>
        </div>
      </div>

      {/* Pending Bets */}
      <div className="space-y-3">
        {pendingBets.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <Target size={48} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Нет ставок, ожидающих подтверждения</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Ставки появятся при обнаружении вилок в полуавтоматическом режиме
            </p>
          </div>
        ) : (
          pendingBets.map(bet => (
            <div
              key={bet.id}
              className="rounded-xl p-4"
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${bet.time_left_secs < 10 ? 'var(--accent-red)' : 'var(--border-color)'}`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {bet.bookmaker.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: `${URGENCY_COLORS[bet.urgency]}20`, color: URGENCY_COLORS[bet.urgency] }}>
                      {URGENCY_LABELS[bet.urgency]}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{bet.event_name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} style={{ color: bet.time_left_secs < 10 ? 'var(--accent-red)' : 'var(--text-muted)' }} />
                  <span className="text-sm font-mono font-bold" style={{ color: bet.time_left_secs < 10 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                    {bet.time_left_secs}s
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Рынок</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{bet.market} — {bet.selection}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Коэффициент</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{bet.actual_odds.toFixed(2)}</span>
                    {bet.actual_odds !== bet.requested_odds && (
                      <span className="text-xs" style={{ color: bet.actual_odds >= bet.requested_odds ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        (запрос: {bet.requested_odds.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ставка</p>
                  {editingStake === bet.id ? (
                    <input
                      type="number"
                      value={newStake}
                      onChange={e => setNewStake(e.target.value)}
                      className="w-full px-2 py-1 rounded text-sm"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-blue)', color: 'var(--text-primary)' }}
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {bet.stake.toLocaleString()} RUB
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirm(bet.id)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
                  style={{ background: 'var(--accent-green)', color: '#fff' }}
                >
                  <Check size={14} />
                  Подтвердить
                </button>
                <button
                  onClick={() => handleEditStake(bet.id)}
                  className="px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  <Edit3 size={14} />
                  {editingStake === bet.id ? 'Сохранить' : 'Изменить'}
                </button>
                <button
                  onClick={() => handleCancel(bet.id)}
                  className="px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
                  style={{ background: 'var(--accent-red)', color: '#fff' }}
                >
                  <X size={14} />
                  Отклонить
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Activity */}
      {completedBets.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Последние действия</h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {completedBets.slice(-10).reverse().map(bet => (
              <div key={`${bet.id}-${bet.time}`} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {bet.status === 'confirmed' ? (
                    <Check size={14} style={{ color: 'var(--accent-green)' }} />
                  ) : (
                    <X size={14} style={{ color: 'var(--accent-red)' }} />
                  )}
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {bet.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: bet.status === 'confirmed' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {bet.status === 'confirmed' ? 'Подтверждено' : 'Отменено'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{bet.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
