import { FC, useEffect, useMemo, useState } from 'react'
import {
    ArrowLeft, Check, Headphones, PlayCircle, PenTool, Clock,
    X, BookOpen, Target, Circle, CircleCheck, Compass, Brain, Globe2, GraduationCap,
    Film, Star, ThumbsUp, MessageSquare
} from 'lucide-react'
import './Practices.css'

interface PracticesProps {
    onBack?: () => void
    onStartPractice?: (practiceId: string) => void
    initialPracticeId?: string | null
}

type BlockId = 'autoconocimiento' | 'subconsciente' | 'exterior'

interface CurriculumBlock {
    id: BlockId
    title: string
    icon: 'compass' | 'brain' | 'globe'
    objective: string
    dailyContent: string
    audios: string
    resources: string
}

interface CurriculumModule {
    id: string
    blockId: BlockId
    title: string
    description: string
    textContent: string[]
    video?: string
    videoUrl?: string
    audioUrl?: string
    practice: string[]
    audios: { label: string; file: string }[]
    resources: string[]
    books: string[]
    movies: string[]
}

interface CurriculumProgress {
    completedModuleIds: string[]
    notesByModuleId: Record<string, string>
    feedbackByModuleId: Record<string, { rating: number; comment: string }>
}

const STORAGE_KEY = 'sublab_curriculum_progress_v1'

const audioBasePath = '/audio/'

const generalInstructions = 'No reflexiones demasiado: escribe en un papel lo primero que te pasa por la cabeza. Puedes repetir los ejercicios las veces que necesites y dedicarles más tiempo si lo deseas.'

const blocks: CurriculumBlock[] = [
    {
        id: 'autoconocimiento',
        title: 'Autoconocimiento',
        icon: 'compass',
        objective: 'Propósito, Ikigai',
        dailyContent: 'Video explicativo María + responder preguntas',
        audios: '—',
        resources: '1 libro o video'
    },
    {
        id: 'subconsciente',
        title: 'Subconsciente',
        icon: 'brain',
        objective: 'Creencias, patrones, memorias y hábitos',
        dailyContent: 'Video explicativo + audio práctica',
        audios: '3 audios de reprogramación',
        resources: '1 libro o video'
    },
    {
        id: 'exterior',
        title: 'Exterior',
        icon: 'globe',
        objective: 'Mejora áreas de la vida diaria',
        dailyContent: '1 reto o acción/hábito + 1 práctica',
        audios: '—',
        resources: '1 película o conferencia'
    }
]

const modules: CurriculumModule[] = [
    {
        id: 'autoconocimiento-ikigai',
        blockId: 'autoconocimiento',
        title: 'Ikigai',
        description: 'Explora talentos, disfrute y propósito personal.',
        textContent: [
            'Responde a estas preguntas:',
            '1) ¿A qué te gustaba jugar de niño?',
            '2) ¿En qué te piden tu opinión tus familiares, amigos o compañeros?',
            '3) Si tuvieras que enseñar o explicar algo, ¿qué sería?',
            '4) ¿Qué se te da bien, disfrutas haciendo y se te pasa el tiempo volando?'
        ],
        video: 'Video explicativo (pendiente de enlace final).',
        videoUrl: '/api/v1/materials/IKIGAI/video1074764332.mp4',
        audioUrl: '/api/v1/materials/IKIGAI/audio1074764332.m4a',
        practice: ['Práctica: descubre tu ikigai.'],
        audios: [],
        resources: [],
        books: [
            'El hombre en busca de sentido - Viktor Frankl',
            'Ikigai - Francesc Miralles y Héctor García'
        ],
        movies: [
            'En busca de la felicidad',
            'Mi vida sin mí',
            'Soul',
            'Childhood',
            'Hidden figures'
        ]
    },
    {
        id: 'autoconocimiento-dafo',
        blockId: 'autoconocimiento',
        title: 'DAFO personal',
        description: 'Identifica fortalezas y debilidades para diseñar mejoras.',
        textContent: [
            'Responde a estas preguntas:',
            '1) ¿Qué debilidades quieres mejorar?',
            '2) ¿Qué fortalezas posees?'
        ],
        video: 'Video explicativo DAFO (pendiente de enlace final).',
        videoUrl: '/api/v1/materials/DAFO/video1854021737.mp4',
        audioUrl: '/api/v1/materials/DAFO/audio1854021737.m4a',
        practice: ['Práctica: descubre tu DAFO.'],
        audios: [],
        resources: [],
        books: [],
        movies: []
    },
    {
        id: 'autoconocimiento-eneagrama',
        blockId: 'autoconocimiento',
        title: 'Eneagrama',
        description: 'Comprende tu eneatipo y cómo te relacionas con los demás.',
        textContent: [
            'Descubre según tu momento tu reacción según tu ala y la influencia de tus padres en tu manera de ser.',
            'Al trabajarlo, comprenderás mejor cómo son los demás para gestionar trabajo en equipo, atención al cliente, emociones y momentos difíciles.'
        ],
        video: 'Video: Los nueve eneatipos del Eneagrama | Borja Vilaseca - YouTube.',
        videoUrl: '/api/v1/materials/ENEAGRAMA/video1311298601.mp4',
        audioUrl: '/api/v1/materials/ENEAGRAMA/audio1311298601.m4a',
        practice: [
            'Práctica: descubre tu eneatipo.',
            '¿Cuál eres tú? ¿Cuáles son tu pareja, padres, amigos?'
        ],
        audios: [],
        resources: [],
        books: [
            'La sabiduría del eneagrama - Riso y Hudson',
            'Eneagrama en el amor y en el trabajo - Helen Palmer'
        ],
        movies: []
    },
    {
        id: 'autoconocimiento-valores-mision-vision',
        blockId: 'autoconocimiento',
        title: 'Valores, misión y visión',
        description: 'Define tus principios y dirección de vida a largo plazo.',
        textContent: [
            'Video María explicativo en conjunto (pendiente de enlace final).',
            'VALORES: descubre qué es prioridad para ti como persona. Los valores son los principios que dirigen tus decisiones de forma consciente e inconsciente.',
            'Ejemplos de valores: salud, familia, sencillez, pragmatismo, justicia, honestidad. Los valores están vivos y pueden cambiar con el tiempo.',
            'VISIÓN: ¿Qué quieres haber alcanzado en 10 o 20 años? ¿Qué estarás haciendo y dónde te ves?',
            'MISIÓN: ¿Qué te hace levantarte cada mañana?'
        ],
        video: 'Video explicativo (pendiente de enlace final).',
        videoUrl: '/api/v1/materials/VISION_VALORES_MISION/video1552753827.mp4',
        audioUrl: '/api/v1/materials/VISION_VALORES_MISION/audio1552753827.m4a',
        practice: [
            'Valores: encuentra y ordena tus 3 valores principales; si puedes, amplía a 7-10 valores.',
            'Visión: escríbela en un diario o folio y colócala en un lugar visible para verla cada día.',
            'Misión: define el paso a paso diario para acercarte a tu visión.',
            'Crear Vision board.'
        ],
        audios: [],
        resources: [],
        books: [
            'Los 7 hábitos de la gente altamente efectiva - Stephen Covey',
            'Si no te gusta tu vida, cámbiala - Jesús Calleja',
            'Ali',
            'Todos tenemos una historia que contar - Bisila Bokoko'
        ],
        movies: [
            'As Good as it gets',
            'Te puede pasar a ti',
            'Monsieur Aznavour',
            'The founder'
        ]
    },
    {
        id: 'subconsciente-introduccion',
        blockId: 'subconsciente',
        title: 'Introducción al subconsciente',
        description: 'Reconoce el piloto automático y lo que guarda tu subconsciente.',
        textContent: [
            'Tu subconsciente memoriza patrones para liberar energía mental y enfocarte en lo nuevo.',
            'En él se almacenan memorias, creencias, hábitos y emociones, muchas aprendidas entre los 0 y 7 años.',
            'Ejemplo: te levantas, conduces o tomas bus, y al llegar al trabajo no recuerdas todos los pasos intermedios: eso es piloto automático.'
        ],
        practice: [
            'Sé consciente durante tu día de lo que haces en piloto automático.',
            'Escríbelo en tu diario: ¿Qué acciones hago diariamente en piloto automático?'
        ],
        audios: [
            { label: 'Audio: Estoy tranquilo y relajado', file: 'SubLab_Relajacion.m4a' }
        ],
        resources: [],
        books: [
            'El poder del tu mente subconsciente - Joseph Murphy',
            'Poder sin límites - Tony Robbins',
            'El camino más fácil - Mabel Katz'
        ],
        movies: [
            'TLE',
            'Di que si'
        ]
    },
    {
        id: 'subconsciente-neurociencia',
        blockId: 'subconsciente',
        title: 'Neurociencia aplicada',
        description: 'Instala hábitos nuevos y transforma creencias limitantes.',
        textContent: [
            'Elige un nuevo hábito para tu nueva vida:',
            '1) Dormir 7-9 h/día. Un buen día depende también de cómo te acuestas.',
            '2) Invierte 5-30 min/día en contemplar en un parque y parar.',
            '3) Haz una cosa nueva para salir de tu zona de confort (semanal o más frecuente).',
            '4) Elige mejor tus palabras: cambia "tengo que" por "quiero", "tengo miedo" por "puedo hacerlo".',
            'Cambia una creencia conscientemente: "no soy bueno en inglés" → "aún estoy aprendiendo inglés".',
            'Piensa en progresión anual: pequeñas acciones repetidas generan avances grandes.'
        ],
        practice: [
            'Elige 1 hábito nuevo y define tu frecuencia diaria.',
            'Elige 1 creencia a reescribir en versión potenciadora y practícala cada día.',
            '¿Qué 3 nuevas creencias/hábitos quiero cambiar? Antes y después.'
        ],
        audios: [
            { label: 'Audio: Tengo confianza en mí', file: 'SubLab_Confio_en_mi.mp3' },
            { label: 'Audio: Duermo bien', file: 'SubLab_Duermir_bien.m4a' }
        ],
        resources: [],
        books: [
            'Entrena tu cerebro - Marta Romo',
            'El club de las 5 de la mañana - Robin S. Sharma',
            'Hábitos atómicos - James Clear',
            'El poder de los hábitos - Charles Duhigg'
        ],
        movies: [
            'Inside Out'
        ]
    },
    {
        id: 'subconsciente-autosugestion',
        blockId: 'subconsciente',
        title: 'Autosugestión',
        description: 'Detecta influencias del entorno y fortalece mensajes internos saludables.',
        textContent: [
            'La sugestión está presente en el día a día y por eso influye en el subconsciente.',
            'Nos dejamos influir por mensajes del entorno: familia, amigos y pareja pueden limitarte o empoderarte.',
            'Elige conscientemente con quién te rodeas.'
        ],
        practice: ['Haz una revisión rápida de tu entorno y detecta influencias que te potencian o te frenan.'],
        audios: [
            { label: 'Audio: Estoy relajado', file: 'SubLab_Relajacion.m4a' }
        ],
        resources: [],
        books: [
            'Usted puede sanar su vida - Louise Hay',
            'Los 4 acuerdos - Miguel Ruiz',
            'Dejar ir - David R. Hawkins'
        ],
        movies: []
    },
    {
        id: 'exterior-rueda-vida',
        blockId: 'exterior',
        title: 'Rueda de la vida',
        description: 'Evalúa tus áreas vitales y define acciones concretas de mejora.',
        textContent: [
            'Descubre de un vistazo cómo está yendo tu vida actual: ¿tu rueda, rueda?'
        ],
        video: 'Video: María (pendiente de enlace final).',
        videoUrl: '/api/v1/materials/RUEDA_VIDA/video1252771464.mp4',
        audioUrl: '/api/v1/materials/RUEDA_VIDA/audio1252771464.m4a',
        practice: [
            'Hacer tu rueda de la vida hoy.',
            'Hacer la rueda de la vida a 31 dic. ¿Qué voy a hacer en cada área para alcanzar lo que quiero?'
        ],
        audios: [],
        resources: [],
        books: [
            'Coaching para el éxito - Talane Miedanner',
            'Los hombres son de marte, las mujeres son de venus - John Gray',
            'Por qué los hombres no escuchan y las mujeres no entienden los mapas - Pease',
            'Los 7 hábitos de las familias altamente efectivas - Stephen R. Covey',
            'El lenguaje del cuerpo - Pease',
            'La semana laboral de 4 horas - Tim Ferris',
            'El hombre más rico de Babilonia - George Samuel Clason',
            'Los secretos de la gente millonaria - T. Harv Eker'
        ],
        movies: [
            'Documental zonas azules',
            'PS I love you',
            'Pay it forward (cadena de favores)',
            'Ok go'
        ]
    }
]

const emptyProgress: CurriculumProgress = {
    completedModuleIds: [],
    notesByModuleId: {},
    feedbackByModuleId: {}
}

const blockIconMap = {
    compass: Compass,
    brain: Brain,
    globe: Globe2
}

const loadProgress = (): CurriculumProgress => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress

    try {
        const parsed = JSON.parse(raw) as CurriculumProgress
        return {
            completedModuleIds: Array.isArray(parsed.completedModuleIds) ? parsed.completedModuleIds : [],
            notesByModuleId: parsed.notesByModuleId ?? {},
            feedbackByModuleId: parsed.feedbackByModuleId ?? {}
        }
    } catch {
        return emptyProgress
    }
}

export const Practices: FC<PracticesProps> = ({ onBack, onStartPractice, initialPracticeId }) => {
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
    const [modalStep, setModalStep] = useState<number>(1)
    const [progress, setProgress] = useState<CurriculumProgress>(loadProgress)
    const [draftNote, setDraftNote] = useState('')
    const [feedbackRating, setFeedbackRating] = useState<number>(0)
    const [feedbackComment, setFeedbackComment] = useState('')

    const moduleMap = useMemo(
        () => modules.reduce<Record<string, CurriculumModule>>((acc, item) => {
            acc[item.id] = item
            return acc
        }, {}),
        []
    )

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    }, [progress])

    useEffect(() => {
        if (!initialPracticeId) return
        if (!moduleMap[initialPracticeId]) return
        setActiveModuleId(initialPracticeId)
        onStartPractice?.(initialPracticeId)
    }, [initialPracticeId, moduleMap, onStartPractice])

    useEffect(() => {
        if (!activeModuleId) {
            setDraftNote('')
            setFeedbackRating(0)
            setFeedbackComment('')
            return
        }
        setDraftNote(progress.notesByModuleId[activeModuleId] ?? '')
        const fb = progress.feedbackByModuleId[activeModuleId]
        if (fb) {
            setFeedbackRating(fb.rating)
            setFeedbackComment(fb.comment)
        } else {
            setFeedbackRating(0)
            setFeedbackComment('')
        }
    }, [activeModuleId, progress.notesByModuleId, progress.feedbackByModuleId])

    const activeModule = activeModuleId ? moduleMap[activeModuleId] : null
    const totalModules = modules.length
    const completedCount = progress.completedModuleIds.length
    const completionRate = totalModules ? (completedCount / totalModules) * 100 : 0

    const isCompleted = (moduleId: string) => progress.completedModuleIds.includes(moduleId)

    const toggleCompleted = (moduleId: string) => {
        setProgress((prev) => {
            if (prev.completedModuleIds.includes(moduleId)) {
                return {
                    ...prev,
                    completedModuleIds: prev.completedModuleIds.filter((id) => id !== moduleId)
                }
            }

            return {
                ...prev,
                completedModuleIds: [...prev.completedModuleIds, moduleId]
            }
        })
    }

    const saveNote = () => {
        if (!activeModuleId) return
        setProgress((prev) => ({
            ...prev,
            notesByModuleId: {
                ...prev.notesByModuleId,
                [activeModuleId]: draftNote.trim()
            }
        }))
    }

    const saveFeedback = () => {
        if (!activeModuleId || feedbackRating === 0) return
        setProgress((prev) => ({
            ...prev,
            feedbackByModuleId: {
                ...prev.feedbackByModuleId,
                [activeModuleId]: { rating: feedbackRating, comment: feedbackComment.trim() }
            }
        }))
    }

    const openModule = (moduleId: string) => {
        setActiveModuleId(moduleId)
        setModalStep(1)
        onStartPractice?.(moduleId)
    }

    return (
        <div className="practices-page">
            <div className="practices-header animate-fadeIn">
                {onBack && (
                    <button className="back-btn" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </button>
                )}
                <h1 className="practices-title"><Target size={20} /> Programa de Prácticas</h1>
                <p className="subtitle">Autoconocimiento, subconsciente y áreas de vida</p>
            </div>

            <div className="daily-progress card animate-fadeInUp">
                <div className="progress-info">
                    <span className="progress-label">Progreso del Programa</span>
                    <span className="progress-count">{completedCount}/{totalModules}</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill success" style={{ width: `${completionRate}%` }} />
                </div>
            </div>

            <section className="instructions-card card animate-fadeInUp stagger-1">
                <h3>Instrucciones para prácticas</h3>
                <p>{generalInstructions}</p>
            </section>

            <div className="blocks-grid animate-fadeInUp stagger-2">
                {blocks.map((block) => {
                    const BlockIcon = blockIconMap[block.icon]
                    const blockModules = modules.filter((module) => module.blockId === block.id)
                    const blockCompleted = blockModules.filter((module) => isCompleted(module.id)).length
                    const blockProgress = blockModules.length ? (blockCompleted / blockModules.length) * 100 : 0

                    return (
                        <article key={block.id} className="block-card card">
                            <div className="block-head">
                                <span className="block-icon"><BlockIcon size={18} /></span>
                                <div>
                                    <h3>{block.title}</h3>
                                    <p>{block.objective}</p>
                                </div>
                            </div>

                            <ul className="block-meta">
                                <li><Clock size={14} /> {block.dailyContent}</li>
                                <li><Headphones size={14} /> {block.audios}</li>
                                <li><BookOpen size={14} /> {block.resources}</li>
                            </ul>

                            <div className="progress-info block-progress-info">
                                <span className="progress-label">Avance del bloque</span>
                                <span className="progress-count">{blockCompleted}/{blockModules.length}</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill success" style={{ width: `${blockProgress}%` }} />
                            </div>
                        </article>
                    )
                })}
            </div>

            {blocks.map((block, blockIndex) => {
                const BlockIcon = blockIconMap[block.icon]
                const blockModules = modules.filter((module) => module.blockId === block.id)

                return (
                    <section key={block.id} className={`module-group animate-fadeInUp stagger-${Math.min(blockIndex + 2, 4)}`}>
                        <div className="section-title-row">
                            <h2><BlockIcon size={18} /> {block.title}</h2>
                        </div>

                        <div className="practices-list">
                            {blockModules.map((module) => (
                                <div
                                    key={module.id}
                                    className={`practice-card ${isCompleted(module.id) ? 'completed' : ''}`}
                                >
                                    <div className="practice-icon-container">
                                        <span className="practice-icon"><BlockIcon size={18} /></span>
                                        {isCompleted(module.id) && (
                                            <span className="check-badge">
                                                <Check size={12} strokeWidth={4} />
                                            </span>
                                        )}
                                    </div>

                                    <div className="practice-info">
                                        <h3>{module.title}</h3>
                                        <p className="module-description">{module.description}</p>
                                        <div className="practice-meta">
                                            <span className="type-badge text"><PenTool size={12} /> Texto</span>
                                            {module.video && <span className="type-badge video"><PlayCircle size={12} /> Video</span>}
                                            {module.audios.length > 0 && <span className="type-badge audio"><Headphones size={12} /> Audio</span>}
                                            {(module.books.length > 0 || module.movies.length > 0) && <span className="type-badge book"><BookOpen size={12} /> Libros/Películas</span>}
                                            <span className="duration"><Target size={12} /> Práctica guiada</span>
                                        </div>
                                    </div>

                                    <button className="practice-action-btn start" onClick={() => openModule(module.id)}>
                                        Abrir
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )
            })}

            {activeModule && (
                <div className="player-overlay animate-fadeIn">
                    <div className="player-card curriculum-modal">
                        <button className="close-player" onClick={() => setActiveModuleId(null)}>
                            <X size={24} />
                        </button>

                        <div className="player-header module-header">
                            <div className="player-icon"><GraduationCap size={30} /></div>
                            <div>
                                <h2>{activeModule.title}</h2>
                                <p>{activeModule.description}</p>
                            </div>
                        </div>

                        <div className="module-sections wizard-sections">
                            {/* Step indicators */}
                            <div className="wizard-progress">
                                <div className={`wizard-step ${modalStep >= 1 ? 'active' : ''}`} onClick={() => setModalStep(1)}>
                                    <div className="step-circle">1</div>
                                    <span>Teoría</span>
                                </div>
                                <div className="step-line"></div>
                                <div className={`wizard-step ${modalStep >= 2 ? 'active' : ''}`} onClick={() => setModalStep(2)}>
                                    <div className="step-circle">2</div>
                                    <span>Práctica</span>
                                </div>
                                <div className="step-line"></div>
                                <div className={`wizard-step ${modalStep >= 3 ? 'active' : ''}`} onClick={() => setModalStep(3)}>
                                    <div className="step-circle">3</div>
                                    <span>Reflexión</span>
                                </div>
                            </div>

                            <div className="wizard-body">
                                {modalStep === 1 && (
                                    <div className="wizard-step-content animate-fadeIn">
                                        <section>
                                            <h3><PenTool size={16} /> Contenido</h3>
                                            <ul>
                                                {activeModule.textContent.map((item, index) => (
                                                    <li key={`text-${index}`}>{item}</li>
                                                ))}
                                            </ul>
                                        </section>

                                        {activeModule.videoUrl && (
                                            <section className="video-section">
                                                <h3><PlayCircle size={16} /> Video</h3>
                                                <video 
                                                    controls 
                                                    className="video-player"
                                                    src={activeModule.videoUrl}
                                                >
                                                    Tu navegador no soporta video HTML5.
                                                </video>
                                            </section>
                                        )}
                                    </div>
                                )}

                                {modalStep === 2 && (
                                    <div className="wizard-step-content animate-fadeIn">
                                        <section>
                                            <h3><Target size={16} /> Práctica</h3>
                                            <ul className="practice-checklist">
                                                {activeModule.practice.map((item, index) => (
                                                    <li key={`practice-${index}`}>
                                                        <Check size={16} className="text-accent" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>

                                        {activeModule.audioUrl && (
                                            <section>
                                                <h3><Headphones size={16} /> Audio</h3>
                                                <audio 
                                                    controls 
                                                    className="audio-player"
                                                    src={activeModule.audioUrl}
                                                >
                                                    Tu navegador no soporta audio HTML5.
                                                </audio>
                                            </section>
                                        )}

                                        {activeModule.audios.length > 0 && (
                                            <section>
                                                <h3><Headphones size={16} /> Audios de reprogramación</h3>
                                                <div className="audio-player-list">
                                                    {activeModule.audios.map((item, index) => (
                                                        <div key={`audio-${index}`} className="audio-player-item">
                                                            <div className="audio-item-label">
                                                                <PlayCircle size={16} />
                                                                <span>{item.label}</span>
                                                            </div>
                                                            <audio 
                                                                controls 
                                                                className="audio-player-sm"
                                                                src={`${audioBasePath}${item.file}`}
                                                            >
                                                                Tu navegador no soporta audio HTML5.
                                                            </audio>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {(activeModule.books.length > 0 || activeModule.movies.length > 0) && (
                                            <section>
                                                <h3><BookOpen size={16} /> Libros y películas recomendados</h3>
                                                <div className="resource-grid">
                                                    {activeModule.books.length > 0 && (
                                                        <div className="resource-column">
                                                            <h4 className="resource-column-title">
                                                                <BookOpen size={14} /> Libros
                                                            </h4>
                                                            <ul className="resource-list">
                                                                {activeModule.books.map((item, index) => (
                                                                    <li key={`book-${index}`}>
                                                                        <BookOpen size={14} />
                                                                        <span>{item}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {activeModule.movies.length > 0 && (
                                                        <div className="resource-column">
                                                            <h4 className="resource-column-title">
                                                                <Film size={14} /> Películas / Documentales
                                                            </h4>
                                                            <ul className="resource-list">
                                                                {activeModule.movies.map((item, index) => (
                                                                    <li key={`movie-${index}`}>
                                                                        <Film size={14} />
                                                                        <span>{item}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        )}

                                        {activeModule.resources.length > 0 && (
                                            <section>
                                                <h3><BookOpen size={16} /> Recursos adicionales</h3>
                                                <ul className="resource-list">
                                                    {activeModule.resources.map((item, index) => (
                                                        <li key={`resource-${index}`}>
                                                            <BookOpen size={16} />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </section>
                                        )}
                                    </div>
                                )}

                                {modalStep === 3 && (
                                    <div className="wizard-step-content animate-fadeIn">
                                        <section>
                                            <h3><PenTool size={16} /> Mi nota de práctica</h3>
                                            <p className="text-muted text-sm mb-2">Reflexiona y registra tu progreso. ¿Qué descubriste hoy?</p>
                                            <textarea
                                                className="journal-input enhanced-input"
                                                placeholder="Escribe aquí lo primero que te venga a la cabeza..."
                                                value={draftNote}
                                                onChange={(event) => setDraftNote(event.target.value)}
                                            />
                                            <button className="btn btn-primary save-btn" onClick={saveNote}>
                                                Guardar nota
                                            </button>
                                        </section>

                                        <section className="feedback-section">
                                            <h3><MessageSquare size={16} /> Tu opinión sobre esta práctica</h3>
                                            <p className="text-muted text-sm mb-2">Ayúdanos a mejorar valorando esta práctica.</p>
                                            
                                            <div className="star-rating">
                                                <span className="star-rating-label">Valoración:</span>
                                                <div className="stars">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            className={`star-btn ${feedbackRating >= star ? 'active' : ''}`}
                                                            onClick={() => setFeedbackRating(star)}
                                                            title={`${star} estrella${star !== 1 ? 's' : ''}`}
                                                        >
                                                            <Star size={22} fill={feedbackRating >= star ? 'var(--accent)' : 'none'} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <textarea
                                                className="journal-input feedback-input"
                                                placeholder="Cuéntanos qué te ha parecido, qué mejorarías..."
                                                value={feedbackComment}
                                                onChange={(event) => setFeedbackComment(event.target.value)}
                                            />
                                            <button 
                                                className="btn btn-accent save-btn" 
                                                onClick={saveFeedback}
                                                disabled={feedbackRating === 0}
                                            >
                                                <ThumbsUp size={16} /> Enviar opinión
                                            </button>
                                        </section>
                                        
                                        <div className="completion-card">
                                            <h4>¿Has terminado esta práctica?</h4>
                                            <button
                                                className={`btn ${isCompleted(activeModule.id) ? 'btn-secondary' : 'btn-accent'} complete-btn`}
                                                onClick={() => toggleCompleted(activeModule.id)}
                                            >
                                                {isCompleted(activeModule.id) ? (
                                                    <>
                                                        <Circle size={16} /> Marcar como pendiente
                                                    </>
                                                ) : (
                                                    <>
                                                        <CircleCheck size={16} /> Marcar módulo como completado
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="wizard-footer">
                                <button 
                                    className="btn btn-secondary" 
                                    disabled={modalStep === 1} 
                                    onClick={() => setModalStep(prev => prev - 1)}
                                >
                                    Anterior
                                </button>
                                {modalStep < 3 ? (
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => setModalStep(prev => prev + 1)}
                                    >
                                        Siguiente
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => setActiveModuleId(null)}
                                    >
                                        Finalizar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
