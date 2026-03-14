import { FC, useEffect, useMemo, useState } from 'react'
import {
    ArrowLeft, Check, Headphones, PlayCircle, PenTool, Clock,
    X, BookOpen, Target, Circle, CircleCheck, Compass, Brain, Globe2, GraduationCap
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
    practice: string[]
    audios: string[]
    resources: string[]
}

interface CurriculumProgress {
    completedModuleIds: string[]
    notesByModuleId: Record<string, string>
}

const STORAGE_KEY = 'sublab_curriculum_progress_v1'

const generalInstructions = 'No reflexiones demasiado: escribe en un papel lo primero que te pasa por la cabeza. Puedes repetir los ejercicios las veces que necesites y dedicarles más tiempo si lo deseas.'

const blocks: CurriculumBlock[] = [
    {
        id: 'autoconocimiento',
        title: 'Autoconocimiento',
        icon: 'compass',
        objective: 'Propósito de vida',
        dailyContent: 'Video explicativo + 1 práctica (ejercicio)',
        audios: '—',
        resources: '1 libro o video'
    },
    {
        id: 'subconsciente',
        title: 'Subconsciente',
        icon: 'brain',
        objective: 'Creencias, patrones, memorias y hábitos',
        dailyContent: 'Video explicativo + 1 práctica (audio)',
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
        practice: ['Práctica: descubre tu ikigai.'],
        audios: [],
        resources: ['Recurso recomendado: 1 libro o video sobre propósito de vida (placeholder).']
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
        practice: ['Práctica: descubre tu DAFO.'],
        audios: [],
        resources: ['Recurso recomendado: 1 libro o video sobre autoconocimiento (placeholder).']
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
        practice: [
            'Práctica: descubre tu eneatipo.',
            'Si tienes más tiempo, reflexiona sobre el eneatipo de tu familia, pareja, amigos e hijos.'
        ],
        audios: [],
        resources: ['Recurso recomendado: libro o conferencia sobre eneagrama (placeholder).']
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
        practice: [
            'Valores: encuentra y ordena tus 3 valores principales; si puedes, amplía a 7-10 valores.',
            'Visión: escríbela en un diario o folio y colócala en un lugar visible para verla cada día.',
            'Misión: define el paso a paso diario para acercarte a tu visión.'
        ],
        audios: [],
        resources: ['Recurso recomendado: 1 libro o video sobre propósito y planificación personal (placeholder).']
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
        audios: ['Audio: Estoy tranquilo y relajado (3 veces al día).'],
        resources: ['Recurso recomendado: 1 libro o video sobre subconsciente (placeholder).']
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
            '4) Elige mejor tus palabras: cambia “tengo que” por “quiero”, “tengo miedo” por “puedo hacerlo”.',
            'Cambia una creencia conscientemente: “no soy bueno en inglés” → “aún estoy aprendiendo inglés”.',
            'Piensa en progresión anual: pequeñas acciones repetidas generan avances grandes.'
        ],
        practice: [
            'Elige 1 hábito nuevo y define tu frecuencia diaria.',
            'Elige 1 creencia a reescribir en versión potenciadora y practícala cada día.'
        ],
        audios: ['Audio: Duermo bien.', 'Audio: Tengo confianza en mí.'],
        resources: ['Recurso recomendado: libro o conferencia de neurociencia práctica (placeholder).']
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
        audios: ['Audio: Estoy relajado.'],
        resources: ['Recurso recomendado: 1 libro o video sobre entorno e influencia (placeholder).']
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
        practice: [
            'Realiza tu rueda de la vida actual.',
            'Al lado, crea tu rueda objetivo para diciembre de este año.',
            'Reflexiona y concreta acciones por cada área para llegar a ese resultado.'
        ],
        audios: [],
        resources: ['Recurso recomendado: 1 película o conferencia inspiradora (placeholder).']
    }
]

const emptyProgress: CurriculumProgress = {
    completedModuleIds: [],
    notesByModuleId: {}
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
            notesByModuleId: parsed.notesByModuleId ?? {}
        }
    } catch {
        return emptyProgress
    }
}

export const Practices: FC<PracticesProps> = ({ onBack, onStartPractice, initialPracticeId }) => {
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
    const [progress, setProgress] = useState<CurriculumProgress>(loadProgress)
    const [draftNote, setDraftNote] = useState('')

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
            return
        }
        setDraftNote(progress.notesByModuleId[activeModuleId] ?? '')
    }, [activeModuleId, progress.notesByModuleId])

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

    const openModule = (moduleId: string) => {
        setActiveModuleId(moduleId)
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

                        <div className="module-sections">
                            <section>
                                <h3><PenTool size={16} /> Contenido</h3>
                                <ul>
                                    {activeModule.textContent.map((item, index) => (
                                        <li key={`text-${index}`}>{item}</li>
                                    ))}
                                </ul>
                            </section>

                            {activeModule.video && (
                                <section>
                                    <h3><PlayCircle size={16} /> Video</h3>
                                    <p>{activeModule.video}</p>
                                </section>
                            )}

                            <section>
                                <h3><Target size={16} /> Práctica</h3>
                                <ul>
                                    {activeModule.practice.map((item, index) => (
                                        <li key={`practice-${index}`}>{item}</li>
                                    ))}
                                </ul>
                            </section>

                            {activeModule.audios.length > 0 && (
                                <section>
                                    <h3><Headphones size={16} /> Audios</h3>
                                    <ul>
                                        {activeModule.audios.map((item, index) => (
                                            <li key={`audio-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {activeModule.resources.length > 0 && (
                                <section>
                                    <h3><BookOpen size={16} /> Recursos</h3>
                                    <ul>
                                        {activeModule.resources.map((item, index) => (
                                            <li key={`resource-${index}`}>{item}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <section>
                                <h3><PenTool size={16} /> Mi nota de práctica</h3>
                                <textarea
                                    className="journal-input"
                                    placeholder="Escribe aquí lo primero que te venga a la cabeza..."
                                    value={draftNote}
                                    onChange={(event) => setDraftNote(event.target.value)}
                                />
                                <button className="btn btn-primary save-btn" onClick={saveNote}>
                                    Guardar nota
                                </button>
                            </section>
                        </div>

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
    )
}
