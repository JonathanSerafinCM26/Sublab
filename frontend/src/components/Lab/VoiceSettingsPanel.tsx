import { FC } from 'react'
import './VoiceSettingsPanel.css'

type Provider = 'local' | 'cloud'

interface VoiceSettingsPanelProps {
    provider: Provider
    onProviderChange: (provider: Provider) => void
    onClose: () => void
}

export const VoiceSettingsPanel: FC<VoiceSettingsPanelProps> = ({
    provider,
    onProviderChange,
    onClose,
}) => {
    return (
        <div className="settings-panel card animate-fadeIn">
            <div className="settings-header">
                <h2>⚙️ Configuración de Voz</h2>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="settings-section">
                <h3>Proveedor TTS</h3>
                <p className="section-desc">
                    Elige entre procesamiento local (privado) o en la nube (alta calidad)
                </p>

                <div className="toggle-container">
                    <button
                        className={`toggle-option local ${provider === 'local' ? 'active' : ''}`}
                        onClick={() => onProviderChange('local')}
                    >
                        <span className="toggle-icon">🟢</span>
                        <span className="toggle-label">Modo Privado</span>
                        <span className="toggle-desc">Kokoro (Local)</span>
                    </button>

                    <button
                        className={`toggle-option cloud ${provider === 'cloud' ? 'active' : ''}`}
                        onClick={() => onProviderChange('cloud')}
                    >
                        <span className="toggle-icon">🔵</span>
                        <span className="toggle-label">Modo HD</span>
                        <span className="toggle-desc">Fish Audio (Cloud)</span>
                    </button>
                </div>
            </div>

            <div className="settings-section">
                <h3>Comparación de Proveedores</h3>
                <div className="comparison-table">
                    <div className="comparison-row header">
                        <span></span>
                        <span className="local-header">🟢 Local</span>
                        <span className="cloud-header">🔵 Cloud</span>
                    </div>
                    <div className="comparison-row">
                        <span>Latencia</span>
                        <span>~2-5s</span>
                        <span>~1-2s</span>
                    </div>
                    <div className="comparison-row">
                        <span>Costo</span>
                        <span className="highlight-good">$0.00</span>
                        <span>~$0.001</span>
                    </div>
                    <div className="comparison-row">
                        <span>Privacidad</span>
                        <span className="highlight-good">100%</span>
                        <span>API Externa</span>
                    </div>
                    <div className="comparison-row">
                        <span>Calidad</span>
                        <span>Buena</span>
                        <span className="highlight-good">Excelente</span>
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h3>Información del Sistema</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">Backend</span>
                        <span className="info-value">FastAPI + Python</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">TTS Local</span>
                        <span className="info-value">Kokoro-82M (ONNX)</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">TTS Cloud</span>
                        <span className="info-value">Fish Audio API</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">LLM</span>
                        <span className="info-value">Gemini 2.0 Flash (OpenRouter)</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
