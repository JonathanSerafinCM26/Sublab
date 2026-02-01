import { FC } from 'react'
import './Practices.css'

interface PracticesProps {
    onBack?: () => void
    onStartPractice?: (practiceId: string) => void
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
        title: 'Reflexión Nocturna',
        type: 'text',
        duration: 15,
        completed: false,
        icon: '📝'
    }
]

export const Practices: FC<PracticesProps> = ({ onBack, onStartPractice }) => {
    const completedCount = todayPractices.filter(p => p.completed).length

    return (
        <div className="practices-page">
            {/* Header */}
            <div className="practices-header animate-fadeIn">
                {onBack && (
                    <button className="back-btn" onClick={onBack}>
                        ←
                    </button>
                )}
                <h1>🎯 Prácticas Diarias</h1>
                <p className="subtitle">Tu entrenamiento personalizado</p>
            </div>

            {/* Progress */}
            <div className="daily-progress card animate-fadeInUp">
                <div className="progress-info">
                    <span className="progress-label">Progreso de Hoy</span>
                    <span className="progress-count">{completedCount}/{todayPractices.length}</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill success"
                        style={{ width: `${(completedCount / todayPractices.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Practices List */}
            <div className="practices-list">
                {todayPractices.map((practice, index) => (
                    <div
                        key={practice.id}
                        className={`practice-card animate-fadeInUp stagger-${index + 1} ${practice.completed ? 'completed' : ''}`}
                    >
                        <div className="practice-icon-container">
                            <span className="practice-icon">{practice.icon}</span>
                            {practice.completed && (
                                <span className="check-badge">✓</span>
                            )}
                        </div>

                        <div className="practice-info">
                            <h3>{practice.title}</h3>
                            <div className="practice-meta">
                                <span className={`type-badge ${practice.type}`}>
                                    {practice.type === 'audio' && '🎧'}
                                    {practice.type === 'video' && '🎬'}
                                    {practice.type === 'text' && '📖'}
                                    {practice.type}
                                </span>
                                <span className="duration">⏱ {practice.duration} min</span>
                            </div>
                        </div>

                        <button
                            className={`practice-action-btn ${practice.completed ? 'replay' : 'start'}`}
                            onClick={() => onStartPractice?.(practice.id)}
                        >
                            {practice.completed ? '↻' : '▶'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Motivation Card */}
            <div className="motivation-card card-glass animate-fadeInUp stagger-5">
                <div className="motivation-icon">💪</div>
                <p>
                    <strong>¡Sigue así!</strong> Cada práctica te acerca más a tu mejor versión.
                </p>
            </div>
        </div>
    )
}
