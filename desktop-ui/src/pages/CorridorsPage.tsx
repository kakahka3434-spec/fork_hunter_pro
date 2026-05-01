import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, TrendingUp, ArrowRight, Percent, Scale, Zap, Target } from 'lucide-react'
import type { CorridorOpportunity } from '../types'

const BOOKMAKER_NAMES: Record<string, string> = {
  pari: 'Пари', fonbet: 'Фонбет', marathon: 'Марафон', leon: 'Леон',
  betcity: 'Бетсити', zenit: 'Зенит', baltbet: 'Балтбет', bettery: 'Беттери',
  bet24: '24бет', tennisi: 'Тенниси', olimp: 'Олимп', sportbet: 'Спортбет',
}

interface CorridorsPageProps {
  corridors: CorridorOpportunity[]
}

export function CorridorsPage({ corridors }: CorridorsPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const stats = useMemo(() => {
    if (corridors.length === 0) {
      return { count: 0, avgRoi: 0, bestRoi: 0, avgProbability: 0, avgWidth: 0 }
    }
    const totalRoi = corridors.reduce((sum, c) => sum + c.expected_roi, 0)
    const totalProb = corridors.reduce((sum, c) => sum + c.double_win_probability, 0)
    const totalWidth = corridors.reduce((sum, c) => sum + (c.line_high - c.line_low), 0)
    return {
      count: corridors.length,
      avgRoi: totalRoi / corridors.length,
      bestRoi: Math.max(...corridors.map(c => c.expected_roi)),
      avgProbability: (totalProb / corridors.length) * 100,
      avgWidth: totalWidth / corridors.length,
    }
  }, [corridors])

  const selected = corridors.find(c => c.id === selectedId)

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Коридоры</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Коридоры тоталов и фор — выигрыш при попадании в диапазон
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <GitBranch size={18} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Найдено</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.count}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Percent size={18} style={{ color: 'var(--accent-green)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Средний ROI</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.avgRoi.toFixed(2)}%</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>лучший {stats.bestRoi.toFixed(2)}%</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Target size={18} style={{ color: 'var(--accent-yellow)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Средняя ширина</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.avgWidth.toFixed(1)}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Scale size={18} style={{ color: 'var(--accent-purple)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Вероятность попадания</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.avgProbability.toFixed(1)}%</p>
        </div>
      </div>

      {corridors.length > 0 ? (
        <div className="flex gap-6">
          {/* List */}
          <div className="flex-1 space-y-3">
            {corridors.map((cor, i) => {
              const width = cor.line_high - cor.line_low
              const isSelected = selectedId === cor.id
              return (
                <motion.div
                  key={cor.id}
                  className="glass-card p-4 cursor-pointer transition-all"
                  onClick={() => setSelectedId(isSelected ? null : cor.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    borderColor: isSelected ? 'var(--accent-blue)' : undefined,
                    boxShadow: isSelected ? '0 0 0 2px rgba(88, 166, 255, 0.2)' : undefined,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {cor.home_team} — {cor.away_team}
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{cor.league}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} style={{ color: 'var(--accent-green)' }} />
                        <span className="text-sm font-bold" style={{ color: 'var(--accent-green)' }}>
                          ROI {cor.expected_roi.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        P={((cor.double_win_probability ?? 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="flex-1 text-center">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Низ</p>
                      <p className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{cor.line_low}</p>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--accent-blue)' }} />
                    <div className="flex-1 text-center">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Верх</p>
                      <p className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{cor.line_high}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ширина</p>
                      <p className="text-sm font-mono font-bold" style={{ color: 'var(--accent-green)' }}>{width.toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {cor.legs.map((leg, j) => (
                      <div key={j} className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {BOOKMAKER_NAMES[leg.bookmaker] || leg.bookmaker}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{leg.selection}</p>
                        <p className="text-sm font-mono font-bold mt-0.5" style={{ color: 'var(--accent-blue)' }}>
                          {leg.odds.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    className="w-full mt-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple, #7c3aed))',
                      color: '#fff', border: 'none', cursor: 'pointer',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <Zap size={14} /> Ставить
                  </button>
                </motion.div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-80 flex-shrink-0">
              <div className="glass-card p-5 sticky top-0">
                <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Детали коридора</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Событие</span>
                    <span style={{ color: 'var(--text-primary)' }}>{selected.home_team} — {selected.away_team}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Лига</span>
                    <span style={{ color: 'var(--text-primary)' }}>{selected.league}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Диапазон</span>
                    <span className="font-mono" style={{ color: 'var(--accent-green)' }}>
                      {selected.line_low} — {selected.line_high}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Ширина</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {(selected.line_high - selected.line_low).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>ROI</span>
                    <span className="font-mono" style={{ color: 'var(--accent-green)' }}>
                      {selected.expected_roi.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Вероятность</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                      {((selected.double_win_probability ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-16 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
            <GitBranch size={64} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--accent-purple)' }} />
          </motion.div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Коридоры пока не найдены</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Экран подключен к backend-контракту и покажет сделки сразу после появления данных
          </p>
        </div>
      )}
    </motion.div>
  )
}
