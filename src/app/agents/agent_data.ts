export interface CorpusDocument {
    id: number
    name: string
    type: string
    size: string
    content?: string
    uploadDate: string
    status: "processing" | "ready" | "error"
}

export interface AgentUIState {
    id: string
    databaseId: string // ID from backend
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
    uploaded: boolean // whether the agent has been uploaded to the backend
}

export function defaultAgent(): AgentUIState {
    return {
        id: "",
        databaseId: "",
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
        uploaded: false,
    }
}

export interface Role {
    id: string
    name: string
    prompt: string
    documentAccess: number[] // Array of document IDs
}

export interface LLM {
    provider: string
    name: string
    GDPR_compliant: boolean
    description: string
}

const dummyDocuments: CorpusDocument[] = [
  {
    id: 0,
    name: "Scene 1 Document.pdf",
    type: "PDF",
    size: "2.3 MB",
    uploadDate: "2024-01-15",
    status: "ready",
  },
  {
    id: 1,
    name: "Scene 2 Document.pdf",
    type: "PDF",
    size: "2.3 MB",
    uploadDate: "2024-01-15",
    status: "ready",
  },
  {
    id: 2,
    name: "Fish Facts.docx",
    type: "DOCX",
    size: "1.8 MB",
    uploadDate: "2024-01-14",
    status: "ready",
  },
  {
    id: 3,
    name: "Policies.txt",
    type: "TXT",
    size: "0.5 MB",
    uploadDate: "2024-01-13",
    status: "ready",
  },
];

const initialState: AgentUIState[] = [
  {
    ...defaultAgent(),
    id: "1",
    name: "Blue Sector NPC",
    description: "General Blue Sector NPC for in-game interactions",
    status: "active",
    systemPrompt: "you are an employee at Blue Sector",
    lastUpdated: "2025-09-10",
    documents: dummyDocuments,
    roles: [
      {
        id: "role-1",
        name: "Fish Cutter",
        prompt: "you are a very experienced fish cutter",
        documentAccess: [1, 3, 4],
      },
      {
        id: "role-2",
        name: "Supervisor",
        prompt: "you are the supervisor of the fish cutting team",
        documentAccess: [2, 3, 4],
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
    corpa: string[]
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

    convertFromDB(agents: DatabaseAgent[]): AgentUIState[] {
        return agents.map(
          (agent) =>
            ({
              id: agent.id,
              databaseId: agent.id,
              name: agent.name,
              description: agent.description,
              systemPrompt: agent.prompt,
              temperature: agent.llm_temperature,
              maxTokens: agent.llm_max_tokens,
              model: {
                id: 0,
                name: agent.llm_model,
                provider: agent.llm_provider,
                description: "",
                GDPR_compliant: true,
              } as LLM,
              status: agent.status || "inactive",
              enableMemory: agent.enableMemory,
              enableWebSearch: agent.enableWebSearch,
              responseFormat: agent.response_format,
              documents: dummyDocuments, // TODO
              roles: agent.roles.map((role, index) => ({
                id: `role-${index + 1}`,
                name: role.name,
                prompt: role.description,
                documentAccess: [], // TODO
              })),
              lastUpdated: agent.last_updated || "unknown",
              uploaded: true,
            } as AgentUIState)
        )
    },

    convertToDB(agents: AgentUIState[]): DatabaseAgent[] {
        return agents.map(
            (agent) =>
                ({
                    id: agent.databaseId,
                    name: agent.name,
                    description: agent.description,
                    prompt: agent.systemPrompt,
                    corpa: [], // TODO
                    roles: agent.roles.map((role) => ({
                        name: role.name,
                        description: role.prompt,
                        subset_of_corpa: role.documentAccess,
                    })),
                    llm_provider: "idun",
                    llm_model: agent.model?.name || "none",
                    llm_temperature: agent.temperature,
                    llm_max_tokens: agent.maxTokens,
                    llm_api_key: "sk-1234567890abcdef",
                    access_key: [],
                    retrieval_method: "semantic",
                    embedding_model: "text-embedding-ada-002",
                    status: agent.status,
                    response_format: agent.responseFormat,
                    last_updated: agent.lastUpdated,
                    enableMemory: agent.enableMemory,
                    enableWebSearch: agent.enableWebSearch,
                } as DatabaseAgent)
        )
    },

    async updateAgent(agent: AgentUIState): Promise<AgentUIState> {
        const response = await fetch(`${backend_api_url}/agents/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(this.convertToDB([agent])[0]),
        })
        if (!response.ok) {
            throw new Error(`Failed to update agent: ${response.status}`)
        }
        return await this.convertFromDB([await response.json()])[0]
    },
    // Get an agent by ID
    async getAgentById(agentId: string): Promise<AgentUIState> {
        const response = await fetch(`${backend_api_url}/agents/${agentId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        if (!response.ok) {
            throw new Error(`Failed to fetch agent: ${response.status}`)
        }
        return await response.json()
    },
}
