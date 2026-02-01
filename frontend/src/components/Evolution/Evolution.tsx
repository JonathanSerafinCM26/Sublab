import { FC } from 'react'
import './Evolution.css'

interface EvolutionProps {
    onBack?: () => void
}

// Mock data for demo
const mockData = {
    weeklyImprovement: 87,
    daysActive: 12,
    metrics: [
        {
            id: 'anxiety',
            label: 'Ansiedad',
            icon: '📈',
            before: 85,
            after: 35,
            change: -50,
            color: '#6B5B95'
        },
        {
            id: 'stress',
            label: 'Estrés',
            icon: '❤️',
            before: 90,
            after: 25,
            change: -65,
            color: '#88B04B'
        }
    ]
}

export const Evolution: FC<EvolutionProps> = ({ onBack }) => {
    return (
        <div className="evolution-page">
            {/* Header */}
            <div className="evolution-header animate-fadeIn">
                {onBack && (
                    <button className="back-btn" onClick={onBack}>
                        ← Volver
                    </button>
                )}
                <h1>Tu Evolución</h1>
                <p className="subtitle">Seguimiento de tu progreso mental</p>
            </div>

            {/* Weekly Summary Card */}
            <div className="summary-card card animate-fadeInUp">
                <h2 className="card-title">Resumen Semanal</h2>
                <div className="summary-stats">
                    <div className="big-stat">
                        <span className="big-value text-primary">
                            {mockData.weeklyImprovement}%
                        </span>
                        <span className="big-label">Mejora General</span>
                    </div>
                    <div className="big-stat">
                        <span className="big-value text-accent">
                            {mockData.daysActive}
                        </span>
                        <span className="big-label">Días Activos</span>
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            {mockData.metrics.map((metric, index) => (
                <div
                    key={metric.id}
                    className={`metric-card card animate-fadeInUp stagger-${index + 2}`}
                >
                    <div className="metric-header">
                        <span className="metric-icon">{metric.icon}</span>
                        <h3 className="metric-label">{metric.label}</h3>
                        <span
                            className="metric-change"
                            style={{ color: metric.color }}
                        >
                            ↘ {Math.abs(metric.change)}%
                        </span>
                    </div>

                    <div className="metric-comparison">
                        <div className="comparison-row">
                            <span className="row-label">Antes</span>
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill before"
                                    style={{
                                        width: `${metric.before}%`,
                                        backgroundColor: `${metric.color}40`
                                    }}
                                ></div>
                            </div>
                            <span className="row-value">{metric.before}%</span>
                        </div>

                        <div className="comparison-row">
                            <span className="row-label">Actual</span>
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar-fill after"
                                    style={{
                                        width: `${metric.after}%`,
                                        backgroundColor: metric.color
                                    }}
                                ></div>
                            </div>
                            <span className="row-value">{metric.after}%</span>
                        </div>
                    </div>
                </div>
            ))}

            {/* Encouragement Card */}
            <div className="encouragement-card animate-fadeInUp stagger-4">
                <div className="encouragement-icon">🌟</div>
                <div className="encouragement-content">
                    <h4>¡Excelente progreso!</h4>
                    <p>Has reducido tu ansiedad en un 50% esta semana. Continúa con las prácticas diarias.</p>
                </div>
            </div>

            {/* Pagination dots */}
            <div className="pagination-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot active"></span>
                <span className="dot"></span>
            </div>
        </div>
    )
}
