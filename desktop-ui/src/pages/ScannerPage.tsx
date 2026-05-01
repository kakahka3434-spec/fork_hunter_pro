import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, Volume2, VolumeX, ArrowDownNarrowWide, Radio, Pause, Play, ChevronDown } from 'lucide-react'
import type { Surebet } from '../types'
import { ForkCard } from '../components/ForkCard'
import { StakingCalculator } from '../components/StakingCalculator'
import { ExecutionPanel } from '../components/ExecutionPanel'
import { useSoundAlerts } from '../hooks/useSoundAlerts'

type ViewMode = 'live' | 'prematch'
type BetExecutionMode = 'auto' | 'semi_auto' | 'manual'

interface ScannerPageProps {
  surebets: Surebet[]
  isScanning?: boolean
}

export function ScannerPage({ surebets, isScanning = true }: ScannerPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('live')
  const [selectedFork, setSelectedFork] = useState<Surebet | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const [executionMode, setExecutionMode] = useState<BetExecutionMode>('semi_auto')
  const [search, setSearch] = useState('')
  const [minProfit, setMinProfit] = useState(0.5)
  const [maxProfit, setMaxProfit] = useState(30)
  const [showFilters, setShowFilters] = useState(false)
  const [paused, setPaused] = useState(false)
  const { playAlert } = useSoundAlerts()

  const filtered = useMemo(() => {
    let result = [...surebets]
    if (viewMode === 'live') result = result.filter(s => s.is_live)
    else result = result.filter(s => !s.is_live)

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.home_team.toLowerCase().includes(q) ||
        s.away_team.toLowerCase().includes(q) ||
        s.league.toLowerCase().includes(q) ||
        s.legs.some(l => l.bookmaker.toLowerCase().includes(q))
      )
    }
    result = result.filter(s => s.profit_percent >= minProfit && s.profit_percent <= maxProfit)
    result.sort((a, b) => b.profit_percent - a.profit_percent)
    return result
  }, [surebets, viewMode, search, minProfit, maxProfit])

  useEffect(() => {
    if (soundEnabled && filtered.some(f => f.profit_percent > 1.0)) {
      playAlert('new_fork')
    }
  }, [filtered.length])

  const stats = useMemo(() => ({
    total: filtered.length,
    avgProfit: filtered.length > 0 ? filtered.reduce((s, f) => s + f.profit_percent, 0) / filtered.length : 0,
    maxProfit: filtered.length > 0 ? Math.max(...filtered.map(f => f.profit_percent)) : 0,
    liveCount: surebets.filter(s => s.is_live).length,
    prematchCount: surebets.filter(s => !s.is_live).length,
  }), [filtered, surebets])

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setViewMode('live')}
            className="px-4 py-2 text-sm font-medium flex items-center gap-2"
            style={{
              background: viewMode === 'live' ? 'var(--accent-red, #ef4444)' : 'var(--bg-secondary)',
              color: viewMode === 'live' ? '#fff' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer',
            }}
          >
            <Radio size={14} /> LIVE ({stats.liveCount})
          </button>
          <button
            onClick={() => setViewMode('prematch')}
            className="px-4 py-2 text-sm font-medium"
            style={{
              background: viewMode === 'prematch' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
              color: viewMode === 'prematch' ? '#fff' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer',
            }}
          >
            Prematch ({stats.prematchCount})
          </button>
        </div>

        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по команде, лиге, БК..."
            className="input pl-10 w-full"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          style={{
            background: showFilters ? 'rgba(88,166,255,0.15)' : 'var(--bg-secondary)',
            border: '1px solid var(--border-color)', cursor: 'pointer',
            color: showFilters ? 'var(--accent-blue)' : 'var(--text-secondary)',
          }}
        >
          <SlidersHorizontal size={14} /> Фильтры <ChevronDown size={12} />
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="px-3 py-2 rounded-lg"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button
          onClick={() => setPaused(!paused)}
          className="px-3 py-2 rounded-lg"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer', color: paused ? 'var(--accent-yellow)' : 'var(--text-secondary)' }}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Мин. прибыль %</label>
                <input type="number" step={0.1} value={minProfit} onChange={e => setMinProfit(Number(e.target.value))} className="input w-24" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Макс. прибыль %</label>
                <input type="number" step={0.1} value={maxProfit} onChange={e => setMaxProfit(Number(e.target.value))} className="input w-24" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="flex gap-4 text-sm">
        <div className="px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Найдено: </span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Сред. прибыль: </span>
          <span className="font-mono font-bold" style={{ color: 'var(--accent-green)' }}>{stats.avgProfit.toFixed(2)}%</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Макс: </span>
          <span className="font-mono font-bold" style={{ color: 'var(--profit-super, #00ff88)' }}>{stats.maxProfit.toFixed(2)}%</span>
        </div>
        {isScanning && (
          <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="w-2 h-2 rounded-full glow-live" style={{ background: 'var(--accent-green)' }} />
            <span style={{ color: 'var(--accent-green)' }}>Сканирование</span>
          </div>
        )}
      </div>

      {/* Main area: fork list + details */}
      <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Fork list */}
        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {filtered.length > 0 ? (
            filtered.map(fork => (
              <ForkCard
                key={fork.id}
                fork={fork}
                isSelected={selectedFork?.id === fork.id}
                onClick={() => setSelectedFork(fork)}
                onExecute={() => {}}
              />
            ))
          ) : (
            <div className="text-center py-16">
              <ArrowDownNarrowWide size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {paused ? 'Сканирование на паузе' : 'Вилки не найдены — ожидание данных'}
              </p>
            </div>
          )}
        </div>

        {/* Fork details panel */}
        {selectedFork && (
          <motion.div
            className="w-96 flex-shrink-0 overflow-y-auto space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ maxHeight: 'calc(100vh - 280px)' }}
          >
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                {selectedFork.home_team} vs {selectedFork.away_team}
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Лига</span>
                  <span style={{ color: 'var(--text-primary)' }}>{selectedFork.league}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Спорт</span>
                  <span style={{ color: 'var(--text-primary)' }}>{selectedFork.sport}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Прибыль</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--accent-green)' }}>
                    {selectedFork.profit_percent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Тип</span>
                  <span style={{ color: selectedFork.is_live ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                    {selectedFork.is_live ? 'LIVE' : 'Прематч'}
                  </span>
                </div>
              </div>
            </div>

            <StakingCalculator fork={selectedFork} />

            <ExecutionPanel
              fork={selectedFork}
              mode={executionMode}
              onModeChange={setExecutionMode}
              onExecute={() => {}}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
