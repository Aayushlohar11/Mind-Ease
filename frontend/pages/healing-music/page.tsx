'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Waves,
  CloudRain,
  Radio,
  Clock,
  Heart,
  RotateCcw,
  MessageCircle,
  LineChart,
  BookOpen,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react'
import { Button } from '@frontend/components/ui/button'
import { PortfolioBackground } from '@frontend/components/portfolio/PortfolioBackground'
import { SectionHeader } from '@frontend/components/portfolio/SectionHeader'

type SoundTrack = '432hz' | '528hz' | 'ocean' | 'rain' | 'theta'

interface TrackInfo {
  id: SoundTrack
  title: string
  subtitle: string
  frequency: string
  description: string
  icon: typeof Music
  color: string
  accentBorder: string
  accentBg: string
  benefit: string
}

const tracks: TrackInfo[] = [
  {
    id: '432hz',
    title: '432Hz Deep Healing Harmony',
    subtitle: 'Verdi Harmonic Tuning',
    frequency: '432 Hz',
    description:
      'Natural biological resonance frequency that lowers heart rate, eases anxiety, and aligns mental frequencies into tranquil equilibrium.',
    icon: Sparkles,
    color: 'text-emerald-400',
    accentBorder: 'border-emerald-500/40',
    accentBg: 'from-emerald-500/20 to-teal-500/5',
    benefit: 'Anxiety relief & inner calm',
  },
  {
    id: '528hz',
    title: '528Hz Transformation & Clarity',
    subtitle: 'Solfeggio Frequency',
    frequency: '528 Hz',
    description:
      'The sacred Solfeggio frequency associated with cellular vitality, DNA clarity, deep emotional restoration, and lifting heavy feelings.',
    icon: Zap,
    color: 'text-amber-400',
    accentBorder: 'border-amber-500/40',
    accentBg: 'from-amber-500/20 to-orange-500/5',
    benefit: 'Vitality & mental clarity',
  },
  {
    id: 'ocean',
    title: 'Ocean Surf & Delta Waves',
    subtitle: 'Natural Delta Rhythm',
    frequency: '2.5 Hz Delta',
    description:
      'Low-frequency rolling ocean swells and rhythmic tidal washes that lull overactive brain waves into restful slumber and deep sleep.',
    icon: Waves,
    color: 'text-cyan-400',
    accentBorder: 'border-cyan-500/40',
    accentBg: 'from-cyan-500/20 to-blue-500/5',
    benefit: 'Deep sleep & surrender',
  },
  {
    id: 'rain',
    title: 'Soothing Rainfall & Pink Noise',
    subtitle: 'Ambient Acoustic Mask',
    frequency: 'Pink Noise',
    description:
      'Gentle rain patterns and soft pink noise filtering out stressful external chatter, quieting tinnitus, and unlocking deep meditative focus.',
    icon: CloudRain,
    color: 'text-teal-400',
    accentBorder: 'border-teal-500/40',
    accentBg: 'from-teal-500/20 to-emerald-500/5',
    benefit: 'Focus & decompression',
  },
  {
    id: 'theta',
    title: 'Theta Waves & Binaural Drone',
    subtitle: 'Subconscious Reset',
    frequency: '4.0 Hz Binaural',
    description:
      'Stereo binaural pulses tuned to the 4Hz theta boundary, ideal for creative insight, deep hypnosis, and releasing subconscious mental tension.',
    icon: Radio,
    color: 'text-violet-400',
    accentBorder: 'border-violet-500/40',
    accentBg: 'from-violet-500/20 to-purple-500/5',
    benefit: 'Deep meditation & reset',
  },
]

const durations = [
  { label: '5 min', seconds: 5 * 60 },
  { label: '10 min', seconds: 10 * 60 },
  { label: '15 min', seconds: 15 * 60 },
  { label: '30 min', seconds: 30 * 60 },
  { label: 'Continuous', seconds: 0 },
]

export default function DeepHealingMusicPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTrack, setActiveTrack] = useState<SoundTrack>('432hz')
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [selectedDuration, setSelectedDuration] = useState<number>(15 * 60)
  const [secondsLeft, setSecondsLeft] = useState<number>(15 * 60)
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0)
  const [breathePhase, setBreathePhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale')

  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const oscillatorsRef = useRef<OscillatorNode[]>([])
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Breathing pacer cycle
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setBreathePhase((prev) => {
        if (prev === 'Inhale') return 'Hold'
        if (prev === 'Hold') return 'Exhale'
        return 'Inhale'
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [isPlaying])

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isPlaying && selectedDuration > 0 && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopAudio()
            setSessionsCompleted((c) => c + 1)
            return selectedDuration
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isPlaying, selectedDuration, secondsLeft])

  // Clean stop audio
  const stopAudio = useCallback(() => {
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop()
        osc.disconnect()
      } catch {}
    })
    oscillatorsRef.current = []

    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop()
        noiseSourceRef.current.disconnect()
      } catch {}
      noiseSourceRef.current = null
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close()
      } catch {}
      audioCtxRef.current = null
    }

    gainNodeRef.current = null
    setIsPlaying(false)
  }, [])

  // Start sound generator based on activeTrack
  const startAudio = useCallback(
    (trackId: SoundTrack) => {
      stopAudio()

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return

        const ctx = new AudioCtx()
        audioCtxRef.current = ctx

        // Master Gain
        const masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(0.001, ctx.currentTime)
        masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume), ctx.currentTime + 1.2)
        masterGain.connect(ctx.destination)
        gainNodeRef.current = masterGain

        // Main filter
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'

        if (trackId === '432hz') {
          filter.frequency.setValueAtTime(540, ctx.currentTime)
          filter.connect(masterGain)

          // 432Hz Harmonic Structure: 108Hz sub, 216Hz bass, 432Hz root, 436Hz theta detune, 648Hz fifth
          const freqs = [
            { f: 108, t: 'sine' as OscillatorType, g: 0.18, lfo: 0.05 },
            { f: 216, t: 'triangle' as OscillatorType, g: 0.16, lfo: 0.07 },
            { f: 432, t: 'sine' as OscillatorType, g: 0.24, lfo: 0.06 },
            { f: 436, t: 'sine' as OscillatorType, g: 0.14, lfo: 0.08 },
            { f: 648, t: 'triangle' as OscillatorType, g: 0.09, lfo: 0.09 },
          ]

          freqs.forEach(({ f, t, g, lfo }) => {
            const osc = ctx.createOscillator()
            osc.type = t
            osc.frequency.setValueAtTime(f, ctx.currentTime)

            const oscGain = ctx.createGain()
            oscGain.gain.setValueAtTime(g, ctx.currentTime)

            const lfoNode = ctx.createOscillator()
            lfoNode.type = 'sine'
            lfoNode.frequency.setValueAtTime(lfo, ctx.currentTime)

            const lfoGain = ctx.createGain()
            lfoGain.gain.setValueAtTime(g * 0.35, ctx.currentTime)

            lfoNode.connect(lfoGain)
            lfoGain.connect(oscGain.gain)

            osc.connect(oscGain)
            oscGain.connect(filter)

            osc.start()
            lfoNode.start()
            oscillatorsRef.current.push(osc, lfoNode)
          })
        } else if (trackId === '528hz') {
          filter.frequency.setValueAtTime(680, ctx.currentTime)
          filter.connect(masterGain)

          // 528Hz Solfeggio Structure: 132Hz sub, 264Hz bass, 528Hz tone, 792Hz fifth, 532Hz theta beat
          const freqs = [
            { f: 132, t: 'sine' as OscillatorType, g: 0.16, lfo: 0.06 },
            { f: 264, t: 'triangle' as OscillatorType, g: 0.18, lfo: 0.08 },
            { f: 528, t: 'sine' as OscillatorType, g: 0.26, lfo: 0.05 },
            { f: 532, t: 'sine' as OscillatorType, g: 0.14, lfo: 0.07 },
            { f: 792, t: 'sine' as OscillatorType, g: 0.08, lfo: 0.1 },
          ]

          freqs.forEach(({ f, t, g, lfo }) => {
            const osc = ctx.createOscillator()
            osc.type = t
            osc.frequency.setValueAtTime(f, ctx.currentTime)

            const oscGain = ctx.createGain()
            oscGain.gain.setValueAtTime(g, ctx.currentTime)

            const lfoNode = ctx.createOscillator()
            lfoNode.type = 'sine'
            lfoNode.frequency.setValueAtTime(lfo, ctx.currentTime)

            const lfoGain = ctx.createGain()
            lfoGain.gain.setValueAtTime(g * 0.3, ctx.currentTime)

            lfoNode.connect(lfoGain)
            lfoGain.connect(oscGain.gain)

            osc.connect(oscGain)
            oscGain.connect(filter)

            osc.start()
            lfoNode.start()
            oscillatorsRef.current.push(osc, lfoNode)
          })
        } else if (trackId === 'theta') {
          filter.frequency.setValueAtTime(320, ctx.currentTime)
          filter.connect(masterGain)

          // Binaural beats: 200Hz left ear, 204Hz right ear -> 4Hz Theta wave
          const baseFreq = 200
          const diff = 4

          const osc1 = ctx.createOscillator()
          osc1.type = 'sine'
          osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime)

          const osc2 = ctx.createOscillator()
          osc2.type = 'sine'
          osc2.frequency.setValueAtTime(baseFreq + diff, ctx.currentTime)

          const panner1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null
          const panner2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null

          if (panner1 && panner2) {
            panner1.pan.setValueAtTime(-0.85, ctx.currentTime)
            panner2.pan.setValueAtTime(0.85, ctx.currentTime)

            osc1.connect(panner1)
            panner1.connect(filter)

            osc2.connect(panner2)
            panner2.connect(filter)
          } else {
            osc1.connect(filter)
            osc2.connect(filter)
          }

          osc1.start()
          osc2.start()
          oscillatorsRef.current.push(osc1, osc2)
        }

        // Pink noise generator (for Ocean, Rain, or ambient air)
        const bufferSize = ctx.sampleRate * 5
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
          data[i] =
            (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) *
            (trackId === 'rain' ? 0.18 : trackId === 'ocean' ? 0.14 : 0.04)
          b6 = white * 0.115926
        }

        const noise = ctx.createBufferSource()
        noise.buffer = buffer
        noise.loop = true
        noiseSourceRef.current = noise

        const noiseFilter = ctx.createBiquadFilter()
        noiseFilter.type = 'lowpass'
        noiseFilter.frequency.setValueAtTime(
          trackId === 'ocean' ? 360 : trackId === 'rain' ? 620 : 260,
          ctx.currentTime
        )

        // Ocean wave swell LFO
        if (trackId === 'ocean') {
          const lfo = ctx.createOscillator()
          lfo.frequency.setValueAtTime(0.1, ctx.currentTime) // 10-second wave swells
          const lfoGain = ctx.createGain()
          lfoGain.gain.setValueAtTime(0.2, ctx.currentTime)
          lfo.connect(lfoGain)
          lfoGain.connect(masterGain.gain)
          lfo.start()
          oscillatorsRef.current.push(lfo)
        }

        noise.connect(noiseFilter)
        noiseFilter.connect(masterGain)
        noise.start()

        setIsPlaying(true)
      } catch (e) {
        console.warn('Audio start error:', e)
      }
    },
    [stopAudio, volume]
  )

  // Track changes while playing
  const handleSelectTrack = (trackId: SoundTrack) => {
    setActiveTrack(trackId)
    if (isPlaying) {
      startAudio(trackId)
    }
  }

  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      stopAudio()
    } else {
      startAudio(activeTrack)
    }
  }

  // Volume slider
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime)
      } catch {}
    }
  }, [volume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  const currentTrack = tracks.find((t) => t.id === activeTrack) || tracks[0]
  const CurrentIcon = currentTrack.icon

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  return (
    <PortfolioBackground>
      <div className="pt-24 pb-20 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                <Music className="h-3 w-3" /> Sound Therapy Sanctuary
              </span>
              <span>•</span>
              <span className="text-muted-foreground">{currentTrack.frequency}</span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Deep Healing <span className="text-gradient">Music Studio</span>
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm sm:text-base">
              Pure acoustic sound therapy tuned to 432Hz harmonic resonance, 528Hz Solfeggio, and
              theta waves to release physical tension and calm mental turbulence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-white/15 text-xs">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Interactive Studio Stage */}
        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          {/* Main Visualizer & Master Deck */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            {/* Ambient Background Aura */}
            <div
              className={`absolute -top-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-br ${currentTrack.accentBg} blur-3xl opacity-50 transition-all duration-700 pointer-events-none`}
            />

            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-2xl border ${currentTrack.accentBorder} bg-white/[0.04] grid place-items-center`}
                >
                  <CurrentIcon className={`h-6 w-6 ${currentTrack.color}`} />
                </div>
                <div>
                  <h2 className="font-semibold text-lg sm:text-xl text-white">
                    {currentTrack.title}
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono">{currentTrack.subtitle}</p>
                </div>
              </div>

              {/* Status Pill */}
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${
                  isPlaying
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/10 bg-white/[0.02] text-muted-foreground'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-white/30'
                  }`}
                />
                <span>{isPlaying ? 'Resonating' : 'Ready'}</span>
              </div>
            </div>

            {/* Central Resonating Aura Visualizer */}
            <div className="relative z-10 py-10 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Concentric pulsing rings */}
                <div
                  className={`absolute h-64 w-64 rounded-full border border-emerald-400/20 transition-all duration-1000 ${
                    isPlaying ? 'scale-110 opacity-70 animate-pulse' : 'scale-90 opacity-20'
                  }`}
                />
                <div
                  className={`absolute h-52 w-52 rounded-full border border-teal-400/30 transition-all duration-700 ${
                    isPlaying ? 'scale-105 opacity-80' : 'scale-90 opacity-20'
                  }`}
                />
                <div
                  className={`absolute h-40 w-40 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-400/10 blur-md transition-all duration-500 ${
                    isPlaying ? 'scale-110 opacity-100' : 'scale-75 opacity-10'
                  }`}
                />

                {/* Central Play/Pause Orb Button */}
                <button
                  onClick={togglePlay}
                  type="button"
                  aria-label={isPlaying ? 'Pause Healing Music' : 'Play Healing Music'}
                  className={`relative z-20 h-28 w-28 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 active:scale-95 shadow-xl ${
                    isPlaying
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200 shadow-emerald-500/30 hover:bg-emerald-500/30'
                      : 'border-white/20 bg-white/5 text-white/90 hover:border-emerald-400/50 hover:bg-emerald-400/10 hover:text-emerald-300'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="h-10 w-10 fill-current" />
                  ) : (
                    <Play className="h-10 w-10 fill-current translate-x-1" />
                  )}
                </button>
              </div>

              {/* Breathing Guide Cue */}
              <div className="mt-8 text-center space-y-1">
                <p className="text-xs font-mono uppercase tracking-widest text-emerald-300">
                  {isPlaying ? `Breath Rhythm: ${breathePhase}` : 'Press Play to Begin'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Synchronize your breathing with the soundwaves
                </p>
              </div>

              {/* Animated 18-Bar Frequency Spectrum */}
              <div className="mt-8 h-12 flex items-end justify-center gap-1.5 w-full max-w-sm">
                {[30, 65, 95, 45, 80, 55, 90, 70, 40, 85, 60, 100, 50, 75, 35, 90, 65, 40].map(
                  (h, i) => (
                    <div
                      key={i}
                      className={`w-2 rounded-full transition-all duration-200 ${
                        isPlaying ? 'bg-emerald-400/90 shadow-sm shadow-emerald-400/50' : 'bg-white/10'
                      }`}
                      style={{
                        height: isPlaying ? `${Math.max(15, h)}%` : '12%',
                        animation: isPlaying
                          ? `pulse 1.2s ease-in-out infinite alternate ${i * 70}ms`
                          : 'none',
                      }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Bottom Controls Deck: Timer & Volume */}
            <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Live Timer */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/10 grid place-items-center">
                  <Clock className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-mono">
                    Time Remaining
                  </p>
                  <p className="font-mono text-lg font-bold text-white">
                    {selectedDuration === 0
                      ? '∞ Infinite'
                      : `${mins}:${secs < 10 ? `0${secs}` : secs}`}
                  </p>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3 w-full sm:w-56">
                <button
                  onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
                  className="text-muted-foreground hover:text-white transition-colors"
                  aria-label="Toggle mute"
                >
                  {volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-rose-400" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-emerald-300" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5"
                  aria-label="Volume level"
                />
                <span className="text-xs font-mono text-muted-foreground min-w-[32px]">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Track Presets & Session Duration */}
          <div className="lg:col-span-5 space-y-6">
            {/* Session Duration Selector */}
            <div className="card-portfolio p-6">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-emerald-400" /> Session Duration
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {durations.map((d) => (
                  <button
                    key={d.label}
                    onClick={() => {
                      setSelectedDuration(d.seconds)
                      setSecondsLeft(d.seconds)
                    }}
                    type="button"
                    className={`py-2 px-2 text-xs font-mono rounded-xl border transition-all ${
                      selectedDuration === d.seconds
                        ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                        : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Soundscape Frequency Presets */}
            <div className="card-portfolio p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  <Music className="h-4 w-4 text-emerald-400" /> Soundscape Presets
                </h3>
                <span className="text-xs font-mono text-muted-foreground">5 Frequencies</span>
              </div>

              <div className="space-y-2.5">
                {tracks.map((track) => {
                  const Icon = track.icon
                  const isSelected = activeTrack === track.id

                  return (
                    <button
                      key={track.id}
                      onClick={() => handleSelectTrack(track.id)}
                      type="button"
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 group ${
                        isSelected
                          ? 'border-emerald-400/50 bg-emerald-500/15 shadow-md shadow-emerald-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-xl border grid place-items-center shrink-0 ${
                          isSelected
                            ? 'border-emerald-400/40 bg-emerald-400/20 text-emerald-300'
                            : 'border-white/10 bg-white/[0.03] text-muted-foreground group-hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm text-white truncate">{track.title}</p>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md border border-white/10 bg-white/[0.04] text-muted-foreground shrink-0">
                            {track.frequency}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {track.benefit}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Benefits & Evidence-Based Sound Therapy Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card-portfolio p-6 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 grid place-items-center mb-3">
              <Heart className="h-5 w-5 text-emerald-400" />
            </div>
            <h4 className="font-semibold text-base">Heart-Rate Coherence</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              432Hz tuning synchronizes cardiac rhythms and stimulates the vagus nerve, initiating an
              immediate transition into parasympathetic recovery.
            </p>
          </div>

          <div className="card-portfolio p-6 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/30 grid place-items-center mb-3">
              <Radio className="h-5 w-5 text-teal-400" />
            </div>
            <h4 className="font-semibold text-base">Theta Wave Entrainment</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Binaural stereo pulses guide brainwave frequencies into 4Hz theta states, softening
              hypervigilance and releasing racing thoughts.
            </p>
          </div>

          <div className="card-portfolio p-6 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 grid place-items-center mb-3">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <h4 className="font-semibold text-base">100% Offline & Private</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Synthesized directly inside your browser via the Web Audio API. No external streaming,
              no audio telemetry, zero bandwidth usage.
            </p>
          </div>
        </div>

        {/* Companion Actions */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Listen while exploring your wellness</h3>
            <p className="text-sm text-muted-foreground">
              Deep healing music plays continuously across all tools. Continue to your AI chat or
              journal your thoughts.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link href="/mood">
              <Button variant="outline" className="border-white/20 gap-2">
                <LineChart className="h-4 w-4 text-violet-400" />
                Log Mood
              </Button>
            </Link>
            <Link href="/chat">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-background font-semibold gap-2">
                <MessageCircle className="h-4 w-4" />
                AI Companion
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PortfolioBackground>
  )
}
