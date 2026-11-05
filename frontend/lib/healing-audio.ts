'use client'

/**
 * Web Audio API synthesizer for 432Hz Deep Healing Music
 * Generates natural harmonic frequencies and theta binaural beats without external assets.
 */

class HealingAudioManager {
  private ctx: AudioContext | null = null
  private gainNode: GainNode | null = null
  private oscillators: OscillatorNode[] = []
  private lfos: OscillatorNode[] = []
  private noiseSource: AudioBufferSourceNode | null = null
  private isPlaying = false
  private volume = 0.4
  private listeners: Set<(playing: boolean, volume: number) => void> = new Set()

  public getIsPlaying(): boolean {
    return this.isPlaying
  }

  public getVolume(): number {
    return this.volume
  }

  public subscribe(callback: (playing: boolean, volume: number) => void): () => void {
    this.listeners.add(callback)
    callback(this.isPlaying, this.volume)
    return () => this.listeners.delete(callback)
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.isPlaying, this.volume))
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime)
      } catch {
        // ignore
      }
    }
    this.notify()
  }

  public start() {
    if (this.isPlaying) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      this.ctx = ctx

      // Master gain
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime)
      masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, this.volume), ctx.currentTime + 1.2)
      masterGain.connect(ctx.destination)
      this.gainNode = masterGain

      // Warm lowpass filter for gentle sound
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(520, ctx.currentTime)
      filter.connect(masterGain)

      // 432Hz Harmonic Soundscape with 4Hz Theta Binaural Beat
      // 108Hz (Deep Sub), 216Hz (Warm Bass), 432Hz (Healing Heart), 436Hz (Binaural Beat), 648Hz (Golden Fifth)
      const layers = [
        { freq: 108, type: 'sine' as OscillatorType, vol: 0.18, lfoRate: 0.05 },
        { freq: 216, type: 'triangle' as OscillatorType, vol: 0.16, lfoRate: 0.08 },
        { freq: 432, type: 'sine' as OscillatorType, vol: 0.22, lfoRate: 0.06 },
        { freq: 436, type: 'sine' as OscillatorType, vol: 0.14, lfoRate: 0.07 },
        { freq: 648, type: 'triangle' as OscillatorType, vol: 0.1, lfoRate: 0.09 },
      ]

      this.oscillators = []
      this.lfos = []

      layers.forEach(({ freq, type, vol, lfoRate }) => {
        const osc = ctx.createOscillator()
        osc.type = type
        osc.frequency.setValueAtTime(freq, ctx.currentTime)

        const oscGain = ctx.createGain()
        oscGain.gain.setValueAtTime(vol, ctx.currentTime)

        // Slow meditative breath swell
        const lfo = ctx.createOscillator()
        lfo.type = 'sine'
        lfo.frequency.setValueAtTime(lfoRate, ctx.currentTime)

        const lfoGain = ctx.createGain()
        lfoGain.gain.setValueAtTime(vol * 0.35, ctx.currentTime)

        lfo.connect(lfoGain)
        lfoGain.connect(oscGain.gain)

        osc.connect(oscGain)
        oscGain.connect(filter)

        osc.start()
        lfo.start()

        this.oscillators.push(osc)
        this.lfos.push(lfo)
      })

      // Soft pink noise air bed
      const bufferSize = ctx.sampleRate * 4
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.969 * b2 + white * 0.153852
        b3 = 0.8665 * b3 + white * 0.3104856
        b4 = 0.55 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.016898
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04
        b6 = white * 0.115926
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true

      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'lowpass'
      noiseFilter.frequency.setValueAtTime(280, ctx.currentTime)

      noise.connect(noiseFilter)
      noiseFilter.connect(masterGain)
      noise.start()
      this.noiseSource = noise

      this.isPlaying = true
      this.notify()
    } catch (e) {
      console.warn('Healing audio could not start:', e)
    }
  }

  public stop() {
    if (!this.isPlaying) return

    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5)
      } catch {
        // ignore
      }
    }

    setTimeout(() => {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop()
          osc.disconnect()
        } catch {}
      })
      this.lfos.forEach((lfo) => {
        try {
          lfo.stop()
          lfo.disconnect()
        } catch {}
      })
      if (this.noiseSource) {
        try {
          this.noiseSource.stop()
          this.noiseSource.disconnect()
        } catch {}
        this.noiseSource = null
      }
      if (this.ctx && this.ctx.state !== 'closed') {
        try {
          this.ctx.close()
        } catch {}
        this.ctx = null
      }
      this.gainNode = null
      this.oscillators = []
      this.lfos = []
      this.isPlaying = false
      this.notify()
    }, 550)
  }

  public toggle() {
    if (this.isPlaying) {
      this.stop()
    } else {
      this.start()
    }
  }
}

let instance: HealingAudioManager | null = null

export function getHealingAudio(): HealingAudioManager {
  if (typeof window === 'undefined') {
    return new HealingAudioManager()
  }
  if (!instance) {
    instance = new HealingAudioManager()
  }
  return instance
}

