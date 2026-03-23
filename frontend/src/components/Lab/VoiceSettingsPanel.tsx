import { FC } from 'react'
import './VoiceSettingsPanel.css'

interface VoiceSettingsPanelProps {
    selectedVoiceId: string
    onVoiceSelect: (voiceId: string) => void
    onClose: () => void
}

export const VoiceSettingsPanel: FC<VoiceSettingsPanelProps> = ({
    onClose,
}) => {
    return (
        <div className="settings-panel card animate-fadeIn">
            <div className="settings-header">
                <h2>⚙️ Ajustes</h2>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="settings-content">
                <div className="settings-section">
                    <h3>Perfil y Preferencias</h3>
                    <p className="text-muted">Próximamente podrás configurar tu perfil, tus notificaciones y preferencias de audio aquí.</p>
                </div>
            </div>
        </div>
    )
}
