const DEFAULT_VOLUME = 0.8
const PATTERN_SECONDS = 1.65

function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined
  const windowWithWebkit = window as typeof window & {
    webkitAudioContext?: typeof AudioContext
  }
  return window.AudioContext ?? windowWithWebkit.webkitAudioContext
}

/** AudioContextと音源ノードだけを管理します。アラームイベント状態は保持しません。 */
export class AlarmAudioEngine {
  private context: AudioContext | null = null
  private alarmSource: AudioBufferSourceNode | null = null
  private alarmGain: GainNode | null = null
  private previewSource: AudioBufferSourceNode | null = null
  private previewGain: GainNode | null = null
  private pattern: AudioBuffer | null = null
  private volume = DEFAULT_VOLUME
  private alarmStartAt: number | null = null
  private onContextStateChange: ((state: AudioContextState) => void) | null = null

  setStateChangeHandler(handler: (state: AudioContextState) => void) {
    this.onContextStateChange = handler
  }

  get state(): AudioContextState | 'unavailable' {
    return this.context?.state ?? 'unavailable'
  }

  get currentTime() {
    return this.context?.currentTime ?? 0
  }

  get hasAlarmSource() {
    return this.alarmSource !== null
  }

  get scheduledStartAt() {
    return this.alarmStartAt
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    const now = this.context?.currentTime ?? 0
    this.alarmGain?.gain.setTargetAtTime(this.volume, now, 0.025)
    this.previewGain?.gain.setTargetAtTime(this.volume, now, 0.025)
  }

  /** 呼び出し元のユーザー操作中にContextを作成・再開します。 */
  async prepare(): Promise<void> {
    const AudioContextConstructor = getAudioContextConstructor()
    if (!AudioContextConstructor) throw new Error('このブラウザはWeb Audioに対応していません。')

    if (!this.context || this.context.state === 'closed') {
      const context = new AudioContextConstructor()
      this.context = context
      this.pattern = this.createAlarmPattern(context)
      this.alarmGain = context.createGain()
      this.alarmGain.gain.value = this.volume
      this.alarmGain.connect(context.destination)
      context.addEventListener('statechange', () => {
        this.onContextStateChange?.(context.state)
      })
    }

    if (this.context.state !== 'running') await this.context.resume()
    if (this.context.state !== 'running') {
      throw new Error('ブラウザが音声再生を許可しませんでした。もう一度操作してください。')
    }
  }

  /** 最も早い期限だけを一つのSourceNodeでループ予約します。 */
  scheduleAlarm(dueAt: number) {
    const context = this.requireRunningContext()
    const gain = this.alarmGain
    const pattern = this.pattern
    if (!gain || !pattern) throw new Error('アラーム音声を準備できません。')

    this.stopAlarm()
    const source = context.createBufferSource()
    source.buffer = pattern
    source.loop = true
    source.connect(gain)
    const startAt = Math.max(
      context.currentTime,
      context.currentTime + Math.max(0, dueAt - Date.now()) / 1000,
    )
    if (this.previewSource) {
      try {
        this.previewSource.stop(Math.max(context.currentTime, startAt))
      } catch {
        // 試聴音が既に終了している場合はそのままアラームを開始します。
      }
    }
    source.start(startAt)
    this.alarmSource = source
    this.alarmStartAt = startAt
    source.onended = () => {
      if (this.alarmSource === source) {
        this.alarmSource = null
        this.alarmStartAt = null
      }
      source.disconnect()
    }
  }

  stopAlarm() {
    const source = this.alarmSource
    this.alarmSource = null
    this.alarmStartAt = null
    if (!source) return
    source.onended = null
    try {
      source.stop()
    } catch {
      // 再生済み・停止済みのSourceNodeでも後始末は続けます。
    }
    source.disconnect()
  }

  /** 予約中のアラームには触れず、同じパターンを一度だけ試聴します。 */
  playPreview() {
    const context = this.requireRunningContext()
    const pattern = this.pattern
    if (!pattern) throw new Error('アラーム音声を準備できません。')
    if (this.alarmStartAt != null && this.alarmStartAt <= context.currentTime) {
      throw new Error('アラーム鳴動中はテスト音を再生できません。')
    }

    this.stopPreview()
    const gain = context.createGain()
    gain.gain.value = this.volume
    gain.connect(context.destination)
    const source = context.createBufferSource()
    source.buffer = pattern
    source.loop = false
    source.connect(gain)
    source.start()
    if (this.alarmStartAt != null) {
      // 期限が試聴中に来た場合、アラーム開始時刻で試聴だけを打ち切ります。
      source.stop(Math.max(context.currentTime, this.alarmStartAt))
    }
    this.previewSource = source
    this.previewGain = gain
    source.onended = () => {
      if (this.previewSource === source) {
        this.previewSource = null
        this.previewGain = null
      }
      source.disconnect()
      gain.disconnect()
    }
  }

  stopPreview() {
    const source = this.previewSource
    const gain = this.previewGain
    this.previewSource = null
    this.previewGain = null
    if (!source) {
      gain?.disconnect()
      return
    }
    source.onended = null
    try {
      source.stop()
    } catch {
      // 終了済みの試聴音源です。
    }
    source.disconnect()
    gain?.disconnect()
  }

  async close() {
    this.stopAlarm()
    this.stopPreview()
    const context = this.context
    this.context = null
    this.pattern = null
    this.alarmGain = null
    if (context && context.state !== 'closed') {
      try {
        await context.close()
      } catch {
        // Contextが既に閉じている場合も後続処理を妨げません。
      }
    }
  }

  private requireRunningContext() {
    if (!this.context || this.context.state !== 'running') {
      throw new Error('音声が無効です。「音声を有効化」を押してください。')
    }
    return this.context
  }

  private createAlarmPattern(context: AudioContext) {
    const frames = Math.ceil(context.sampleRate * PATTERN_SECONDS)
    const buffer = context.createBuffer(1, frames, context.sampleRate)
    const samples = buffer.getChannelData(0)
    const pulses = [
      { start: 0.06, duration: 0.2, frequency: 880 },
      { start: 0.34, duration: 0.2, frequency: 1174.66 },
      { start: 0.62, duration: 0.24, frequency: 880 },
    ]

    for (const pulse of pulses) {
      const firstFrame = Math.floor(pulse.start * context.sampleRate)
      const pulseFrames = Math.floor(pulse.duration * context.sampleRate)
      for (let offset = 0; offset < pulseFrames; offset += 1) {
        const progress = offset / pulseFrames
        const envelope = Math.min(1, progress * 18, (1 - progress) * 18)
        const time = offset / context.sampleRate
        const sample = Math.sin(2 * Math.PI * pulse.frequency * time) * 0.72 * envelope
        samples[firstFrame + offset] += sample
      }
    }
    return buffer
  }
}

