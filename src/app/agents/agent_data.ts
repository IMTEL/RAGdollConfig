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
                status: "ready",
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

const backend_api_url = process.env.BACKEND_API_URL || "http://localhost:8000"

interface DatabaseAgent {
    id: string // optional for creation
    name: string
    description: string
    prompt: string
    corpa: CorpusDocument[]
    llm_provider: string
    llm_model: string // TODO: Change to LLM model
    llm_temperature: number
    llm_max_tokens: number
    llm_api_key: string
    access_key: string[] // may change later
    retrieval_method?: string
    embedding_model?: string // optional for now
    status?: "active" | "inactive"
    response_format: "text" | "structured"
    enableMemory: boolean // not in backend
    enableWebSearch: boolean // not in backend and also we wont do this low key
    last_updated?: string
    roles: DatabaseRole[]
}

interface DatabaseRole {
    name: string
    description: string
    subset_of_corpa: number[]
}

export const agentsClient = {
    // Fetch all agents
    async getAll(): Promise<DatabaseAgent[]> {
        const res = await fetch(`${backend_api_url}/agents`)
        if (!res.ok) {
            throw new Error("Failed to fetch agents")
        }

        const agents = await res.json()

        return agents.map((agent: any) => ({
            ...agent,
            status: agent.status || "inactive", // Default to inactive if status is missing
        }))
    },

    convertFromDB(agents: DatabaseAgent[]): Agent[] {
        return agents.map(
            (agent) =>
                ({
                    id: agent.id,
                    name: agent.name,
                    description: agent.description,
                    systemPrompt: agent.prompt,
                    temperature: agent.llm_temperature,
                    maxTokens: agent.llm_max_tokens,
                    model: {
                        id: 0,
                        name: agent.llm_model,
                        description: "",
                        GDPRCompliant: true,
                    } as LLM,
                    status: agent.status || "inactive",
                    enableMemory: agent.enableMemory,
                    enableWebSearch: agent.enableWebSearch,
                    responseFormat: agent.response_format,
                    documents: [], // TODO
                    roles: agent.roles.map((role, index) => ({
                        id: `role-${index + 1}`,
                        name: role.name,
                        prompt: role.description,
                        documentAccess: [], // TODO
                    })),
                    lastUpdated: agent.last_updated || "unknown",
                } as Agent)
        )
    },
}
