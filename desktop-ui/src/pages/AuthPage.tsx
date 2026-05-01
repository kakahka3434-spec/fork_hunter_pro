import { useState } from 'react'
import { Shield, Plus, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import type { AuthAccountSummary, AuthStatus } from '../types'

const STATUS_CONFIG: Record<AuthStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  not_configured: { label: 'Не настроен', color: 'var(--text-muted)', icon: Clock },
  ready_to_auth: { label: 'Готов', color: 'var(--accent-blue)', icon: Clock },
  authenticating: { label: 'Вход...', color: 'var(--accent-yellow)', icon: RefreshCw },
  awaiting_captcha: { label: 'Капча', color: 'var(--accent-yellow)', icon: AlertTriangle },
  awaiting_2fa: { label: '2FA', color: 'var(--accent-yellow)', icon: Shield },
  authenticated: { label: 'Авторизован', color: 'var(--accent-green)', icon: CheckCircle },
  session_expired: { label: 'Сессия истекла', color: 'var(--accent-red)', icon: XCircle },
  auth_failed: { label: 'Ошибка', color: 'var(--accent-red)', icon: XCircle },
  blocked: { label: 'Заблокирован', color: 'var(--accent-red)', icon: XCircle },
}

const BOOKMAKER_NAMES: Record<string, string> = {
  pari: 'Пари',
  fonbet: 'Фонбет',
  marathon: 'Марафон',
  leon: 'Леон',
  betcity: 'Бетсити',
  zenit: 'Зенит',
  baltbet: 'Балтбет',
  bettery: 'Беттери',
  bet24: '24бет',
  tennisi: 'Тенниси',
  olimp: 'Олимп',
}

interface AddAccountFormData {
  bookmaker_id: string
  login: string
  password: string
  phone_prefix: string
  two_fa_type: string
}

export function AuthPage() {
  const [accounts, setAccounts] = useState<AuthAccountSummary[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCaptchaModal, setShowCaptchaModal] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [captchaValue, setCaptchaValue] = useState('')
  const [twoFACode, setTwoFACode] = useState('')
  const [formData, setFormData] = useState<AddAccountFormData>({
    bookmaker_id: 'pari',
    login: '',
    password: '',
    phone_prefix: '+7',
    two_fa_type: 'none',
  })

  const handleAddAccount = () => {
    const masked = formData.login.length > 4
      ? `${formData.login.slice(0, 3)}****`
      : '****'
    const newAccount: AuthAccountSummary = {
      id: crypto.randomUUID(),
      bookmaker_id: formData.bookmaker_id,
      login_masked: masked,
      status: 'ready_to_auth',
      balance: null,
      currency: 'RUB',
      has_proxy: false,
      has_fingerprint: false,
      last_auth: null,
    }
    setAccounts(prev => [...prev, newAccount])
    setShowAddForm(false)
    setFormData({ bookmaker_id: 'pari', login: '', password: '', phone_prefix: '+7', two_fa_type: 'none' })
  }

  const handleAuth = (accountId: string) => {
    setAccounts(prev =>
      prev.map(a => a.id === accountId ? { ...a, status: 'authenticating' as AuthStatus } : a)
    )
    setTimeout(() => {
      setAccounts(prev =>
        prev.map(a => a.id === accountId ? { ...a, status: 'authenticated' as AuthStatus, balance: Math.floor(Math.random() * 50000) } : a)
      )
    }, 2000)
  }

  const handleBatchAuth = () => {
    const readyAccounts = accounts.filter(a => a.status === 'ready_to_auth' || a.status === 'session_expired')
    readyAccounts.forEach((a, i) => {
      setTimeout(() => handleAuth(a.id), i * 1500)
    })
  }

  const stats = {
    total: accounts.length,
    authenticated: accounts.filter(a => a.status === 'authenticated').length,
    ready: accounts.filter(a => a.status === 'ready_to_auth').length,
    failed: accounts.filter(a => a.status === 'auth_failed' || a.status === 'blocked').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Авторизация БК
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Управление аккаунтами и сессиями
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBatchAuth}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <RefreshCw size={14} />
            Авторизовать все
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            style={{ background: 'var(--accent-blue)', color: '#fff' }}
          >
            <Plus size={14} />
            Добавить аккаунт
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Всего', value: stats.total, color: 'var(--text-primary)' },
          { label: 'Авторизовано', value: stats.authenticated, color: 'var(--accent-green)' },
          { label: 'Готовы', value: stats.ready, color: 'var(--accent-blue)' },
          { label: 'Ошибки', value: stats.failed, color: 'var(--accent-red)' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Account List */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Аккаунты</h3>
        </div>

        {accounts.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            <Shield size={48} className="mx-auto mb-4 opacity-30" />
            <p>Нет добавленных аккаунтов</p>
            <p className="text-sm mt-1">Нажмите "Добавить аккаунт" чтобы начать</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {accounts.map(account => {
              const statusCfg = STATUS_CONFIG[account.status]
              const StatusIcon = statusCfg.icon
              return (
                <div key={account.id} className="p-4 flex items-center justify-between hover:bg-opacity-50 transition-colors" style={{ background: 'transparent' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {(BOOKMAKER_NAMES[account.bookmaker_id] || account.bookmaker_id).slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {BOOKMAKER_NAMES[account.bookmaker_id] || account.bookmaker_id}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {account.login_masked}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {account.balance !== null && (
                      <span className="text-sm font-medium" style={{ color: 'var(--accent-green)' }}>
                        {account.balance.toLocaleString()} {account.currency}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <StatusIcon size={14} style={{ color: statusCfg.color }} />
                      <span className="text-xs" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
                    </div>
                    <button
                      onClick={() => handleAuth(account.id)}
                      disabled={account.status === 'authenticating' || account.status === 'authenticated'}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      {account.status === 'authenticating' ? 'Входим...' : 'Войти'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-[480px] rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Добавить аккаунт</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Букмекер</label>
                <select
                  value={formData.bookmaker_id}
                  onChange={e => setFormData(prev => ({ ...prev, bookmaker_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {Object.entries(BOOKMAKER_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Логин / Телефон</label>
                <input
                  type="text"
                  value={formData.login}
                  onChange={e => setFormData(prev => ({ ...prev, login: e.target.value }))}
                  placeholder="+79991234567 или email"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Пароль</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Тип 2FA</label>
                <select
                  value={formData.two_fa_type}
                  onChange={e => setFormData(prev => ({ ...prev, two_fa_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="none">Без 2FA</option>
                  <option value="sms">SMS</option>
                  <option value="totp">TOTP (Authenticator)</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                Отмена
              </button>
              <button
                onClick={handleAddAccount}
                disabled={!formData.login || !formData.password}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                style={{ background: 'var(--accent-blue)', color: '#fff' }}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Captcha Modal */}
      {showCaptchaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-[400px] rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Введите капчу</h3>
            <div className="w-full h-32 rounded-lg mb-4 flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Изображение капчи</span>
            </div>
            <input
              type="text"
              value={captchaValue}
              onChange={e => setCaptchaValue(e.target.value)}
              placeholder="Введите код"
              className="w-full px-3 py-2 rounded-lg text-sm mb-4"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCaptchaModal(false)} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                Отмена
              </button>
              <button onClick={() => { setShowCaptchaModal(false); setCaptchaValue('') }} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-[400px] rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Введите код 2FA</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Код отправлен на ваш телефон</p>
            <input
              type="text"
              value={twoFACode}
              onChange={e => setTwoFACode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="w-full px-3 py-2 rounded-lg text-sm text-center text-xl tracking-widest mb-4"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-2">
              <button onClick={() => setShow2FAModal(false)} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                Отмена
              </button>
              <button onClick={() => { setShow2FAModal(false); setTwoFACode('') }} className="flex-1 px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--accent-blue)', color: '#fff' }}>
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
