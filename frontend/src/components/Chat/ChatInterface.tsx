import { FC, useState, useRef, useEffect } from 'react'
import { sendMessage, ChatResponse } from '../../services/api'
import sublabLogo from '../../assets/sublab-logo.svg'
import './ChatInterface.css'

type Provider = 'local' | 'cloud'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    metrics?: {
        llm_latency_ms: number
        tts_latency_ms: number
        total_latency_ms: number
        provider: string
        cost: string
        privacy: string
    }
    audioData?: string
}

interface ChatInterfaceProps {
    provider: Provider
}

export const ChatInterface: FC<ChatInterfaceProps> = ({ provider }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: '¡Hola! Soy tu coach de bienestar. ¿Cómo te sientes hoy? Estoy aquí para ayudarte a encontrar calma y claridad. 🧘‍♀️',
            timestamp: new Date(),
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [playingAudio, setPlayingAudio] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response: ChatResponse = await sendMessage(input.trim(), provider)

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.text,
                timestamp: new Date(),
                metrics: response.metrics,
                audioData: response.audio,
            }

            setMessages(prev => [...prev, assistantMessage])

            // Auto-play audio if available
            if (response.audio) {
                playAudio(response.audio)
            }
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const playAudio = (base64Audio: string) => {
        if (audioRef.current) {
            audioRef.current.pause()
        }

        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`)
        audioRef.current = audio
        setPlayingAudio(base64Audio)

        audio.onended = () => setPlayingAudio(null)
        audio.play().catch(console.error)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="chat-interface card">
            <div className="chat-messages">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`message ${message.role} animate-fadeIn`}
                    >
                        <div className="message-avatar">
                            {message.role === 'user'
                                ? '👤'
                                : <img src={sublabLogo} alt="SubLab Coach" className="message-avatar-logo" />}
                        </div>
                        <div className="message-content">
                            <div className="message-text">{message.content}</div>

                            {message.metrics && (
                                <div className="message-metrics">
                                    <span className="metrics-badge">
                                        ⏱️ {message.metrics.total_latency_ms}ms
                                    </span>
                                    <span className="metrics-badge">
                                        💸 {message.metrics.cost}
                                    </span>
                                    <span className={`metrics-badge ${message.metrics.provider === 'local' ? 'success' : ''}`}>
                                        🔒 {message.metrics.privacy}
                                    </span>
                                </div>
                            )}

                            {message.audioData && (
                                <button
                                    className={`play-audio-btn ${playingAudio === message.audioData ? 'playing' : ''}`}
                                    onClick={() => playAudio(message.audioData!)}
                                >
                                    {playingAudio === message.audioData ? '⏹️ Reproduciendo...' : '🔊 Reproducir Audio'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message assistant animate-fadeIn">
                        <div className="message-avatar">
                            <img src={sublabLogo} alt="SubLab Coach" className="message-avatar-logo" />
                        </div>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
                <textarea
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    disabled={isLoading}
                    rows={1}
                />
                <button
                    className="send-btn btn btn-primary"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                >
                    {isLoading ? '...' : '➤'}
                </button>
            </div>
        </div>
    )
}
