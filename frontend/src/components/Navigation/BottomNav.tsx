import { FC } from 'react'
import { Home, Target, TrendingUp, Settings } from 'lucide-react'
import sublabMark from '../../assets/sublab-mark.svg'
import './BottomNav.css'

type Page = 'home' | 'coach' | 'evolution' | 'practices' | 'settings'

interface BottomNavProps {
    currentPage: Page
    onNavigate: (page: Page) => void
}

const navItems = [
    { id: 'home' as const, label: 'Inicio', icon: Home },
    { id: 'practices' as const, label: 'Ejercicios', icon: Target },
    { id: 'coach' as const, label: 'Coach', icon: 'logo', isMain: true },
    { id: 'evolution' as const, label: 'Evolución', icon: TrendingUp },
    { id: 'settings' as const, label: 'Ajustes', icon: Settings }
]

export const BottomNav: FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
    return (
        <nav className="bottom-nav glass">
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`nav-item ${currentPage === item.id ? 'active' : ''} ${item.isMain ? 'main' : ''}`}
                    onClick={() => onNavigate(item.id)}
                >
                    <span className="nav-icon">
                        {item.icon === 'logo'
                            ? <img src={sublabMark} alt="SubLab" className="nav-icon-img nav-icon-mark" />
                            : <item.icon size={18} />}
                    </span>
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    )
}
