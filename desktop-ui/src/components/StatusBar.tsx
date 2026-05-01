import { Wifi, WifiOff, Clock, Cpu, HardDrive } from 'lucide-react'

interface StatusBarProps {
  wsConnected: boolean
  scannerRunning: boolean
  lastUpdate?: string
  forkCount?: number
  parserCount?: number
}

export function StatusBar({ wsConnected, scannerRunning, lastUpdate, forkCount = 0, parserCount = 0 }: StatusBarProps) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="status-bar flex items-center justify-between px-4 py-1 select-none" style={{ height: 30 }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {wsConnected ? <Wifi size={11} style={{ color: 'var(--accent-green)' }} /> : <WifiOff size={11} style={{ color: 'var(--accent-red)' }} />}
          <span>{wsConnected ? 'WS Connected' : 'WS Disconnected'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: scannerRunning ? 'var(--accent-green)' : 'var(--text-muted)' }} />
          <span>{scannerRunning ? 'Scanning' : 'Stopped'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu size={11} />
          <span>{parserCount} parsers</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span>{forkCount} forks</span>
        {lastUpdate && (
          <div className="flex items-center gap-1.5">
            <Clock size={11} />
            <span>Updated {lastUpdate}</span>
          </div>
        )}
        <span>{timeStr}</span>
        <span style={{ color: 'var(--text-muted)' }}>v2.0 Pro</span>
      </div>
    </div>
  )
}
