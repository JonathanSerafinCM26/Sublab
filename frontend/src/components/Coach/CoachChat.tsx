import { FC, useState, useRef, useEffect } from 'react'
import { sendMessage, testTTS } from '../../services/api'
import { Send, CheckCircle, Volume2, ArrowLeft, Clock, Zap, Sparkles } from 'lucide-react'
import sublabLogo from '../../assets/sublab-logo.svg'
import './CoachChat.css'

interface CoachChatProps {
    onBack?: () => void
    voiceId?: string
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    audioUrl?: string
    isLoading?: boolean
}

// Sesiones recomendadas demo
const recommendedSessions = [
    {
        id: 1,
        title: 'Sesión de Relajación Profunda',
        duration: 12,
        priority: 'high' as const,
        description: 'Basada en tu nivel de estrés actual, te recomiendo esta meditación guiada.',
        tag: 'Estrés elevado detectado'
    },
    {
        id: 2,
        title: 'Técnica 4-7-8 para Ansiedad',
        duration: 5,
        priority: 'medium' as const,
        description: 'Ejercicio de respiración personalizado para tu patrón de ansiedad.',
        tag: null
    }
]

export const CoachChat: FC<CoachChatProps> = ({ onBack, voiceId }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: '¡Hola! Soy tu coach de bienestar. ¿Cómo te sientes hoy? Estoy aquí para ayudarte a encontrar calma y claridad. 🌿'
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showRecommendations, setShowRecommendations] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)
        setShowRecommendations(false)

        // Add loading message
        const loadingId = (Date.now() + 1).toString()
        setMessages(prev => [...prev, {
            id: loadingId,
            role: 'assistant',
            content: '',
            isLoading: true
        }])

        try {
            const response = await sendMessage(input, voiceId)
            console.log('📥 Response received:', {
                text: response.text?.substring(0, 50) + '...',
                hasAudio: !!response.audio,
                audioLength: response.audio?.length || 0
            })

            // Convert base64 audio to blob URL if present
            let audioUrl: string | undefined
            if (response.audio) {
                console.log('🔊 Decoding base64 audio...')
                const binaryString = atob(response.audio)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i)
                }
                const blob = new Blob([bytes], { type: 'audio/wav' })
                audioUrl = URL.createObjectURL(blob)
                console.log('✅ Audio blob created:', { blobSize: blob.size, url: audioUrl })
            } else {
                console.log('⚠️ No audio in response')
            }

            // Update with real response
            setMessages(prev => prev.map(msg =>
                msg.id === loadingId
                    ? { ...msg, content: response.text, audioUrl, isLoading: false }
                    : msg
            ))

            // Auto-play audio when response arrives
            if (audioUrl && audioRef.current) {
                console.log('▶️ Attempting to play audio...')
                audioRef.current.src = audioUrl
                audioRef.current.play()
                    .then(() => console.log('✅ Audio playing!'))
                    .catch(e => console.log('❌ Autoplay blocked:', e))
            }
        } catch (error) {
            setMessages(prev => prev.map(msg =>
                msg.id === loadingId
                    ? { ...msg, content: 'Lo siento, hubo un error. Intenta de nuevo.', isLoading: false }
                    : msg
            ))
        } finally {
            setIsLoading(false)
        }
    }

    const playAudio = (audioUrl: string) => {
        if (audioRef.current) {
            audioRef.current.src = audioUrl
            audioRef.current.play()
        }
    }

    const startSession = async (session: typeof recommendedSessions[0]) => {
        // Simular inicio de sesión
        const systemMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Iniciando "${session.title}"... Encuentra una posición cómoda y cierra los ojos. Vamos a comenzar con unas respiraciones profundas. 🧘‍♀️`
        }
        setMessages(prev => [...prev, systemMessage])
        setShowRecommendations(false)

        // Generate TTS for the session intro
        try {
            const audioBlob = await testTTS(systemMessage.content, voiceId)
            const audioUrl = URL.createObjectURL(audioBlob)
            playAudio(audioUrl)
        } catch (e) {
            console.error('Error playing TTS:', e)
        }
    }

    return (
        <div className="coach-chat-page">
            {/* Header */}
            <div className="chat-header">
                {onBack && (
                    <button className="back-btn" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div className="header-content">
                    <h1>✨ IA Personalizada</h1>
                    <p>Sugerencias adaptadas a tu progreso</p>
                </div>
            </div>

            {/* Analysis Card */}
            <div className="analysis-card animate-fadeIn">
                <div className="analysis-icon">
                    <CheckCircle size={20} />
                </div>
                <div className="analysis-content">
                    <h3>Análisis Completado</h3>
                    <p>He identificado 3 áreas para optimizar hoy</p>
                </div>
            </div>

            {/* Recommended Sessions */}
            {showRecommendations && (
                <div className="recommendations animate-fadeInUp">
                    {recommendedSessions.map((session, index) => (
                        <div
                            key={session.id}
                            className={`session-card animate-fadeInUp stagger-${index + 1}`}
                        >
                            <div className="session-header">
                                <span className="session-icon">
                                    <Sparkles size={24} />
                                </span>
                                <div className="session-info">
                                    <h4>{session.title}</h4>
                                    <span className={`priority-badge priority-${session.priority}`}>
                                        Prioridad {session.priority === 'high' ? 'alta' : 'media'}
                                    </span>
                                </div>
                                <div className="session-duration">
                                    <Clock size={14} />
                                    <span>{session.duration} min</span>
                                </div>
                            </div>
                            <p className="session-description">{session.description}</p>
                            <div className="session-footer">
                                {session.tag && (
                                    <span className="session-tag">
                                        <Zap size={12} fill="currentColor" /> {session.tag}
                                    </span>
                                )}
                                <button
                                    className="btn btn-accent btn-sm"
                                    onClick={() => startSession(session)}
                                >
                                    Comenzar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className="messages-container">
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`message ${message.role} animate-fadeIn`}
                    >
                        {message.role === 'assistant' && (
                            <div className="message-avatar">
                                <img src={sublabLogo} alt="SubLab Coach" className="message-avatar-logo" />
                            </div>
                        )}
                        <div className="message-content">
                            {message.isLoading ? (
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            ) : (
                                <>
                                    <p>{message.content}</p>
                                    {message.audioUrl && (
                                        <button
                                            className="play-audio-btn"
                                            onClick={() => playAudio(message.audioUrl!)}
                                        >
                                            <Volume2 size={16} /> Escuchar
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-container">
                <div className="input-wrapper">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe un mensaje..."
                        disabled={isLoading}
                        className="chat-input"
                    />
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                    >
                        <Send size={20} fill={input.trim() ? "currentColor" : "none"} />
                    </button>
                </div>
                <div className="input-actions">
                    {/* Placeholder for mic button if needed later */}
                    {/* <button className="icon-btn"><Mic size={20} /></button> */}
                </div>
            </div>

            <audio ref={audioRef} />
        </div>
    )
}
