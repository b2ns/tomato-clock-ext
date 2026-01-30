import { browser } from '#imports'

const playSpellSound = () => {
  const AudioContextConstructor = window.AudioContext
  if (!AudioContextConstructor) return

  const context = new AudioContextConstructor()
  void context.resume().catch(() => undefined)

  const notes = [523.25, 659.25, 783.99]
  notes.forEach((frequency, index) => {
    const osc = context.createOscillator()
    const gain = context.createGain()
    const startAt = context.currentTime + index * 0.12

    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.35)

    osc.connect(gain)
    gain.connect(context.destination)
    osc.start(startAt)
    osc.stop(startAt + 0.4)
  })

  window.setTimeout(() => {
    void context.close().catch(() => undefined)
  }, 1000)
}

browser.runtime.onMessage.addListener((message) => {
  if (message && message.type === 'PLAY_SOUND') {
    playSpellSound()
  }
})
