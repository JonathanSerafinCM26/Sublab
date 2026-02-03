import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
})

export interface ChatResponse {
    text: string
    audio?: string
    audio_format?: string
    provider: string
    metrics: {
        llm_latency_ms: number
        tts_latency_ms: number
        total_latency_ms: number
        provider_used?: string
        cost: string
        privacy: string
        tts_error?: string
    }
}

export interface TTSResponse {
    audio: ArrayBuffer
    latency_ms: number
    provider: string
    cost: string
}

export interface VoiceCloneResponse {
    voice_name: string
    fish: {
        status: string
        voice_id?: string
        error?: string
    }
    xtts: {
        status: string
        metadata?: any
        error?: string
    }
    default_voice_id?: string
    processing_time?: number
}

export interface VoiceInfo {
    id: string
    name: string
    provider: string
    lang?: string
    gender?: string
    custom?: boolean
}

export interface VoiceListResponse {
    voices: {
        fish: VoiceInfo[]
        xtts: VoiceInfo[]
        default_voice_id?: string
    }
    default_voice_id?: string
    providers: {
        fish_audio: {
            configured: boolean
            is_primary: boolean
        }
        xtts: {
            initialized: boolean
            is_fallback: boolean
        }
    }
}

export interface VoiceStatus {
    tts_manager: {
        fish_audio: {
            configured: boolean
            is_default: boolean
        }
        xtts: {
            initialized: boolean
            is_fallback: boolean
        }
        default_voice_id?: string
        last_provider_used?: string
    }
    local: {
        provider: string
        initialized: boolean
        is_fallback: boolean
        cost: string
        privacy: string
        supports_cloning: boolean
        voices?: VoiceInfo[]
    }
    cloud: {
        provider: string
        configured: boolean
        is_primary: boolean
        cost: string
        privacy: string
        supports_cloning: boolean
    }
}

/**
 * Send a chat message and get response with optional TTS audio.
 * TTS provider is auto-selected (Fish first, XTTS fallback).
 */
export async function sendMessage(
    message: string,
    voiceId?: string
): Promise<ChatResponse> {
    const response = await api.post('/api/chat/generate', {
        message,
        voice_id: voiceId,
        include_audio: true,
    })
    return response.data
}

/**
 * Test TTS directly without LLM.
 * Provider is auto-selected.
 */
export async function testTTS(
    text: string,
    voiceId?: string
): Promise<Blob> {
    const response = await api.post('/api/chat/test-tts', {
        text,
        voice_id: voiceId,
    }, {
        responseType: 'blob',
    })
    return response.data
}

/**
 * Clone a voice from audio recording.
 * Clones on both Fish Audio (primary) and XTTS (backup).
 */
export async function cloneVoice(
    audioBlob: Blob,
    voiceName: string = 'coach_voice'
): Promise<VoiceCloneResponse> {
    const formData = new FormData()
    formData.append('audio', audioBlob, `${voiceName}.webm`)
    formData.append('voice_name', voiceName)

    const response = await api.post('/api/voice/clone', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
    return response.data
}

/**
 * Get list of available voices from all providers.
 */
export async function getVoices(): Promise<VoiceListResponse> {
    const response = await api.get('/api/voice/voices')
    return response.data
}

/**
 * Set the default voice for TTS generation.
 */
export async function setDefaultVoice(voiceId: string): Promise<{
    success: boolean
    default_voice_id: string
    message: string
}> {
    const response = await api.post('/api/voice/set-default', {
        voice_id: voiceId,
    })
    return response.data
}

/**
 * Get the current default voice ID.
 */
export async function getDefaultVoice(): Promise<{ default_voice_id?: string }> {
    const response = await api.get('/api/voice/default')
    return response.data
}

/**
 * Get voice provider status
 */
export async function getVoiceStatus(): Promise<VoiceStatus> {
    const response = await api.get('/api/voice/status')
    return response.data
}

/**
 * Compare TTS output from both providers
 */
export async function compareTTS(text: string) {
    const response = await api.post('/api/chat/compare', null, {
        params: { text },
    })
    return response.data
}

// ============================================
// API Key Management
// ============================================

export interface ApiKeyStatus {
    configured: boolean
    key_length: number
    key_preview?: string
}

/**
 * Get Fish Audio API key status (without revealing the full key)
 */
export async function getApiKeyStatus(): Promise<ApiKeyStatus> {
    const response = await api.get('/api/voice/api-key/status')
    return response.data
}

/**
 * Set Fish Audio API key
 */
export async function setApiKey(apiKey: string): Promise<{
    success: boolean
    message: string
    status: ApiKeyStatus
}> {
    const response = await api.post('/api/voice/api-key', {
        api_key: apiKey,
    })
    return response.data
}

export default api
