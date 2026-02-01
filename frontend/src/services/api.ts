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
        provider: string
        cost: string
        privacy: string
    }
}

export interface TTSResponse {
    audio: ArrayBuffer
    latency_ms: number
    provider: string
    cost: string
}

export interface VoiceCloneResponse {
    local_id?: string
    cloud_id?: string
    local_status: string
    cloud_status: string
    processing_time_local?: number
    processing_time_cloud?: number
}

export interface VoiceStatus {
    local: {
        provider: string
        initialized: boolean
        is_local: boolean
        cost: string
        privacy: string
        voices?: Array<{
            id: string
            name: string
            lang: string
            gender: string
            custom: boolean
        }>
    }
    cloud: {
        provider: string
        configured: boolean
        is_local: boolean
        cost: string
        privacy: string
    }
}

/**
 * Send a chat message and get response with optional TTS audio
 */
export async function sendMessage(
    message: string,
    provider: 'local' | 'cloud' = 'cloud'
): Promise<ChatResponse> {
    const response = await api.post('/api/chat/generate', {
        message,
        provider,
        include_audio: true,
    })
    return response.data
}

/**
 * Test TTS directly without LLM
 */
export async function testTTS(
    text: string,
    provider: 'local' | 'cloud' = 'cloud'
): Promise<Blob> {
    const response = await api.post('/api/chat/test-tts', {
        text,
        provider,
    }, {
        responseType: 'blob',
    })
    return response.data
}

/**
 * Clone a voice from audio recording
 */
export async function cloneVoice(
    audioBlob: Blob,
    voiceName: string = 'coach'
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

export default api
