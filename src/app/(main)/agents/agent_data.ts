import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";
import { getServerSession } from "next-auth/next";

export interface DocumentMetadata {
  id: string | null;
  name: string;
  type: string;
  size: string;
  content?: string;
  uploadDate: string;
  status: "processing" | "ready" | "error";
}

export interface AgentUIState {
  id: string;
  databaseId: string; // ID from backend
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: LLM | null;
  embeddingModel: string;
  llmApiKey: string | null;
  embeddingApiKey: string | null;
  status: "active" | "inactive";
  enableMemory: boolean;
  enableWebSearch: boolean;
  responseFormat: "text" | "structured";
  documents: DocumentMetadata[] | null; // null means not loaded yet
  roles: Role[];
  lastUpdated: string;
  uploaded: boolean; // whether the agent has been uploaded to the backend
  // RAG retrieval parameters
  topK: number;
  similarityThreshold: number;
  hybridSearchAlpha: number;
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
    embeddingModel: "",
    llmApiKey: null,
    embeddingApiKey: null,
    status: "active",
    enableMemory: false,
    enableWebSearch: false,
    responseFormat: "text",
    documents: null,
    roles: [],
    lastUpdated: "unknown",
    uploaded: false,
    topK: 5,
    similarityThreshold: 0.5,
    hybridSearchAlpha: 0.75,
  };
}

export interface Role {
  id: string;
  name: string;
  prompt: string;
  documentAccess: string[]; // Array of document IDs
}

export interface LLM {
  provider: string;
  name: string;
  GDPR_compliant: boolean;
  description: string;
}

const backend_api_url = process.env.BACKEND_API_URL || "http://localhost:8000";

interface DatabaseAgent {
  id: string; // optional for creation
  name: string;
  description: string;
  prompt: string;
  llm_provider: string;
  llm_model: string; // TODO: Change to LLM model
  llm_temperature: number;
  llm_max_tokens: number;
  llm_api_key: string | null;
  access_key: string[]; // may change later
  retrieval_method?: string;
  embedding_model?: string; // optional for now
  embedding_api_key: string | null;
  status?: "active" | "inactive";
  response_format: "text" | "structured";
  enableMemory: boolean; // not in backend
  enableWebSearch: boolean; // not in backend and also we wont do this low key
  last_updated?: string;
  roles: DatabaseRole[];
  // RAG retrieval parameters
  top_k?: number;
  similarity_threshold?: number;
  hybrid_search_alpha?: number;
}

interface DatabaseRole {
  name: string;
  description: string;
  document_access: string[];
}

export const agentsClient = {
  async getAll(): Promise<DatabaseAgent[]> {
    const res = await fetch("/api/fetch-agents");
    if (!res.ok) throw new Error("Failed to fetch agents");
    return res.json();
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
          embeddingModel: agent.embedding_model,
          llmApiKey: agent.llm_api_key ?? null,
          embeddingApiKey: agent.embedding_api_key ?? null,
          responseFormat: agent.response_format,
          documents: null,
          roles: agent.roles.map((role, index) => ({
            id: `role-${index + 1}`,
            name: role.name,
            prompt: role.description,
            documentAccess: role.document_access,
          })),
          lastUpdated: agent.last_updated || "unknown",
          uploaded: true,
          topK: agent.top_k ?? 5,
          similarityThreshold: agent.similarity_threshold ?? 0.5,
          hybridSearchAlpha: agent.hybrid_search_alpha ?? 0.75,
        }) as AgentUIState
    );
  },

  convertToDB(agents: AgentUIState[]): DatabaseAgent[] {
    return agents.map((agent) => {
      const llmApiKey = agent.llmApiKey?.trim();
      const embeddingApiKey = agent.embeddingApiKey?.trim();

      if (!llmApiKey) {
        throw new Error("LLM API key is required when saving an agent");
      }

      if (!embeddingApiKey) {
        throw new Error("Embedding API key is required when saving an agent");
      }

      return {
        id: agent.databaseId,
        name: agent.name,
        description: agent.description,
        prompt: agent.systemPrompt,
        roles: agent.roles.map((role) => ({
          name: role.name,
          description: role.prompt,
          document_access: role.documentAccess,
        })),
        llm_provider: agent.model?.provider || "idun",
        llm_model: agent.model?.name || "none",
        llm_temperature: agent.temperature,
        llm_max_tokens: agent.maxTokens,
        llm_api_key: llmApiKey,
        embedding_api_key: embeddingApiKey,
        access_key: [],
        retrieval_method: "semantic",
        embedding_model: agent.embeddingModel,
        status: agent.status,
        response_format: agent.responseFormat,
        last_updated: agent.lastUpdated,
        enableMemory: agent.enableMemory,
        enableWebSearch: agent.enableWebSearch,
        top_k: agent.topK,
        similarity_threshold: agent.similarityThreshold,
        hybrid_search_alpha: agent.hybridSearchAlpha,
      } as DatabaseAgent;
    });
  },

  async createNewAgent(
    name: string,
    description: string,
    embedding: string,
    model?: LLM | null,
    llmApiKey?: string | null,
    embeddingApiKey?: string | null
  ): Promise<AgentUIState> {
    const agent = defaultAgent();
    agent.name = name;
    agent.description = description;
    agent.embeddingModel = embedding;
    agent.model = model || null;
    agent.llmApiKey = llmApiKey ?? null;
    agent.embeddingApiKey = embeddingApiKey ?? null;
    // Create a default role with the same name as the agent
    agent.roles = [
      {
        id: Date.now().toString(),
        name: name,
        prompt: "",
        documentAccess: [],
      },
    ];
    return this.updateAgent(agent);
  },

  async updateAgent(agent: AgentUIState): Promise<AgentUIState> {
    const response = await fetch(`/api/set-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.convertToDB([agent])[0]),
    });
    if (!response.ok) {
      throw new Error(`Failed to update agent: ${response.status}`);
    }
    return await this.convertFromDB([await response.json()])[0];
  },
  // Get an agent by ID
  async getAgentById(agentId: string): Promise<AgentUIState> {
    const response = await fetch(`api/fetch-agent?agent_id=${agentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch agent: ${response.status}`);
    }
    return await response.json();
  },

  // Get all documents for an agent
  async getDocumentsForAgent(agentId: string): Promise<DocumentMetadata[]> {
    const response = await axios.get("/api/fetch-documents", {
      params: { agentId: agentId },
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status !== 200) {
      // If agent not found or no documents, return empty array
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to fetch documents: ${response.status}`);
    }
    const data = await response.data;

    // Convert backend format to DocumentMetadata format
    return data.documents.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      type: doc.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
      size: doc.size || "Unknown", // Use size from backend
      uploadDate: doc.created_at
        ? new Date(doc.created_at).toISOString().split("T")[0]
        : "Unknown",
      status: "ready" as const,
    }));
  },

  // Delete a document
  async deleteDocument(documentId: string, agentId: string): Promise<void> {
    const response = await axios.get("/api/delete-document", {
      params: { agentId: agentId, documentId: documentId },
    });
    if (response.status !== 200) {
      if (response.status === 404) {
        throw new Error("Document not found");
      }
      throw new Error(`Failed to delete document: ${response.status}`);
    }
  },
};
