import { useState, useMemo } from 'react'
import type { Surebet } from '../types'

type StakingStrategyName = 'equal_profit' | 'proportional' | 'fixed_amount' | 'kelly' | 'flat_percent'

const STRATEGY_LABELS: Record<StakingStrategyName, string> = {
  equal_profit: 'Равная прибыль',
  proportional: 'Пропорционально',
  fixed_amount: 'Фиксированная сумма',
  kelly: 'Критерий Келли',
  flat_percent: 'Фиксированный % банка',
}

interface StakeRow {
  bookmaker: string
  market: string
  selection: string
  odds: number
  stake: number
  profit: number
  roi: number
}

function calculateEqualProfitStakes(fork: Surebet, bankroll: number): StakeRow[] {
  const totalInvProb = fork.legs.reduce((sum, l) => sum + 1 / l.odds, 0)
  return fork.legs.map(leg => {
    const fraction = (1 / leg.odds) / totalInvProb
    const stake = bankroll * fraction
    const profit = stake * leg.odds - bankroll
    return {
      bookmaker: leg.bookmaker, market: leg.market, selection: leg.selection,
      odds: leg.odds, stake: Math.round(stake), profit: Math.round(profit),
      roi: profit / bankroll * 100,
    }
  })
}

function calculateProportionalStakes(fork: Surebet, bankroll: number): StakeRow[] {
  const perLeg = bankroll / fork.legs.length
  return fork.legs.map(leg => {
    const profit = perLeg * leg.odds - perLeg
    return {
      bookmaker: leg.bookmaker, market: leg.market, selection: leg.selection,
      odds: leg.odds, stake: Math.round(perLeg), profit: Math.round(profit),
      roi: profit / perLeg * 100,
    }
  })
}

function calculateFixedStakes(fork: Surebet, fixedAmount: number): StakeRow[] {
  return fork.legs.map(leg => {
    const profit = fixedAmount * leg.odds - fixedAmount
    return {
      bookmaker: leg.bookmaker, market: leg.market, selection: leg.selection,
      odds: leg.odds, stake: fixedAmount, profit: Math.round(profit),
      roi: profit / fixedAmount * 100,
    }
  })
}

function calculateKellyStakes(fork: Surebet, bankroll: number): StakeRow[] {
  return fork.legs.map(leg => {
    const p = 1 / leg.odds
    const q = 1 - p
    const b = leg.odds - 1
    const kellyFraction = Math.max(0, (b * p - q) / b)
    const stake = Math.round(bankroll * kellyFraction * 0.25)
    const profit = stake * leg.odds - stake
    return {
      bookmaker: leg.bookmaker, market: leg.market, selection: leg.selection,
      odds: leg.odds, stake, profit: Math.round(profit),
      roi: stake > 0 ? profit / stake * 100 : 0,
    }
  })
}

function calculateFlatPercentStakes(fork: Surebet, bankroll: number, percent: number): StakeRow[] {
  const perLeg = bankroll * percent
  return fork.legs.map(leg => {
    const profit = perLeg * leg.odds - perLeg
    return {
      bookmaker: leg.bookmaker, market: leg.market, selection: leg.selection,
      odds: leg.odds, stake: Math.round(perLeg), profit: Math.round(profit),
      roi: profit / perLeg * 100,
    }
  })
}

const BOOKMAKER_NAMES: Record<string, string> = {
  pari: 'Пари', fonbet: 'Фонбет', marathon: 'Марафон', leon: 'Леон',
  betcity: 'Бетсити', zenit: 'Зенит', baltbet: 'Балтбет', bettery: 'Беттери',
  bet24: '24бет', tennisi: 'Тенниси', olimp: 'Олимп',
}

interface StakingCalculatorProps {
  fork: Surebet
  onExecute?: (stakes: StakeRow[]) => void
}

export function StakingCalculator({ fork, onExecute }: StakingCalculatorProps) {
  const [strategy, setStrategy] = useState<StakingStrategyName>('equal_profit')
  const [bankroll, setBankroll] = useState(100000)

  const stakes = useMemo(() => {
    switch (strategy) {
      case 'equal_profit': return calculateEqualProfitStakes(fork, bankroll)
      case 'proportional': return calculateProportionalStakes(fork, bankroll)
      case 'fixed_amount': return calculateFixedStakes(fork, 5000)
      case 'kelly': return calculateKellyStakes(fork, bankroll)
      case 'flat_percent': return calculateFlatPercentStakes(fork, bankroll, 0.01)
    }
  }, [fork, strategy, bankroll])

  const totalStake = stakes.reduce((sum, s) => sum + s.stake, 0)
  const guaranteedProfit = Math.min(...stakes.map(s => s.profit))
  const roi = totalStake > 0 ? (guaranteedProfit / totalStake * 100).toFixed(2) : '0'

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Калькулятор ставок</h4>
        <select
          value={strategy}
          onChange={e => setStrategy(e.target.value as StakingStrategyName)}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          {(Object.entries(STRATEGY_LABELS) as [StakingStrategyName, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Банкролл:</label>
        <input
          type="number"
          value={bankroll}
          onChange={e => setBankroll(Number(e.target.value) || 0)}
          className="px-3 py-1.5 rounded-lg text-sm w-32"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>\u20BD</span>
      </div>

      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <th className="text-left py-2 px-2" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>БК</th>
            <th className="text-left py-2 px-2" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Кэф</th>
            <th className="text-right py-2 px-2" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Сумма</th>
            <th className="text-right py-2 px-2" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Прибыль</th>
            <th className="text-right py-2 px-2" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>ROI</th>
          </tr>
        </thead>
        <tbody>
          {stakes.map((s, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td className="py-2 px-2" style={{ color: 'var(--text-primary)' }}>
                {BOOKMAKER_NAMES[s.bookmaker] || s.bookmaker}
              </td>
              <td className="py-2 px-2" style={{ fontFamily: 'monospace', color: 'var(--accent-blue)' }}>
                {s.odds.toFixed(2)}
              </td>
              <td className="py-2 px-2 text-right" style={{ color: 'var(--text-primary)' }}>
                {s.stake.toLocaleString()} \u20BD
              </td>
              <td className="py-2 px-2 text-right" style={{ color: s.profit > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {s.profit > 0 ? '+' : ''}{s.profit.toLocaleString()} \u20BD
              </td>
              <td className="py-2 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                {s.roi.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--border-color)' }}>
            <td colSpan={2} className="py-2 px-2 font-bold" style={{ color: 'var(--text-primary)' }}>ИТОГО:</td>
            <td className="py-2 px-2 text-right font-bold" style={{ color: 'var(--text-primary)' }}>{totalStake.toLocaleString()} \u20BD</td>
            <td className="py-2 px-2 text-right font-bold" style={{ color: guaranteedProfit > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {guaranteedProfit > 0 ? '+' : ''}{guaranteedProfit.toLocaleString()} \u20BD
            </td>
            <td className="py-2 px-2 text-right font-bold" style={{ color: 'var(--text-primary)' }}>{roi}%</td>
          </tr>
        </tfoot>
      </table>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onExecute?.(stakes)}
          className="flex-1 py-2.5 rounded-lg font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, var(--accent-blue, #4f46e5), var(--accent-purple, #7c3aed))',
            color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          СТАВИТЬ В ОБЕ БК
        </button>
        <button
          onClick={() => onExecute?.(stakes.slice(0, 1))}
          className="py-2.5 px-4 rounded-lg text-sm"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
        >
          Только 1-е плечо
        </button>
      </div>
    </div>
  )
}
