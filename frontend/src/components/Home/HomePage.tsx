import { FC } from 'react'
import { Play, PenLine, Sparkles, Flame, Clock, TrendingUp, ChevronRight } from 'lucide-react'
import './HomePage.css'

interface HomePageProps {
    onNavigate: (page: 'coach' | 'evolution' | 'practices', params?: any) => void
}

export const HomePage: FC<HomePageProps> = ({ onNavigate }) => {
    // Mock user name (could be prop later)
    const userName = "Rubén"
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

    return (
        <div className="home-page">
            {/* Header Section */}
            <header className="dashboard-header animate-fadeIn">
                <div className="greeting-container">
                    <h1 className="greeting">Hola, {userName}</h1>
                    <p className="date-display">{today}</p>
                </div>
                <div className="user-mood">
                    <span>¿Cómo te sientes hoy?</span>
                    <div className="mood-selector">
                        <button className="mood-btn" title="Bien">😊</button>
                        <button className="mood-btn" title="Regular">😐</button>
                        <button className="mood-btn" title="Mal">😔</button>
                    </div>
                </div>
            </header>

            {/* Main Grid */}
            <div className="dashboard-grid">

                {/* Hero / Daily Focus */}
                <section className="hero-card animate-fadeInUp">
                    <div className="hero-content">
                        <div className="focus-badge">
                            <Sparkles size={14} className="badge-icon" />
                            Enfoque Diario
                        </div>
                        <h2>Reducir Ansiedad</h2>
                        <p>Tu coach ha preparado una sesión especial para hoy.</p>
                        <button
                            className="btn btn-primary mt-md"
                            onClick={() => onNavigate('coach')}
                        >
                            <Play size={18} fill="currentColor" />
                            Comenzar Sesión con IA
                        </button>
                    </div>
                    <div className="hero-visual">
                        <div className="orbit-visual">
                            <div className="planet"></div>
                            <div className="orbit o1"></div>
                            <div className="orbit o2"></div>
                        </div>
                    </div>
                </section>

                {/* Quick Stats */}
                <section className="stats-row animate-fadeInUp stagger-1">
                    <div className="stat-card">
                        <div className="stat-icon flame">
                            <Flame size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="value">12</span>
                            <span className="label">Racha (días)</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon clock">
                            <Clock size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="value">45m</span>
                            <span className="label">Minutos Hoy</span>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => onNavigate('evolution')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon trend">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="value">87%</span>
                            <span className="label">Bienestar</span>
                        </div>
                    </div>
                </section>

                {/* Quick Actions / Recommendations */}
                <section className="recommendations-row animate-fadeInUp stagger-2">
                    <div className="section-header">
                        <h3>Recomendado para ti</h3>
                        <button className="link-btn" onClick={() => onNavigate('practices')}>
                            Ver todo <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="cards-scroll">
                        <div className="rec-card" onClick={() => onNavigate('practices')}>
                            <div className="rec-icon audio">
                                <span className="icon-wrapper">🎧</span>
                            </div>
                            <div className="rec-info">
                                <h4>Meditación Matutina</h4>
                                <span>10 min • Audio</span>
                            </div>
                            <button className="action-btn-mini">
                                <Play size={16} fill="currentColor" />
                            </button>
                        </div>

                        <div className="rec-card" onClick={() => onNavigate('practices', { practiceId: '4' })}>
                            <div className="rec-icon text">
                                <span className="icon-wrapper">📝</span>
                            </div>
                            <div className="rec-info">
                                <h4>Diario de Gratitud</h4>
                                <span>5 min • Escritura</span>
                            </div>
                            <button className="action-btn-mini">
                                <PenLine size={16} />
                            </button>
                        </div>

                        <div className="rec-card special" onClick={() => onNavigate('coach')}>
                            <div className="rec-icon ai">
                                <Sparkles size={20} />
                            </div>
                            <div className="rec-info">
                                <h4>Conversar con Coach</h4>
                                <span>IA Personalizada</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
