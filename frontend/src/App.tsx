import { useState } from 'react'
import { VoiceSettingsPanel } from './components/Lab/VoiceSettingsPanel'
import { ChatInterface } from './components/Chat/ChatInterface'
import './App.css'

type Provider = 'local' | 'cloud'

function App() {
    const [provider, setProvider] = useState<Provider>('cloud')
    const [showSettings, setShowSettings] = useState(false)

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <h1 className="logo">
                        <span className="logo-icon">🎙️</span>
                        SubLab
                    </h1>
                    <p className="tagline">Laboratorio de Voz</p>
                </div>
                <button
                    className="settings-btn"
                    onClick={() => setShowSettings(!showSettings)}
                >
                    ⚙️ Configuración
                </button>
            </header>

            <main className="app-main">
                {showSettings && (
                    <VoiceSettingsPanel
                        provider={provider}
                        onProviderChange={setProvider}
                        onClose={() => setShowSettings(false)}
                    />
                )}

                <ChatInterface provider={provider} />
            </main>

            <footer className="app-footer">
                <div className="provider-indicator">
                    {provider === 'local' ? (
                        <span className="badge local">
                            🟢 Modo Privado (Local) • $0 • En Dispositivo
                        </span>
                    ) : (
                        <span className="badge cloud">
                            🔵 Modo HD (Cloud) • ~$0.001 • Fish Audio
                        </span>
                    )}
                </div>
                <button
                    className="toggle-quick"
                    onClick={() => setProvider(p => p === 'local' ? 'cloud' : 'local')}
                >
                    Cambiar a {provider === 'local' ? 'Cloud' : 'Local'}
                </button>
            </footer>
        </div>
    )
}

export default App
