import { FC } from 'react'
import sublabLogo from '../../assets/sublab-logo.svg'
import './BottomNav.css'

type Page = 'home' | 'coach' | 'evolution' | 'practices' | 'settings'

interface BottomNavProps {
    currentPage: Page
    onNavigate: (page: Page) => void
}

const navItems = [
    { id: 'home' as const, label: 'Inicio', icon: '🏠' },
    { id: 'practices' as const, label: 'Ejercicios', icon: '🎯' },
    { id: 'coach' as const, label: 'Coach', icon: 'logo', isMain: true },
    { id: 'evolution' as const, label: 'Evolución', icon: '📊' },
    { id: 'settings' as const, label: 'Ajustes', icon: '⚙️' }
]

export const BottomNav: FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
    return (
        <nav className="bottom-nav">
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`nav-item ${currentPage === item.id ? 'active' : ''} ${item.isMain ? 'main' : ''}`}
                    onClick={() => onNavigate(item.id)}
                >
                    <span className="nav-icon">
                        {item.icon === 'logo'
                            ? <img src={sublabLogo} alt="SubLab" className="nav-icon-img" />
                            : item.icon}
                    </span>
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    )
}
