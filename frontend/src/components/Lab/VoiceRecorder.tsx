import { useState, useRef, useEffect } from 'react'
import './VoiceRecorder.css'

interface VoiceRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void
    onClose?: () => void
}

// Script in Spanish for voice cloning - designed for optimal voice capture
const RECORDING_SCRIPT = `Hola, bienvenido a tu sesión de hoy. Estoy aquí para acompañarte en tu camino hacia el bienestar. 

Juntos vamos a explorar tus pensamientos y emociones de manera segura y compasiva. 

Recuerda que este es tu espacio, donde puedes expresarte libremente sin ningún tipo de juicio.

Respira profundo, relájate y comencemos esta experiencia transformadora.`

type RecordingState = 'idle' | 'countdown' | 'recording' | 'reviewing' | 'uploading'

export function VoiceRecorder({ onRecordingComplete, onClose }: VoiceRecorderProps) {
    const [state, setState] = useState<RecordingState>('idle')
    const [countdown, setCountdown] = useState(3)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [error, setError] = useState<string | null>(null)

    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const timerRef = useRef<number | null>(null)
    const countdownRef = useRef<number | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (countdownRef.current) clearInterval(countdownRef.current)
            if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
    }, [audioUrl])

    const startCountdown = async () => {
        setError(null)

        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            })

            // Setup MediaRecorder
            const options = { mimeType: 'audio/webm;codecs=opus' }
            mediaRecorder.current = new MediaRecorder(stream, options)
            audioChunks.current = []

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.current.push(e.data)
                }
            }

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(blob)
                setAudioBlob(blob)
                setAudioUrl(url)
                setState('reviewing')

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            // Start countdown
            setState('countdown')
            setCountdown(3)

            countdownRef.current = window.setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current!)
                        startRecording()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

        } catch (err) {
            setError('No se pudo acceder al micrófono. Verifica los permisos.')
            setState('idle')
        }
    }

    const startRecording = () => {
        setState('recording')
        setRecordingTime(0)

        mediaRecorder.current?.start(100) // Collect data every 100ms

        timerRef.current = window.setInterval(() => {
            setRecordingTime(prev => {
                // Auto-stop after 30 seconds
                if (prev >= 30) {
                    stopRecording()
                    return prev
                }
                return prev + 1
            })
        }, 1000)
    }

    const stopRecording = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }

        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop()
        }
    }

    const retryRecording = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
        }
        setAudioUrl(null)
        setAudioBlob(null)
        setState('idle')
    }

    const submitRecording = () => {
        if (audioBlob) {
            setState('uploading')
            onRecordingComplete(audioBlob)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="voice-recorder-overlay">
            <div className="voice-recorder">
                <div className="recorder-header">
                    <h2>🎤 Clonar Voz del Coach</h2>
                    {onClose && (
                        <button className="close-btn" onClick={onClose}>✕</button>
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

                {state === 'idle' && (
                    <div className="recorder-content">
                        <div className="instructions">
                            <h3>📖 Lee el siguiente texto en voz alta:</h3>
                            <div className="script-box">
                                {RECORDING_SCRIPT}
                            </div>
                            <p className="tips">
                                <strong>Consejos para mejor calidad:</strong>
                                <br />• Habla con calma y claridad
                                <br />• Usa un tono natural, como si hablaras con un amigo
                                <br />• Evita ruidos de fondo
                                <br />• Mantén el micrófono a 15-20 cm de tu boca
                            </p>
                        </div>
                        <button className="record-btn" onClick={startCountdown}>
                            🎙️ Comenzar Grabación
                        </button>
                    </div>
                )}

                {state === 'countdown' && (
                    <div className="recorder-content countdown-screen">
                        <div className="countdown-number">{countdown}</div>
                        <p>Prepárate para leer...</p>
                    </div>
                )}

                {state === 'recording' && (
                    <div className="recorder-content recording-screen">
                        <div className="recording-indicator">
                            <span className="pulse-dot"></span>
                            GRABANDO
                        </div>
                        <div className="timer">{formatTime(recordingTime)}</div>
                        <div className="script-box live">
                            {RECORDING_SCRIPT}
                        </div>
                        <button className="stop-btn" onClick={stopRecording}>
                            ⏹️ Detener Grabación
                        </button>
                        <p className="hint">
                            Mínimo 10 segundos para buena calidad
                        </p>
                    </div>
                )}

                {state === 'reviewing' && audioUrl && (
                    <div className="recorder-content review-screen">
                        <h3>✅ Grabación completada</h3>
                        <div className="audio-preview">
                            <audio controls src={audioUrl} />
                        </div>
                        <p>Duración: {formatTime(recordingTime)}</p>

                        {recordingTime < 10 && (
                            <div className="warning-message">
                                ⚠️ La grabación es muy corta. Se recomiendan al menos 10 segundos.
                            </div>
                        )}

                        <div className="review-actions">
                            <button className="retry-btn" onClick={retryRecording}>
                                🔄 Grabar de nuevo
                            </button>
                            <button
                                className="submit-btn"
                                onClick={submitRecording}
                                disabled={recordingTime < 3}
                            >
                                ✅ Usar esta voz
                            </button>
                        </div>
                    </div>
                )}

                {state === 'uploading' && (
                    <div className="recorder-content uploading-screen">
                        <div className="spinner"></div>
                        <h3>Procesando voz...</h3>
                        <p>Esto puede tomar unos segundos</p>
                    </div>
                )}
            </div>
        </div>
    )
}
