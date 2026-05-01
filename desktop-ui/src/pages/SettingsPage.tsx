import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, Bell, Shield, Database, Zap, Globe, Palette, Keyboard, Filter, Plus, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type SectionId = 'general' | 'scanner' | 'filters' | 'notifications' | 'security' | 'proxy' | 'display' | 'hotkeys'

const SECTIONS: { id: SectionId; label: string; Icon: typeof Settings }[] = [
  { id: 'general', label: 'Общие', Icon: Settings },
  { id: 'scanner', label: 'Сканер', Icon: Zap },
  { id: 'filters', label: 'Фильтры', Icon: Filter },
  { id: 'notifications', label: 'Уведомления', Icon: Bell },
  { id: 'security', label: 'Безопасность', Icon: Shield },
  { id: 'proxy', label: 'Прокси', Icon: Globe },
  { id: 'display', label: 'Отображение', Icon: Palette },
  { id: 'hotkeys', label: 'Горячие клавиши', Icon: Keyboard },
]

interface ScannerSettings {
  liveRefreshMs: number
  prematchRefreshMs: number
  forkTtlSecs: number
  minProfitDisplay: number
  minProfitAlert: number
  maxForksInMemory: number
  enableNegativeForks: boolean
  enableCorridors: boolean
  enableCovers: boolean
  soundEnabled: boolean
  autoScroll: boolean
}

interface FilterPresetState {
  id: string
  name: string
  description: string
  minProfit: number
  maxProfit: number
  minOdds: number
  maxOdds: number
  leaguesFilter: 'top' | 'extended' | 'all'
  excludeWomen: boolean
  excludeYouth: boolean
  excludeFriendly: boolean
  excludeTennisDoubles: boolean
  liveOnly: boolean
  prematchOnly: boolean
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
        style={{ background: checked ? 'var(--accent-blue)' : 'var(--bg-hover, #374151)' }}></div>
    </label>
  )
}

function RangeInput({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</label>
        <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{value} {suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: 'var(--accent-blue)' }}
      />
    </div>
  )
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>('general')
  const [scanner, setScanner] = useState<ScannerSettings>({
    liveRefreshMs: 500, prematchRefreshMs: 5000, forkTtlSecs: 30,
    minProfitDisplay: 0.5, minProfitAlert: 1.0, maxForksInMemory: 1000,
    enableNegativeForks: false, enableCorridors: false, enableCovers: false,
    soundEnabled: true, autoScroll: true,
  })
  const [presets, setPresets] = useState<FilterPresetState[]>([
    { id: '1', name: 'Стандартный', description: 'Базовый фильтр', minProfit: 0.5, maxProfit: 30, minOdds: 1.1, maxOdds: 15, leaguesFilter: 'all', excludeWomen: false, excludeYouth: false, excludeFriendly: false, excludeTennisDoubles: false, liveOnly: false, prematchOnly: false },
    { id: '2', name: 'Топ лиги', description: 'Только топ-чемпионаты', minProfit: 1.0, maxProfit: 20, minOdds: 1.3, maxOdds: 10, leaguesFilter: 'top', excludeWomen: true, excludeYouth: true, excludeFriendly: true, excludeTennisDoubles: true, liveOnly: false, prematchOnly: false },
  ])
  const [activePresetId, setActivePresetId] = useState('1')

  const updateScanner = (key: keyof ScannerSettings, val: number | boolean) => setScanner(prev => ({ ...prev, [key]: val }))

  const handleSave = () => toast.success('Настройки сохранены')

  const addPreset = () => {
    const id = String(Date.now())
    setPresets(prev => [...prev, { id, name: 'Новый фильтр', description: '', minProfit: 0.5, maxProfit: 30, minOdds: 1.1, maxOdds: 15, leaguesFilter: 'all', excludeWomen: false, excludeYouth: false, excludeFriendly: false, excludeTennisDoubles: false, liveOnly: false, prematchOnly: false }])
    setActivePresetId(id)
  }

  const duplicatePreset = (p: FilterPresetState) => {
    const id = String(Date.now())
    setPresets(prev => [...prev, { ...p, id, name: `${p.name} (копия)` }])
    setActivePresetId(id)
  }

  const deletePreset = (id: string) => {
    if (presets.length <= 1) return
    setPresets(prev => prev.filter(p => p.id !== id))
    if (activePresetId === id) setActivePresetId(presets[0]?.id || '')
  }

  const updatePreset = (id: string, key: keyof FilterPresetState, val: string | number | boolean) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, [key]: val } : p))
  }

  const activePreset = presets.find(p => p.id === activePresetId)

  return (
    <motion.div className="flex h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Settings Sidebar */}
      <div className="w-56 flex-shrink-0 border-r py-4 pr-4 space-y-1" style={{ borderColor: 'var(--border-color)' }}>
        {SECTIONS.map(sec => {
          const Icon = sec.Icon
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeSection === sec.id ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
                color: activeSection === sec.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <Icon size={16} />
              {sec.label}
            </button>
          )
        })}
        <div className="pt-4">
          <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            <Save size={16} /> Сохранить
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeSection === 'general' && (
          <div className="space-y-6 max-w-xl">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Общие настройки</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Размер банкролла (\u20BD)</label>
                <input type="number" defaultValue={100000} step={10000} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Язык интерфейса</label>
                <select defaultValue="ru" className="input w-full">
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Автозапуск сканера</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Запускать сканирование при старте</p>
                </div>
                <Toggle checked={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'scanner' && (
          <div className="space-y-6 max-w-xl">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Настройки сканера</h3>
            <div className="space-y-5">
              <RangeInput label="Интервал обновления Live" value={scanner.liveRefreshMs} min={100} max={2000} step={100} suffix="мс" onChange={v => updateScanner('liveRefreshMs', v)} />
              <RangeInput label="Интервал обновления Prematch" value={scanner.prematchRefreshMs} min={1000} max={30000} step={1000} suffix="мс" onChange={v => updateScanner('prematchRefreshMs', v)} />
              <RangeInput label="Время жизни вилки" value={scanner.forkTtlSecs} min={10} max={120} step={5} suffix="с" onChange={v => updateScanner('forkTtlSecs', v)} />
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Мин. прибыль для отображения (%)</label>
                <input type="number" step={0.1} value={scanner.minProfitDisplay} onChange={e => updateScanner('minProfitDisplay', Number(e.target.value))} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Мин. прибыль для звука (%)</label>
                <input type="number" step={0.1} value={scanner.minProfitAlert} onChange={e => updateScanner('minProfitAlert', Number(e.target.value))} className="input w-full" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Отрицательные вилки (бонусхантинг)</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Поиск вилок до -2% для отыгрыша бонусов</p>
                </div>
                <Toggle checked={scanner.enableNegativeForks} onChange={v => updateScanner('enableNegativeForks', v)} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Коридоры</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Включить поиск коридоров</p>
                </div>
                <Toggle checked={scanner.enableCorridors} onChange={v => updateScanner('enableCorridors', v)} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Перекрытия</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Включить поиск перекрытий</p>
                </div>
                <Toggle checked={scanner.enableCovers} onChange={v => updateScanner('enableCovers', v)} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'filters' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Фильтры и мультифильтры</h3>
            <div className="flex gap-4">
              {/* Presets list */}
              <div className="w-64 space-y-2">
                {presets.map(p => (
                  <div key={p.id}
                    onClick={() => setActivePresetId(p.id)}
                    className="p-3 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: p.id === activePresetId ? 'rgba(88, 166, 255, 0.1)' : 'var(--bg-secondary)',
                      border: `1px solid ${p.id === activePresetId ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); duplicatePreset(p) }} className="p-1 rounded" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Copy size={12} /></button>
                        <button onClick={e => { e.stopPropagation(); deletePreset(p.id) }} className="p-1 rounded" style={{ background: 'none', border: 'none', cursor: 'pointer', color: presets.length > 1 ? 'var(--accent-red, #ef4444)' : 'var(--text-muted)' }} disabled={presets.length <= 1}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{p.description || 'Без описания'}</p>
                  </div>
                ))}
                <button onClick={addPreset} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-sm"
                  style={{ border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <Plus size={14} /> Новый фильтр
                </button>
              </div>

              {/* Preset editor */}
              {activePreset && (
                <div className="flex-1 space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Название</label>
                    <input value={activePreset.name} onChange={e => updatePreset(activePreset.id, 'name', e.target.value)} className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Описание</label>
                    <input value={activePreset.description} onChange={e => updatePreset(activePreset.id, 'description', e.target.value)} className="input w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Мин. прибыль %</label>
                      <input type="number" step={0.1} value={activePreset.minProfit} onChange={e => updatePreset(activePreset.id, 'minProfit', Number(e.target.value))} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Макс. прибыль %</label>
                      <input type="number" step={0.1} value={activePreset.maxProfit} onChange={e => updatePreset(activePreset.id, 'maxProfit', Number(e.target.value))} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Мин. кэф</label>
                      <input type="number" step={0.1} value={activePreset.minOdds} onChange={e => updatePreset(activePreset.id, 'minOdds', Number(e.target.value))} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Макс. кэф</label>
                      <input type="number" step={0.1} value={activePreset.maxOdds} onChange={e => updatePreset(activePreset.id, 'maxOdds', Number(e.target.value))} className="input w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Фильтр лиг</label>
                    <select value={activePreset.leaguesFilter} onChange={e => updatePreset(activePreset.id, 'leaguesFilter', e.target.value)} className="input w-full">
                      <option value="all">Все лиги</option>
                      <option value="top">Только топ (АПЛ, Ла Лига, РПЛ, NHL, NBA...)</option>
                      <option value="extended">Расширенные (топ + вторые)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    {([
                      ['excludeWomen', 'Исключить женские лиги'],
                      ['excludeYouth', 'Исключить молодёжные (U19, U21)'],
                      ['excludeFriendly', 'Исключить товарищеские'],
                      ['excludeTennisDoubles', 'Исключить парный теннис'],
                      ['liveOnly', 'Только Live'],
                      ['prematchOnly', 'Только Prematch'],
                    ] as [keyof FilterPresetState, string][]).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
                        <Toggle checked={!!activePreset[key]} onChange={v => updatePreset(activePreset.id, key, v)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="space-y-6 max-w-xl">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Уведомления</h3>
            <div className="space-y-3">
              {[
                { label: 'Telegram уведомления', desc: 'Отправлять вилки в Telegram бота', def: true },
                { label: 'Звуковые уведомления', desc: 'Звук при нахождении вилки > порога', def: true },
                { label: 'Push уведомления', desc: 'Браузерные push уведомления', def: false },
                { label: 'Email рассылка', desc: 'Ежедневная сводка на email', def: false },
                { label: 'Оповещение о коридорах', desc: 'Уведомлять о найденных коридорах', def: false },
                { label: 'Уведомление о перекрытиях', desc: 'Оповещать при найденном перекрытии', def: false },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                  <Toggle checked={item.def} onChange={() => {}} />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Telegram Bot Token</label>
                <input type="password" placeholder="123456:ABC-DEF..." className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Telegram Chat ID</label>
                <input type="text" placeholder="-1001234567890" className="input w-full" />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="space-y-6 max-w-xl">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Безопасность</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Шифрование паролей</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>AES-256 шифрование всех сохранённых паролей</p>
                </div>
                <Toggle checked={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Автоблокировка</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Блокировка при неактивности 15 мин</p>
                </div>
                <Toggle checked={false} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Fingerprint изоляция</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Уникальный отпечаток на каждый аккаунт БК</p>
                </div>
                <Toggle checked={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'proxy' && (
          <div className="space-y-6 max-w-xl">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Прокси</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Использовать прокси</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Маршрутизация через прокси-сервер</p>
                </div>
                <Toggle checked={false} onChange={() => {}} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Прокси сервер</label>
                <input type="text" placeholder="socks5://user:pass@host:port" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Список прокси (по одному на строку)</label>
                <textarea rows={4} placeholder="socks5://user:pass@host:port" className="input w-full" style={{ resize: 'vertical' }}></textarea>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Ротация прокси</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Автоматическая смена прокси каждые N запросов</p>
                </div>
                <Toggle checked={false} onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'display' && (
          <div className="space-y-6 max-w-xl">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Отображение</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Тема</label>
                <select defaultValue="dark" className="input w-full">
                  <option value="dark">Тёмная (Forking style)</option>
                  <option value="light">Светлая</option>
                  <option value="system">Системная</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Размер шрифта</label>
                <select defaultValue="medium" className="input w-full">
                  <option value="small">Мелкий</option>
                  <option value="medium">Средний</option>
                  <option value="large">Крупный</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Компактный режим</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Уменьшить отступы для большего количества вилок</p>
                </div>
                <Toggle checked={false} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Анимации</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Плавные переходы и анимации</p>
                </div>
                <Toggle checked={true} onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'hotkeys' && (
          <div className="space-y-6 max-w-xl">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Горячие клавиши</h3>
            <div className="space-y-2">
              {[
                ['Ctrl+S', 'Сохранить настройки'],
                ['Ctrl+1', 'Сканер'],
                ['Ctrl+2', 'Аккаунты'],
                ['Ctrl+3', 'Ставки'],
                ['Ctrl+4', 'Коридоры'],
                ['Ctrl+5', 'Перекрытия'],
                ['Ctrl+6', 'История'],
                ['Ctrl+F', 'Поиск вилки'],
                ['Ctrl+E', 'Быстрая ставка'],
                ['Space', 'Пауза/Возобновление сканирования'],
                ['M', 'Вкл/Выкл звук'],
              ].map(([key, desc], i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{desc}</span>
                  <kbd className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--bg-hover, var(--bg-card))', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
