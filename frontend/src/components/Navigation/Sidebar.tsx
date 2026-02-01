import { FC } from 'react'
import './BottomNav.css' // Reuse some styles or create new ones

interface SidebarProps {
    currentPage: string
    onNavigate: (page: any) => void
}

export const Sidebar: FC<SidebarProps> = ({ currentPage, onNavigate }) => {

    const menuItems = [
        { id: 'home', label: 'Inicio', icon: '🏠' },
        { id: 'practices', label: 'Ejercicios', icon: '🎯' }, // Swap order
        { id: 'coach', label: 'Coach IA', icon: '✨' },
        { id: 'evolution', label: 'Evolución', icon: '📊' },
        { id: 'settings', label: 'Ajustes', icon: '⚙️' }
    ]

    return (
        <aside className="desktop-sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <span className="logo-icon">💎</span>
                    <h1>SubLab</h1>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span className="item-icon">{item.icon}</span>
                        <span className="item-label">{item.label}</span>
                        {currentPage === item.id && <div className="active-indicator" />}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile-mini">
                    <div className="user-avatar">R</div>
                    <div className="user-info">
                        <span className="user-name">Rubén</span>
                        <span className="user-status">Free Plan</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
