export interface CorpusDocument {
    id: string
    name: string
    type: string
    size: string
    uploadDate: string
    status: "processing" | "ready" | "error"
}

export interface Agent {
    id: string
    name: string
    description: string
    systemPrompt: string
    temperature: number
    maxTokens: number
    model: LLM | null
    status: "active" | "inactive"
    enableMemory: boolean
    enableWebSearch: boolean
    responseFormat: "text" | "structured"
    documents: CorpusDocument[]
    roles: Role[]
    lastUpdated: string
}

export function defaultAgent(): Agent {
    return {
        id: "",
        name: "unnamed agent",
        description: "",
        systemPrompt: "",
        temperature: 0.5,
        maxTokens: 1000,
        model: null,
        status: "active",
        enableMemory: false,
        enableWebSearch: false,
        responseFormat: "text",
        documents: [],
        roles: [],
        lastUpdated: "unknown",
    }
}

export interface Role {
    id: string
    name: string
    prompt: string
    documentAccess: string[] // Array of document IDs
}

export interface LLM {
    id: number
    name: string
    description: string
    GDPRCompliant: boolean
}

export const initialState: Agent[] = [
    {
        ...defaultAgent(),
        id: "1",
        name: "Blue Sector NPC",
        description: "General Blue Sector NPC for in-game interactions",
        status: "active",
        systemPrompt: "you are an employee at Blue Sector",
        lastUpdated: "2025-09-10",
        documents: [
            {
                id: "doc-1",
                name: "Scene 1 Document.pdf",
                type: "PDF",
                size: "2.3 MB",
                uploadDate: "2024-01-15",
                status: "ready",
            },
            {
                id: "doc-2",
                name: "Scene 2 Document.pdf",
                type: "PDF",
                size: "2.3 MB",
                uploadDate: "2024-01-15",
                status: "ready",
            },
            {
                id: "doc-3",
                name: "Fish Facts.docx",
                type: "DOCX",
                size: "1.8 MB",
                uploadDate: "2024-01-14",
                status: "ready",
            },
            {
                id: "doc-4",
                name: "Policies.txt",
                type: "TXT",
                size: "0.5 MB",
                uploadDate: "2024-01-13",
                status: "processing",
            },
        ],
        roles: [
            {
                id: "role-1",
                name: "Fish Cutter",
                prompt: "you are a very experienced fish cutter",
                documentAccess: ["doc-1", "doc-3", "doc-4"],
            },
            {
                id: "role-2",
                name: "Supervisor",
                prompt: "you are the supervisor of the fish cutting team",
                documentAccess: ["doc-2", "doc-3", "doc-4"],
            },
        ],
    },
    {
        ...defaultAgent(),
        id: "2",
        name: "Tutoring agent",
        systemPrompt: "you are a tutor assisting students",
        description: "An agent to help students with their questions",
        status: "inactive",
        lastUpdated: "2024-12-01",
        documents: [],
        roles: [],
    },
]
