import { FC } from 'react'
import { TrendingUp, Activity, Calendar, Award, ArrowLeft, Heart } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './Evolution.css'

interface EvolutionProps {
    onBack?: () => void
}

// Mock data for demo
const mockData = {
    weeklyImprovement: 87,
    daysActive: 12,
    streak: 12,
    totalMinutes: 340,
    metrics: [
        {
            id: 'anxiety',
            label: 'Ansiedad',
            icon: <Activity size={20} />,
            before: 90,
            after: 45, // More distinction
            change: -50,
            color: '#6B5B95'
        },
        {
            id: 'stress',
            label: 'Estrés',
            icon: <Heart size={20} />,
            before: 85,
            after: 30, // More distinction
            change: -65,
            color: '#88B04B'
        }
    ],
    history: [
        { day: 'Lun', bienestar: 45, estres: 90 },
        { day: 'Mar', bienestar: 50, estres: 80 },
        { day: 'Mié', bienestar: 55, estres: 85 },
        { day: 'Jue', bienestar: 65, estres: 60 },
        { day: 'Vie', bienestar: 75, estres: 50 },
        { day: 'Sáb', bienestar: 85, estres: 40 },
        { day: 'Dom', bienestar: 90, estres: 30 }
    ],
    recentSessions: [
        { id: 1, title: 'Meditación Matutina', date: 'Hoy, 8:30 AM', duration: '10 min', type: 'Audio' },
        { id: 2, title: 'Diario de Gratitud', date: 'Ayer, 9:00 PM', duration: '5 min', type: 'Escritura' },
        { id: 3, title: 'Conversación con Coach', date: 'Ayer, 6:15 PM', duration: '12 min', type: 'IA' },
        { id: 4, title: 'Respiración Profunda', date: 'Lun, 10:00 AM', duration: '8 min', type: 'Video' },
    ]
}

export const Evolution: FC<EvolutionProps> = ({ onBack }) => {
    return (
        <div className="evolution-page">
            {/* Header */}
            <div className="evolution-header animate-fadeIn">
                {onBack && (
                    <button className="back-btn" onClick={onBack}>
                        <ArrowLeft size={18} /> Volver
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
                    <div className="big-stat">
                        <span className="big-value text-fire">
                            {mockData.streak}
                        </span>
                        <span className="big-label">Racha Actual</span>
                    </div>
                </div>
            </div>

            {/* Activity Chart (Recharts) */}
            <div className="activity-card card animate-fadeInUp stagger-1" style={{ overflow: 'hidden' }}>
                <div className="card-header-row mb-4">
                    <h3 className="card-title"><Calendar size={18} /> Balance Semanal</h3>
                </div>
                <div className="chart-container" style={{ height: '220px', width: '100%', padding: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockData.history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBienestar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorEstres" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--error)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="var(--error)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--surface-elevated)', borderRadius: '12px', border: 'none', color: 'var(--text)', boxShadow: 'var(--shadow-sm)' }}
                                itemStyle={{ fontWeight: 600 }}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <Area type="monotone" dataKey="bienestar" name="Bienestar" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorBienestar)" />
                            <Area type="monotone" dataKey="estres" name="Estrés" stroke="var(--error)" strokeWidth={3} fillOpacity={1} fill="url(#colorEstres)" />
                        </AreaChart>
                    </ResponsiveContainer>
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
                            <TrendingUp size={16} style={{ transform: 'rotate(180deg)', display: 'inline' }} /> {Math.abs(metric.change)}%
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

            {/* Recent Sessions List (New) */}
            <div className="sessions-card card animate-fadeInUp stagger-3">
                <h3 className="card-title">Historial de Sesiones</h3>
                <div className="sessions-list">
                    {mockData.recentSessions.map(session => (
                        <div key={session.id} className="session-item">
                            <div className="session-info">
                                <span className="session-title">{session.title}</span>
                                <span className="session-date">{session.date} • {session.type}</span>
                            </div>
                            <span className="session-duration">{session.duration}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Encouragement Card */}
            <div className="encouragement-card animate-fadeInUp stagger-4">
                <div className="encouragement-icon">
                    <Award size={24} />
                </div>
                <div className="encouragement-content">
                    <h4>¡Excelente progreso!</h4>
                    <p>Has reducido tu ansiedad en un 50% esta semana. Continúa con las prácticas diarias.</p>
                </div>
            </div>
        </div>
    )
}
