import { FC } from 'react'
import './HomePage.css'

interface HomePageProps {
    onNavigate: (page: 'coach' | 'evolution' | 'practices') => void
}

export const HomePage: FC<HomePageProps> = ({ onNavigate }) => {
    return (
        <div className="home-page">
            {/* Hero Section */}
            <div className="hero-section animate-fadeIn">
                <div className="hero-icon animate-float">
                    <div className="diamond-container">
                        <div className="diamond">💎</div>
                        <div className="orbit-ring"></div>
                    </div>
                </div>

                <h1 className="hero-title">SubLab</h1>
                <p className="hero-subtitle">
                    <span className="icon-brain">🧠</span>
                    Entrena tu subconsciente
                    <span className="icon-sparkle">✨</span>
                </p>

                <p className="hero-description">
                    Transforma tu mente con ejercicios personalizados,
                    seguimiento de progreso y IA avanzada.
                </p>

                <button
                    className="btn btn-primary hero-cta animate-breathe"
                    onClick={() => onNavigate('coach')}
                >
                    Comenzar Entrenamiento
                </button>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions animate-fadeInUp stagger-2">
                <button
                    className="action-card"
                    onClick={() => onNavigate('practices')}
                >
                    <div className="action-icon">
                        <span>🎯</span>
                    </div>
                    <span className="action-label">Ejercicios</span>
                </button>

                <button
                    className="action-card"
                    onClick={() => onNavigate('coach')}
                >
                    <div className="action-icon ai">
                        <span>✨</span>
                    </div>
                    <span className="action-label">IA Personal</span>
                </button>
            </div>

            {/* Progress Summary */}
            <div className="progress-summary card animate-fadeInUp stagger-3">
                <div className="progress-header">
                    <span className="progress-icon">📊</span>
                    <h3>Tu Progreso Semanal</h3>
                </div>
                <div className="progress-stats">
                    <div className="stat-item">
                        <span className="stat-value">87%</span>
                        <span className="stat-label">Mejora General</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-value">12</span>
                        <span className="stat-label">Días Activos</span>
                    </div>
                </div>
                <button
                    className="btn btn-ghost progress-link"
                    onClick={() => onNavigate('evolution')}
                >
                    Ver Tu Evolución →
                </button>
            </div>

            {/* AI Coach Teaser */}
            <div className="coach-teaser card-glass animate-fadeInUp stagger-4">
                <div className="coach-avatar">
                    <span>🤖</span>
                </div>
                <div className="coach-content">
                    <p className="coach-message">
                        ¡Hola! He identificado <strong>3 áreas</strong> para optimizar hoy.
                    </p>
                    <button
                        className="btn btn-accent btn-sm"
                        onClick={() => onNavigate('coach')}
                    >
                        Hablar con tu Coach
                    </button>
                </div>
            </div>
        </div>
    )
}
