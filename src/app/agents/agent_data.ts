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
