import { FC } from 'react'
import { Home, Target, Sparkles, TrendingUp, Settings } from 'lucide-react'
import sublabLogo from '../../assets/sublab-logo.svg'
import './BottomNav.css' // Reuse some styles or create new ones

interface SidebarProps {
    currentPage: string
    onNavigate: (page: any) => void
}

export const Sidebar: FC<SidebarProps> = ({ currentPage, onNavigate }) => {

    const menuItems = [
        { id: 'home', label: 'Inicio', icon: Home },
        { id: 'practices', label: 'Ejercicios', icon: Target }, // Swap order
        { id: 'coach', label: 'Coach IA', icon: Sparkles },
        { id: 'evolution', label: 'Evolución', icon: TrendingUp },
        { id: 'settings', label: 'Ajustes', icon: Settings }
    ]

    return (
        <aside className="desktop-sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <img className="logo-icon" src={sublabLogo} alt="SubLab" />
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
                        <span className="item-icon"><item.icon size={18} /></span>
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
