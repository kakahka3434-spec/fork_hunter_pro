import { useState } from 'react'
import { User, Plus, Copy, Check, Trash2, Settings, Filter, DollarSign } from 'lucide-react'
import type { BettingProfile, ProfileFilters, StakingStrategy, StakingStrategyType } from '../types'

const DEFAULT_FILTERS: ProfileFilters = {
  sports: [],
  leagues: [],
  excluded_leagues: [],
  bookmakers: [],
  min_profit_percent: 0.5,
  max_profit_percent: 20.0,
  min_odds: 1.1,
  max_odds: 15.0,
  markets: [],
  excluded_markets: [],
  live_only: false,
  prematch_only: false,
}

const DEFAULT_STAKING: StakingStrategy = {
  strategy_type: 'fixed',
  base_stake: 1000,
  max_stake_per_bet: 5000,
  max_daily_stake: 50000,
  max_daily_bets: 50,
}

function createDefaultProfile(name: string): BettingProfile {
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    is_active: false,
    accounts: [],
    filters: { ...DEFAULT_FILTERS },
    staking_strategy: { ...DEFAULT_STAKING },
    settings: {
      auto_accept_odds_drop_percent: 1.0,
      notification_on_fork: true,
      notification_on_bet: true,
      notification_sound: true,
      auto_refresh_interval_secs: 5,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<BettingProfile[]>(() => {
    const defaultProfile = createDefaultProfile('Default')
    defaultProfile.is_active = true
    defaultProfile.description = 'Профиль по умолчанию'
    return [defaultProfile]
  })
  const [activeProfileId, setActiveProfileId] = useState<string>(profiles[0].id)
  const [editingProfile, setEditingProfile] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  const activeProfile = profiles.find(p => p.id === activeProfileId)

  const handleActivate = (profileId: string) => {
    setProfiles(prev =>
      prev.map(p => ({ ...p, is_active: p.id === profileId }))
    )
    setActiveProfileId(profileId)
  }

  const handleCreate = () => {
    if (!newProfileName.trim()) return
    const profile = createDefaultProfile(newProfileName.trim())
    setProfiles(prev => [...prev, profile])
    setShowCreateModal(false)
    setNewProfileName('')
  }

  const handleClone = (profileId: string) => {
    const source = profiles.find(p => p.id === profileId)
    if (!source) return
    const cloned: BettingProfile = {
      ...JSON.parse(JSON.stringify(source)),
      id: crypto.randomUUID(),
      name: `${source.name} (копия)`,
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setProfiles(prev => [...prev, cloned])
  }

  const handleDelete = (profileId: string) => {
    if (profiles.length <= 1) return
    setProfiles(prev => prev.filter(p => p.id !== profileId))
    if (activeProfileId === profileId) {
      const remaining = profiles.filter(p => p.id !== profileId)
      if (remaining.length > 0) {
        handleActivate(remaining[0].id)
      }
    }
  }

  const updateFilter = (key: keyof ProfileFilters, value: ProfileFilters[keyof ProfileFilters]) => {
    if (!editingProfile) return
    setProfiles(prev =>
      prev.map(p =>
        p.id === editingProfile
          ? { ...p, filters: { ...p.filters, [key]: value }, updated_at: new Date().toISOString() }
          : p
      )
    )
  }

  const updateStaking = (key: keyof StakingStrategy, value: StakingStrategy[keyof StakingStrategy]) => {
    if (!editingProfile) return
    setProfiles(prev =>
      prev.map(p =>
        p.id === editingProfile
          ? { ...p, staking_strategy: { ...p.staking_strategy, [key]: value }, updated_at: new Date().toISOString() }
          : p
      )
    )
  }

  const editedProfile = editingProfile ? profiles.find(p => p.id === editingProfile) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Профили</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Группировка аккаунтов, фильтров и стратегий
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          style={{ background: 'var(--accent-blue)', color: '#fff' }}
        >
          <Plus size={14} />
          Новый профиль
        </button>
      </div>

      {/* Profile List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className="rounded-xl p-4 cursor-pointer transition-all"
            style={{
              background: 'var(--bg-card)',
              border: `2px solid ${profile.is_active ? 'var(--accent-blue)' : 'var(--border-color)'}`,
            }}
            onClick={() => setEditingProfile(profile.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.name}</h3>
                  {profile.is_active && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(88, 166, 255, 0.1)', color: 'var(--accent-blue)' }}>
                      Активен
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{profile.description || 'Без описания'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-lg p-2" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Аккаунтов</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{profile.accounts.length}</p>
              </div>
              <div className="rounded-lg p-2" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Стратегия</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{profile.staking_strategy.strategy_type}</p>
              </div>
            </div>

            <div className="flex gap-1.5">
              {!profile.is_active && (
                <button
                  onClick={e => { e.stopPropagation(); handleActivate(profile.id) }}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1"
                  style={{ background: 'var(--accent-blue)', color: '#fff' }}
                >
                  <Check size={12} /> Активировать
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); handleClone(profile.id) }}
                className="px-2 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <Copy size={12} />
              </button>
              {profiles.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(profile.id) }}
                  className="px-2 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--accent-red)', border: '1px solid var(--border-color)' }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Panel */}
      {editedProfile && (
        <div className="rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Настройки: {editedProfile.name}
            </h3>
            <button onClick={() => setEditingProfile(null)} className="text-xs px-3 py-1 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              Закрыть
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filters */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Filter size={16} style={{ color: 'var(--accent-blue)' }} />
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Фильтры</h4>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Мин. прибыль %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editedProfile.filters.min_profit_percent}
                      onChange={e => updateFilter('min_profit_percent', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Макс. прибыль %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editedProfile.filters.max_profit_percent}
                      onChange={e => updateFilter('max_profit_percent', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Мин. кэф</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProfile.filters.min_odds}
                      onChange={e => updateFilter('min_odds', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Макс. кэф</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProfile.filters.max_odds}
                      onChange={e => updateFilter('max_odds', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedProfile.filters.live_only}
                      onChange={e => updateFilter('live_only', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Только LIVE</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedProfile.filters.prematch_only}
                      onChange={e => updateFilter('prematch_only', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Только прематч</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Staking */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={16} style={{ color: 'var(--accent-green)' }} />
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Стратегия ставок</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Тип стратегии</label>
                  <select
                    value={editedProfile.staking_strategy.strategy_type}
                    onChange={e => updateStaking('strategy_type', e.target.value as StakingStrategyType)}
                    className="w-full px-2 py-1.5 rounded text-sm"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="fixed">Фиксированная</option>
                    <option value="proportional">Пропорциональная</option>
                    <option value="kelly">Критерий Келли</option>
                    <option value="custom">Пользовательская</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Базовая ставка</label>
                    <input
                      type="number"
                      value={editedProfile.staking_strategy.base_stake}
                      onChange={e => updateStaking('base_stake', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Макс. на ставку</label>
                    <input
                      type="number"
                      value={editedProfile.staking_strategy.max_stake_per_bet}
                      onChange={e => updateStaking('max_stake_per_bet', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Макс. дневной</label>
                    <input
                      type="number"
                      value={editedProfile.staking_strategy.max_daily_stake}
                      onChange={e => updateStaking('max_daily_stake', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Макс. ставок/день</label>
                    <input
                      type="number"
                      value={editedProfile.staking_strategy.max_daily_bets}
                      onChange={e => updateStaking('max_daily_bets', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded text-sm"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-[400px] rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Новый профиль</h3>
            <input
              type="text"
              value={newProfileName}
              onChange={e => setNewProfileName(e.target.value)}
              placeholder="Название профиля"
              className="w-full px-3 py-2 rounded-lg text-sm mb-4"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                Отмена
              </button>
              <button onClick={handleCreate} disabled={!newProfileName.trim()} className="flex-1 px-4 py-2 rounded-lg text-sm disabled:opacity-40" style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
