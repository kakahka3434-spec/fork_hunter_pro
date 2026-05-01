import { useState } from 'react'

const BOOKMAKER_LIST = [
  { id: 'pari', name: 'Пари' }, { id: 'fonbet', name: 'Фонбет' },
  { id: 'marathon', name: 'Марафон' }, { id: 'leon', name: 'Леон' },
  { id: 'betcity', name: 'Бетсити' }, { id: 'zenit', name: 'Зенит' },
  { id: 'baltbet', name: 'Балтбет' }, { id: 'bettery', name: 'Беттери' },
  { id: 'bet24', name: '24бет' }, { id: 'tennisi', name: 'Тенниси' },
  { id: 'olimp', name: 'Олимп' },
]

export function FreebetCalculator() {
  const [freebetAmount, setFreebetAmount] = useState(1000)
  const [freebetOdds, setFreebetOdds] = useState(2.0)
  const [coverOdds, setCoverOdds] = useState(2.0)
  const [coverBookmaker, setCoverBookmaker] = useState('')

  const coverStake = freebetOdds > 0 && coverOdds > 0
    ? (freebetAmount * (freebetOdds - 1)) / coverOdds
    : 0
  const profitIfWin = freebetAmount * (freebetOdds - 1) - coverStake
  const profitIfLose = coverStake * (coverOdds - 1) - freebetAmount
  const guaranteedProfit = Math.min(profitIfWin, profitIfLose)

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Калькулятор фрибетов
      </h4>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Сумма фрибета</label>
          <div className="flex items-center">
            <input
              type="number"
              value={freebetAmount}
              onChange={e => setFreebetAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Кэф фрибета</label>
          <input
            type="number"
            step="0.01"
            value={freebetOdds}
            onChange={e => setFreebetOdds(Number(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Кэф перекрытия</label>
          <input
            type="number"
            step="0.01"
            value={coverOdds}
            onChange={e => setCoverOdds(Number(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>БК для перекрытия</label>
          <select
            value={coverBookmaker}
            onChange={e => setCoverBookmaker(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="">Выберите БК...</option>
            {BOOKMAKER_LIST.map(bk => <option key={bk.id} value={bk.id}>{bk.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Сумма перекрытия:</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{Math.round(coverStake).toLocaleString()} \u20BD</span>
        </div>
        <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Если фрибет зашёл:</span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent-green)' }}>+{Math.round(profitIfWin).toLocaleString()} \u20BD</span>
        </div>
        <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Если фрибет не зашёл:</span>
          <span className="text-sm font-bold" style={{ color: profitIfLose >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {profitIfLose >= 0 ? '+' : ''}{Math.round(profitIfLose).toLocaleString()} \u20BD
          </span>
        </div>
        <div className="flex justify-between py-2 px-3 rounded-lg" style={{ background: guaranteedProfit >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${guaranteedProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}` }}>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Гарантированная прибыль:</span>
          <span className="text-sm font-bold" style={{ color: guaranteedProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {guaranteedProfit >= 0 ? '+' : ''}{Math.round(guaranteedProfit).toLocaleString()} \u20BD
          </span>
        </div>
      </div>

      <button
        className="w-full py-2.5 rounded-lg font-semibold text-sm"
        style={{
          background: 'linear-gradient(135deg, var(--accent-blue, #4f46e5), var(--accent-purple, #7c3aed))',
          color: '#fff', border: 'none', cursor: 'pointer',
        }}
      >
        Перейти к перекрытию
      </button>
    </div>
  )
}
