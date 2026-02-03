import { FC, useState, useEffect } from 'react'
import { VoiceRecorder } from './VoiceRecorder'
import {
    cloneVoice,
    getVoiceStatus,
    getVoices,
    setDefaultVoice,
    getApiKeyStatus,
    setApiKey,
    VoiceStatus,
    VoiceInfo,
    ApiKeyStatus
} from '../../services/api'
import './VoiceSettingsPanel.css'

interface VoiceSettingsPanelProps {
    selectedVoiceId: string
    onVoiceSelect: (voiceId: string) => void
    onClose: () => void
}

export const VoiceSettingsPanel: FC<VoiceSettingsPanelProps> = ({
    selectedVoiceId,
    onVoiceSelect,
    onClose,
}) => {
    const [showRecorder, setShowRecorder] = useState(false)
    const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null)
    const [allVoices, setAllVoices] = useState<VoiceInfo[]>([])
    const [defaultVoiceId, setDefaultVoiceId] = useState<string | null>(null)
    const [cloneSuccess, setCloneSuccess] = useState<string | null>(null)
    const [cloneError, setCloneError] = useState<string | null>(null)
    const [isSettingDefault, setIsSettingDefault] = useState(false)

    // API Key state
    const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null)
    const [newApiKey, setNewApiKey] = useState('')
    const [isSavingApiKey, setIsSavingApiKey] = useState(false)
    const [apiKeyMessage, setApiKeyMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        loadVoiceData()
        loadApiKeyStatus()
    }, [])

    const loadApiKeyStatus = async () => {
        try {
            const status = await getApiKeyStatus()
            setApiKeyStatus(status)
        } catch (err) {
            console.error('Failed to load API key status:', err)
        }
    }

    const handleSaveApiKey = async () => {
        if (!newApiKey.trim() || newApiKey.length < 10) {
            setApiKeyMessage({ type: 'error', text: 'La API key debe tener al menos 10 caracteres' })
            return
        }

        setIsSavingApiKey(true)
        setApiKeyMessage(null)

        try {
            const result = await setApiKey(newApiKey)
            if (result.success) {
                setApiKeyStatus(result.status)
                setNewApiKey('')
                setApiKeyMessage({ type: 'success', text: '✅ API Key configurada exitosamente' })
                // Reload voice status to reflect the change
                await loadVoiceData()
            }
        } catch (err: any) {
            setApiKeyMessage({ type: 'error', text: err?.response?.data?.detail || 'Error al guardar la API key' })
        } finally {
            setIsSavingApiKey(false)
        }
    }

    const loadVoiceData = async () => {
        try {
            // Load status
            const status = await getVoiceStatus()
            setVoiceStatus(status)
            setDefaultVoiceId(status.tts_manager?.default_voice_id || null)

            // Load all voices
            const voicesResponse = await getVoices()
            const combined: VoiceInfo[] = [
                ...(voicesResponse.voices?.fish || []).map(v => ({ ...v, provider: 'fish_audio' })),
                ...(voicesResponse.voices?.xtts || []).map(v => ({ ...v, provider: 'xtts' })),
            ]
            setAllVoices(combined)

            // Update default from voices response
            if (voicesResponse.default_voice_id) {
                setDefaultVoiceId(voicesResponse.default_voice_id)
            }
        } catch (err) {
            console.error('Failed to load voice data:', err)
        }
    }

    const handleRecordingComplete = async (audioBlob: Blob): Promise<void> => {
        setCloneError(null)
        setCloneSuccess(null)

        try {
            const result = await cloneVoice(audioBlob, 'coach_voice')

            // Check Fish status first (primary)
            if (result.fish?.status === 'success' && result.fish.voice_id) {
                setCloneSuccess(`¡Voz clonada exitosamente con Fish Audio!`)
                onVoiceSelect(result.fish.voice_id)
            } else if (result.xtts?.status === 'success') {
                setCloneSuccess(`¡Voz clonada con XTTS (local)!`)
            } else {
                setCloneSuccess('Voz procesada (pendiente de validación)')
            }

            // Update default voice if set
            if (result.default_voice_id) {
                setDefaultVoiceId(result.default_voice_id)
                onVoiceSelect(result.default_voice_id)
            }

            // Reload all data
            await loadVoiceData()
        } catch (err) {
            setCloneError('Error al clonar la voz.')
            throw err
        }
    }

    const handleSetDefaultVoice = async (voiceId: string) => {
        setIsSettingDefault(true)
        try {
            const result = await setDefaultVoice(voiceId)
            if (result.success) {
                setDefaultVoiceId(result.default_voice_id)
                onVoiceSelect(result.default_voice_id)
            }
        } catch (err) {
            console.error('Failed to set default voice:', err)
        } finally {
            setIsSettingDefault(false)
        }
    }

    const fishConfigured = apiKeyStatus?.configured || voiceStatus?.cloud?.configured || false
    const xttsInitialized = voiceStatus?.local?.initialized || false

    return (
        <>
            <div className="settings-panel card animate-fadeIn">
                <div className="settings-header">
                    <h2>⚙️ Configuración de Voz</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* API Key Configuration Section */}
                <div className="settings-section api-key-section">
                    <h3>🔑 Fish Audio API Key</h3>
                    <p className="section-desc">
                        Configura tu API Key de Fish Audio para habilitar TTS de alta calidad.
                    </p>

                    <div className="api-key-status">
                        <span className={`status-indicator ${fishConfigured ? 'configured' : 'not-configured'}`}>
                            {fishConfigured ? '✅ Configurada' : '❌ No configurada'}
                        </span>
                        {apiKeyStatus?.key_preview && (
                            <span className="key-preview">{apiKeyStatus.key_preview}</span>
                        )}
                    </div>

                    <div className="api-key-input-group">
                        <input
                            type="password"
                            className="api-key-input"
                            placeholder="Pega tu API Key aquí..."
                            value={newApiKey}
                            onChange={(e) => setNewApiKey(e.target.value)}
                        />
                        <button
                            className="save-api-key-btn"
                            onClick={handleSaveApiKey}
                            disabled={isSavingApiKey || !newApiKey.trim()}
                        >
                            {isSavingApiKey ? '⏳' : '💾'} Guardar
                        </button>
                    </div>

                    {apiKeyMessage && (
                        <div className={`api-key-message ${apiKeyMessage.type}`}>
                            {apiKeyMessage.text}
                        </div>
                    )}

                    <p className="api-key-help">
                        <a href="https://fish.audio" target="_blank" rel="noopener noreferrer">
                            🐟 Obtener API Key en fish.audio →
                        </a>
                    </p>
                </div>

                {/* TTS Status Banner */}
                <div className="settings-section">
                    <div className="tts-status-banner">
                        <div className="status-item primary">
                            <span className="status-icon">{fishConfigured ? '🐟' : '⚠️'}</span>
                            <span className="status-text">
                                Fish Audio: {fishConfigured ? 'Configurado (Principal)' : 'No configurado'}
                            </span>
                        </div>
                        <div className="status-item fallback">
                            <span className="status-icon">{xttsInitialized ? '🎙️' : '⚠️'}</span>
                            <span className="status-text">
                                XTTS Local: {xttsInitialized ? 'Activo (Respaldo)' : 'No disponible'}
                            </span>
                        </div>
                    </div>
                    <p className="section-desc" style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                        Fish Audio se usa por defecto. Si falla, XTTS local se usa automáticamente.
                    </p>
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
                </div>

                {/* Voice Selection Section */}
                <div className="settings-section">
                    <h3>🔊 Voces Disponibles</h3>
                    <p className="section-desc">
                        Selecciona una voz para usar en el coach
                    </p>

                    {allVoices.length > 0 ? (
                        <div className="voice-list">
                            {allVoices.map((voice) => (
                                <div
                                    key={`${voice.provider}-${voice.id}`}
                                    className={`voice-item ${voice.id === defaultVoiceId ? 'selected' : ''} ${voice.id === selectedVoiceId ? 'active' : ''}`}
                                    onClick={() => handleSetDefaultVoice(voice.id)}
                                >
                                    <div className="voice-info">
                                        <span className="voice-name">{voice.name}</span>
                                        <span className={`provider-badge ${voice.provider}`}>
                                            {voice.provider === 'fish_audio' ? '🐟 Fish' : '🎙️ XTTS'}
                                        </span>
                                    </div>
                                    {voice.id === defaultVoiceId && (
                                        <span className="default-badge">Predeterminada</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-voices-message">
                            <p>No hay voces personalizadas. ¡Graba una para empezar!</p>
                        </div>
                    )}

                    {isSettingDefault && (
                        <div className="setting-default-indicator">
                            Estableciendo voz predeterminada...
                        </div>
                    )}
                </div>

                {/* System Status */}
                <div className="settings-section">
                    <h3>📊 Estado del Sistema</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Proveedor Principal</span>
                            <span className="info-value">Fish Audio (Cloud)</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Respaldo</span>
                            <span className="info-value">XTTS v2 (Local)</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Voz Activa</span>
                            <span className="info-value">{defaultVoiceId || 'Ninguna'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">LLM</span>
                            <span className="info-value">GLM-4.5 Air</span>
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
