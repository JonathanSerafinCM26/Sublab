import { FC, useState } from 'react'
import {
    ArrowLeft, Check, Headphones, PlayCircle, PenTool, Clock,
    RotateCw, Play, X, Rewind, Pause, FastForward
} from 'lucide-react'
import './Practices.css'

interface PracticesProps {
    onBack?: () => void
    onStartPractice?: (practiceId: string) => void
    initialPracticeId?: string | null
}

// Mock data for demo
const todayPractices = [
    {
        id: '1',
        title: 'Meditación Matutina',
        type: 'audio',
        duration: 10,
        completed: true,
        icon: '🧘‍♀️'
    },
    {
        id: '2',
        title: 'Afirmaciones Positivas',
        type: 'audio',
        duration: 5,
        completed: false,
        icon: '💬'
    },
    {
        id: '3',
        title: 'Respiración 4-7-8',
        type: 'video',
        duration: 8,
        completed: false,
        icon: '🌬️'
    },
    {
        id: '4',
        title: 'Diario de Gratitud',
        type: 'text',
        duration: 5,
        completed: false,
        icon: '📝'
    }
]

export const Practices: FC<PracticesProps> = ({ onBack, initialPracticeId }) => { // Removed onStartPractice from props as we handle it internally now
    const [practices, setPractices] = useState(todayPractices)
    const [activePracticeId, setActivePracticeId] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [journalEntry, setJournalEntry] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Auto-start practice if initialPracticeId is provided
    useState(() => {
        if (initialPracticeId) {
            const practice = practices.find(p => p.id === initialPracticeId)
            if (practice) {
                setActivePracticeId(initialPracticeId)
                setIsPlaying(true)
                if (practice.type === 'text') {
                    const savedEntry = localStorage.getItem(`journal_${new Date().toISOString().split('T')[0]}`)
                    if (savedEntry) setJournalEntry(savedEntry)
                }
            }
        }
    })

    const completedCount = practices.filter(p => p.completed).length

    const handleStartPractice = (id: string) => {
        setActivePracticeId(id)
        setIsPlaying(true)
        // Load existing entry if it's the journal
        const practice = practices.find(p => p.id === id)
        if (practice?.type === 'text') {
            const savedEntry = localStorage.getItem(`journal_${new Date().toISOString().split('T')[0]}`)
            if (savedEntry) setJournalEntry(savedEntry)
        }
    }

    const handleComplete = (id: string) => {
        setPractices(prev => prev.map(p =>
            p.id === id ? { ...p, completed: true } : p
        ))
        setIsPlaying(false)
        setActivePracticeId(null)
    }

    const saveJournal = () => {
        if (!activePracticeId) return
        setIsSaving(true)

        // Simulating network delay
        setTimeout(() => {
            localStorage.setItem(`journal_${new Date().toISOString().split('T')[0]}`, journalEntry)
            handleComplete(activePracticeId)
            setIsSaving(false)
            setJournalEntry('')
        }, 800)
    }

    const closePlayer = () => {
        setIsPlaying(false)
        setActivePracticeId(null)
    }

    const activePractice = practices.find(p => p.id === activePracticeId)

    return (
        <div className="practices-page">
            {/* Header */}
            <div className="practices-header animate-fadeIn">
                {onBack && (
                    <button className="back-btn" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </button>
                )}
                <h1>🎯 Prácticas Diarias</h1>
                <p className="subtitle">Tu entrenamiento personalizado</p>
            </div>

            <div className="daily-progress card animate-fadeInUp">
                <div className="progress-info">
                    <span className="progress-label">Progreso de Hoy</span>
                    <span className="progress-count">{completedCount}/{practices.length}</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill success"
                        style={{ width: `${(completedCount / practices.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Practices List */}
            <div className="practices-list">
                {practices.map((practice, index) => (
                    <div
                        key={practice.id}
                        className={`practice-card animate-fadeInUp stagger-${index + 1} ${practice.completed ? 'completed' : ''}`}
                    >
                        <div className="practice-icon-container">
                            <span className="practice-icon">{practice.icon}</span>
                            {practice.completed && (
                                <span className="check-badge">
                                    <Check size={12} strokeWidth={4} />
                                </span>
                            )}
                        </div>

                        <div className="practice-info">
                            <h3>{practice.title}</h3>
                            <div className="practice-meta">
                                <span className={`type-badge ${practice.type}`}>
                                    {practice.type === 'audio' && <Headphones size={12} />}
                                    {practice.type === 'video' && <PlayCircle size={12} />}
                                    {practice.type === 'text' && <PenTool size={12} />}
                                    <span style={{ textTransform: 'capitalize', marginLeft: '4px' }}>{practice.type}</span>
                                </span>
                                <span className="duration">
                                    <Clock size={12} /> {practice.duration} min
                                </span>
                            </div>
                        </div>

                        <button
                            className={`practice-action-btn ${practice.completed ? 'replay' : 'start'}`}
                            onClick={() => handleStartPractice(practice.id)}
                        >
                            {practice.completed ? (
                                <RotateCw size={20} />
                            ) : (
                                <Play size={20} fill="currentColor" />
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Player/Journal Overlay */}
            {isPlaying && activePractice && (
                <div className="player-overlay animate-fadeIn">
                    <div className={`player-card ${activePractice.type === 'text' ? 'journal-mode' : ''}`}>
                        <button className="close-player" onClick={closePlayer}>
                            <X size={24} />
                        </button>

                        <div className="player-header">
                            <div className="player-icon">{activePractice.icon}</div>
                            <div>
                                <h2>{activePractice.title}</h2>
                                <p>{activePractice.type === 'text' ? 'Escribe tus pensamientos...' : 'Reproduciendo sesión...'}</p>
                            </div>
                        </div>

                        {activePractice.type === 'text' ? (
                            <div className="journal-editor">
                                <textarea
                                    className="journal-input"
                                    placeholder="Hoy me siento agradecido por..."
                                    value={journalEntry}
                                    onChange={(e) => setJournalEntry(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    className="btn btn-primary save-btn"
                                    onClick={saveJournal}
                                    disabled={!journalEntry.trim() || isSaving}
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar en mi Diario'}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="audio-visualizer">
                                    <div className="bar b1"></div>
                                    <div className="bar b2"></div>
                                    <div className="bar b3"></div>
                                    <div className="bar b4"></div>
                                    <div className="bar b5"></div>
                                </div>

                                <div className="player-controls">
                                    <button className="control-btn secondary">
                                        <Rewind size={24} />
                                    </button>
                                    <button className="control-btn primary">
                                        <Pause size={32} fill="currentColor" />
                                    </button>
                                    <button className="control-btn secondary">
                                        <FastForward size={24} />
                                    </button>
                                </div>

                                <button
                                    className="btn btn-success complete-btn"
                                    onClick={() => handleComplete(activePractice.id)}
                                >
                                    Marcar como Completado
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
