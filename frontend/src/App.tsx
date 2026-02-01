import { useState } from 'react'
import { HomePage } from './components/Home/HomePage'
import { CoachChat } from './components/Coach/CoachChat'
import { Evolution } from './components/Evolution/Evolution'
import { Practices } from './components/Practices/Practices'
import { BottomNav } from './components/Navigation/BottomNav'
import { Sidebar } from './components/Navigation/Sidebar'
import { VoiceSettingsPanel } from './components/Lab/VoiceSettingsPanel'
import './App.css'
import './components/Navigation/Sidebar.css'

type Page = 'home' | 'coach' | 'evolution' | 'practices' | 'settings'
type Provider = 'local' | 'cloud'

function App() {
    const [currentPage, setCurrentPage] = useState<Page>('home')
    const [provider, setProvider] = useState<Provider>('local')
    const [selectedVoiceId, setSelectedVoiceId] = useState<string>('coach_voice')
    const [pendingPracticeId, setPendingPracticeId] = useState<string | null>(null)

    const handleNavigate = (page: Page | 'coach' | 'evolution' | 'practices', params?: any) => {
        if (page === 'practices' && params?.practiceId) {
            setPendingPracticeId(params.practiceId)
        } else {
            setPendingPracticeId(null)
        }
        setCurrentPage(page as Page)
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage onNavigate={handleNavigate} />

            case 'coach':
                return (
                    <CoachChat
                        onBack={() => setCurrentPage('home')}
                        provider={provider}
                        voiceId={selectedVoiceId}
                    />
                )

            case 'evolution':
                return <Evolution onBack={() => setCurrentPage('home')} />

            case 'practices':
                return (
                    <Practices
                        onBack={() => setCurrentPage('home')}
                        initialPracticeId={pendingPracticeId}
                        onStartPractice={(id) => {
                            console.log('Starting practice:', id)
                            // Aquí se podría navegar a la pantalla de práctica
                        }}
                    />
                )

            case 'settings':
                return (
                    <div className="settings-page">
                        <VoiceSettingsPanel
                            provider={provider}
                            onProviderChange={setProvider}
                            selectedVoiceId={selectedVoiceId}
                            onVoiceSelect={setSelectedVoiceId}
                            onClose={() => setCurrentPage('home')}
                        />
                    </div>
                )

            default:
                return <HomePage onNavigate={handleNavigate} />
        }
    }

    return (
        <div className="app">
            <Sidebar
                currentPage={currentPage}
                onNavigate={handleNavigate}
            />

            <main className="app-main">
                {renderPage()}
            </main>

            <BottomNav
                currentPage={currentPage}
                onNavigate={handleNavigate}
            />
        </div>
    )
}

export default App
