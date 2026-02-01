import { FC, useState, useEffect } from 'react'
import { VoiceRecorder } from './VoiceRecorder'
import { cloneVoice, getVoiceStatus, VoiceStatus } from '../../services/api'
import './VoiceSettingsPanel.css'

type Provider = 'local' | 'cloud'

interface VoiceSettingsPanelProps {
    provider: Provider
    onProviderChange: (provider: Provider) => void
    selectedVoiceId: string
    onVoiceSelect: (voiceId: string) => void
    onClose: () => void
}

export const VoiceSettingsPanel: FC<VoiceSettingsPanelProps> = ({
    provider,
    onProviderChange,
    selectedVoiceId,
    onVoiceSelect,
    onClose,
}) => {
    const [showRecorder, setShowRecorder] = useState(false)
    const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null)
    const [cloneSuccess, setCloneSuccess] = useState<string | null>(null)
    const [cloneError, setCloneError] = useState<string | null>(null)

    useEffect(() => {
        loadVoiceStatus()
    }, [])

    const loadVoiceStatus = async () => {
        try {
            const status = await getVoiceStatus()
            setVoiceStatus(status)
        } catch (err) {
            console.error('Failed to load voice status:', err)
        }
    }

    const handleRecordingComplete = async (audioBlob: Blob): Promise<void> => {
        setCloneError(null)
        setCloneSuccess(null)

        try {
            const result = await cloneVoice(audioBlob, 'coach_voice')

            if (result.local.status === 'success' && result.local.metadata) {
                setCloneSuccess(`¡Voz clonada exitosamente!`)
                onVoiceSelect(result.local.metadata.voice_id)
            } else if (result.local.status === 'error') {
                throw new Error(result.local.message || 'Error desconocido')
            } else {
                setCloneSuccess('Voz procesada (pendiente de validación)')
            }
            // Reload status to show new voice
            await loadVoiceStatus()
            // Note: Don't close here - let VoiceRecorder show success screen
            // The recorder will call onClose when user clicks "Continuar"
        } catch (err) {
            setCloneError('Error al clonar la voz.')
            throw err // Re-throw so VoiceRecorder can show error screen
        }
    }

    const handleRecorderClose = () => {
        setShowRecorder(false)
    }


    return (
        <>
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

                {/* Voice Cloning Section */}
                <div className="settings-section">
                    <h3>🎤 Clonación de Voz</h3>
                    <p className="section-desc">
                        Graba tu voz leyendo un texto para crear una voz personalizada
                    </p>

                    {cloneSuccess && (
                        <div className="success-message">
                            ✅ {cloneSuccess}
                        </div>
                    )}

                    {cloneError && (
                        <div className="error-message">
                            ⚠️ {cloneError}
                        </div>
                    )}

                    <button
                        className="clone-voice-btn"
                        onClick={() => setShowRecorder(true)}
                    >
                        🎙️ Grabar y Clonar Voz
                    </button>

                    {/* Available Voices */}
                    {voiceStatus?.local?.voices && voiceStatus.local.voices.length > 0 && (
                        <div className="available-voices">
                            <h4>Voces Disponibles:</h4>
                            <div className="voice-list">
                                {voiceStatus.local.voices.map((voice: any) => (
                                    <div
                                        key={voice.id}
                                        className={`voice-item ${voice.custom ? 'custom' : ''} ${selectedVoiceId === voice.id ? 'selected' : ''}`}
                                        onClick={() => onVoiceSelect(voice.id)}
                                    >
                                        <span className="voice-name">{voice.name}</span>
                                        {voice.custom && (
                                            <span className="custom-badge">Personalizada</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                    <h3>Estado del Sistema</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">TTS Local</span>
                            <span className={`info-value ${voiceStatus?.local?.initialized ? 'status-ok' : 'status-error'}`}>
                                {voiceStatus?.local?.initialized ? '✅ Activo' : '❌ No disponible'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">TTS Cloud</span>
                            <span className={`info-value ${voiceStatus?.cloud?.configured ? 'status-ok' : 'status-error'}`}>
                                {voiceStatus?.cloud?.configured ? '✅ Configurado' : '❌ Sin configurar'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Backend</span>
                            <span className="info-value">FastAPI + Python</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">LLM</span>
                            <span className="info-value">GLM-4.5 Air (Free)</span>
                        </div>
                    </div>
                </div>
            </div>

            {showRecorder && (
                <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    onClose={() => setShowRecorder(false)}
                />
            )}
        </>
    )
}
