import { useState, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'

export default function VoiceButton({ onTranscript }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const supported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  const start = () => {
    if (!supported) { setError('Voice input not supported in this browser'); return }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new Recognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    let finalText = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t + ' '
        else interim += t
      }
      onTranscript?.((finalText + interim).trim())
    }
    rec.onerror = (e) => { setError(e.error); setListening(false) }
    rec.onend   = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
    setError('')
  }

  const stop = () => recognitionRef.current?.stop()

  if (!supported) return null

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={listening ? stop : start}
        className={`btn-ghost text-xs py-1 ${listening ? 'text-red-500 animate-pulse' : ''}`}
      >
        {listening ? <><MicOff size={13} /> Stop</> : <><Mic size={13} /> Dictate</>}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
