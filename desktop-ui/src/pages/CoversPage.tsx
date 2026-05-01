import { useState } from 'react'
import { Search, Shield, Trophy } from 'lucide-react'
import type { CoverOption } from '../types'

const BOOKMAKER_NAMES: Record<string, string> = {
  pari: 'Пари', fonbet: 'Фонбет', marathon: 'Марафон', leon: 'Леон',
  betcity: 'Бетсити', zenit: 'Зенит', baltbet: 'Балтбет', bettery: 'Беттери',
  bet24: '24бет', tennisi: 'Тенниси', olimp: 'Олимп',
}

interface ClosedLeg {
  bookmaker: string
  selection: string
  odds: number
  stake: number
}

export function CoversPage() {
  const [closedLeg, setClosedLeg] = useState<ClosedLeg>({ bookmaker: '', selection: '', odds: 0, stake: 0 })
  const [coverOptions, setCoverOptions] = useState<CoverOption[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = () => {
    if (!closedLeg.bookmaker || !closedLeg.odds || !closedLeg.stake) return
    setIsSearching(true)
    setTimeout(() => {
      setCoverOptions([
        {
          bookmaker: 'fonbet', market: 'Total', selection: 'Under 2.5',
          odds: closedLeg.odds * 0.98, required_stake: Math.round(closedLeg.stake * 1.02),
          expected_profit: Math.round(closedLeg.stake * 0.015), execution_time_estimate_ms: 3000,
        },
        {
          bookmaker: 'marathon', market: 'Total', selection: 'Under 2.5',
          odds: closedLeg.odds * 0.97, required_stake: Math.round(closedLeg.stake * 1.03),
          expected_profit: Math.round(closedLeg.stake * 0.01), execution_time_estimate_ms: 4000,
        },
        {
          bookmaker: 'leon', market: 'Total', selection: 'Under 2.5',
          odds: closedLeg.odds * 0.96, required_stake: Math.round(closedLeg.stake * 1.05),
          expected_profit: Math.round(closedLeg.stake * 0.005), execution_time_estimate_ms: 5000,
        },
      ])
      setIsSearching(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Перекрытия</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Найдите лучший вариант перекрытия уже закрытого плеча
        </p>
      </div>

      {/* Closed Leg Input */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h4 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Закрытое плечо:</h4>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>БК</label>
            <select
              value={closedLeg.bookmaker}
              onChange={e => setClosedLeg(prev => ({ ...prev, bookmaker: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="">Выберите БК</option>
              {Object.entries(BOOKMAKER_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Исход</label>
            <input
              type="text"
              value={closedLeg.selection}
              onChange={e => setClosedLeg(prev => ({ ...prev, selection: e.target.value }))}
              placeholder="Over 2.5"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Кэф</label>
            <input
              type="number"
              step="0.01"
              value={closedLeg.odds || ''}
              onChange={e => setClosedLeg(prev => ({ ...prev, odds: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Сумма</label>
            <input
              type="number"
              value={closedLeg.stake || ''}
              onChange={e => setClosedLeg(prev => ({ ...prev, stake: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={!closedLeg.bookmaker || !closedLeg.odds || !closedLeg.stake || isSearching}
          className="px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple, #7c3aed))',
            color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          <Search size={16} />
          {isSearching ? 'Ищем...' : 'Найти перекрытия'}
        </button>
      </div>

      {/* Top 3 Widget */}
      {coverOptions.length > 0 && (
        <>
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Trophy size={18} style={{ color: 'var(--accent-yellow, #f59e0b)' }} />
              Топ-3 варианта
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {coverOptions.slice(0, 3).map((opt, idx) => {
                const colors = ['var(--accent-yellow, #f59e0b)', 'var(--text-secondary)', 'var(--accent-orange, #f0883e)']
                return (
                  <div
                    key={idx}
                    className="rounded-xl p-4 text-center"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `2px solid ${idx === 0 ? colors[0] : 'var(--border-color)'}`,
                    }}
                  >
                    <div className="text-2xl font-bold mb-1" style={{ color: colors[idx] || 'var(--text-primary)' }}>
                      #{idx + 1}
                    </div>
                    <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {BOOKMAKER_NAMES[opt.bookmaker] || opt.bookmaker}
                    </div>
                    <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Кэф: {opt.odds.toFixed(2)}</div>
                    <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      Ставка: {opt.required_stake.toLocaleString()} \u20BD
                    </div>
                    <div
                      className="text-lg font-bold mt-2"
                      style={{ color: opt.expected_profit > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}
                    >
                      {opt.expected_profit > 0 ? '+' : ''}{opt.expected_profit.toLocaleString()} \u20BD
                    </div>
                    <button
                      className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: idx === 0 ? 'var(--accent-blue)' : 'var(--bg-hover, var(--bg-card))',
                        color: idx === 0 ? '#fff' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                    >
                      Ставить
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Full Table */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Найдено {coverOptions.length} вариантов
              </h4>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left p-3" style={{ color: 'var(--text-muted)' }}>БК</th>
                  <th className="text-left p-3" style={{ color: 'var(--text-muted)' }}>Исход</th>
                  <th className="text-right p-3" style={{ color: 'var(--text-muted)' }}>Кэф</th>
                  <th className="text-right p-3" style={{ color: 'var(--text-muted)' }}>Сумма</th>
                  <th className="text-right p-3" style={{ color: 'var(--text-muted)' }}>Ожид. прибыль</th>
                  <th className="text-right p-3" style={{ color: 'var(--text-muted)' }}>Время</th>
                  <th className="text-right p-3"></th>
                </tr>
              </thead>
              <tbody>
                {coverOptions.map((opt, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="p-3" style={{ color: 'var(--text-primary)' }}>{BOOKMAKER_NAMES[opt.bookmaker] || opt.bookmaker}</td>
                    <td className="p-3" style={{ color: 'var(--text-primary)' }}>{opt.selection}</td>
                    <td className="p-3 text-right" style={{ fontFamily: 'monospace', color: 'var(--accent-blue)' }}>{opt.odds.toFixed(2)}</td>
                    <td className="p-3 text-right" style={{ color: 'var(--text-primary)' }}>{opt.required_stake.toLocaleString()} \u20BD</td>
                    <td className="p-3 text-right" style={{ color: opt.expected_profit > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {opt.expected_profit > 0 ? '+' : ''}{opt.expected_profit.toLocaleString()} \u20BD
                    </td>
                    <td className="p-3 text-right" style={{ color: 'var(--text-muted)' }}>~{(opt.execution_time_estimate_ms / 1000).toFixed(0)}s</td>
                    <td className="p-3 text-right">
                      <button
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{ background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        Ставить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {coverOptions.length === 0 && !isSearching && (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <Shield size={48} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Введите данные закрытого плеча и нажмите "Найти перекрытия"</p>
        </div>
      )}
    </div>
  )
}
