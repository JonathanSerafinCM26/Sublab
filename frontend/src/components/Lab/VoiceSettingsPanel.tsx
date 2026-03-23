import { FC, useState, useEffect } from 'react'
import { Moon, Bell, User, Shield } from 'lucide-react'
import './VoiceSettingsPanel.css'

interface VoiceSettingsPanelProps {
    selectedVoiceId: string
    onVoiceSelect: (voiceId: string) => void
    onClose: () => void
}

export const VoiceSettingsPanel: FC<VoiceSettingsPanelProps> = ({
    onClose,
}) => {
    const [darkMode, setDarkMode] = useState(false)
    const [notifications, setNotifications] = useState(true)
    const [soundEffects, setSoundEffects] = useState(true)

    // Check system preference or localStorage on mount
    useEffect(() => {
        const isDark = document.body.classList.contains('dark-theme')
        setDarkMode(isDark)
    }, [])

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
        if (!darkMode) {
            document.body.classList.add('dark-theme')
        } else {
            document.body.classList.remove('dark-theme')
        }
    }

    return (
        <div className="settings-panel card animate-fadeIn">
            <div className="settings-header">
                <h2>Ajustes</h2>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="settings-content">
                
                <div className="settings-section">
                    <h3><User size={18} /> Cuenta y Perfil</h3>
                    <div className="setting-item">
                        <div className="setting-info">
                            <h4>Plan Actual</h4>
                            <p className="text-muted">SubLab Free</p>
                        </div>
                        <button className="btn btn-primary btn-sm">Mejorar Plan</button>
                    </div>
                </div>

                <div className="settings-section">
                    <h3><Moon size={18} /> Apariencia</h3>
                    
                    <div className="setting-item">
                        <div className="setting-info">
                            <h4>Modo Oscuro</h4>
                            <p className="text-muted">Cambia entre tema claro y oscuro</p>
                        </div>
                        <label className="toggle-switch">
                            <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div className="settings-section">
                    <h3><Bell size={18} /> Notificaciones y Audio</h3>
                    
                    <div className="setting-item">
                        <div className="setting-info">
                            <h4>Notificaciones de Prácticas</h4>
                            <p className="text-muted">Recibe recordatorios diarios</p>
                        </div>
                        <label className="toggle-switch">
                            <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h4>Efectos de sonido</h4>
                            <p className="text-muted">Sonidos al completar ejercicios</p>
                        </div>
                        <label className="toggle-switch">
                            <input type="checkbox" checked={soundEffects} onChange={() => setSoundEffects(!soundEffects)} />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div className="settings-section">
                    <h3><Shield size={18} /> Privacidad</h3>
                    <div className="setting-item">
                        <div className="setting-info">
                            <h4>Términos y condiciones</h4>
                        </div>
                        <button className="btn btn-secondary btn-sm">Ver</button>
                    </div>
                    <div className="setting-item">
                        <div className="setting-info">
                            <h4>Cerrar Sesión</h4>
                        </div>
                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>Salir</button>
                    </div>
                </div>

            </div>
        </div>
    )
}
