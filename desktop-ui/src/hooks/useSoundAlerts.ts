import { useCallback, useRef } from 'react'

type AlertSound = 'new_fork' | 'high_profit' | 'corridor_found' | 'bet_confirmed' | 'bet_rejected' | 'error'

const FREQUENCIES: Record<AlertSound, { freq: number; duration: number; type: OscillatorType }> = {
  new_fork: { freq: 880, duration: 150, type: 'sine' },
  high_profit: { freq: 1100, duration: 200, type: 'sine' },
  corridor_found: { freq: 660, duration: 180, type: 'triangle' },
  bet_confirmed: { freq: 520, duration: 100, type: 'sine' },
  bet_rejected: { freq: 300, duration: 250, type: 'square' },
  error: { freq: 200, duration: 300, type: 'sawtooth' },
}

export function useSoundAlerts() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }, [])

  const playAlert = useCallback((sound: AlertSound) => {
    try {
      const ctx = getContext()
      const config = FREQUENCIES[sound]
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = config.type
      oscillator.frequency.setValueAtTime(config.freq, ctx.currentTime)
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration / 1000)

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + config.duration / 1000)
    } catch {
      // AudioContext may not be available
    }
  }, [getContext])

  const playDoubleBeep = useCallback(() => {
    playAlert('new_fork')
    setTimeout(() => playAlert('new_fork'), 200)
  }, [playAlert])

  return { playAlert, playDoubleBeep }
}
