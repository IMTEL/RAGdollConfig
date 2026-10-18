import axios from "axios";

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
  // Provider keys. The API never returns a key, so these hold only what the
  // user entered in this session: a pasted key (llmApiKey) or a stored key
  // picked by id (llmApiKeyId). Both empty on save keeps the stored key.
  llmApiKey: string | null;
  embeddingApiKey: string | null;
  llmApiKeyId: string | null;
  embeddingApiKeyId: string | null;
  // Read-only state from the backend.
  hasLlmApiKey: boolean;
  hasEmbeddingApiKey: boolean;
  llmApiKeyInvalid: boolean;
  embeddingApiKeyInvalid: boolean;
  status: "active" | "inactive";
  enableMemory: boolean;
  enableWebSearch: boolean;
  responseFormat: "text" | "structured";
  documents: DocumentMetadata[] | null; // null means not loaded yet
  roles: Role[];
  functions: AgentFunction[];
  lastUpdated: string;
  uploaded: boolean; // whether the agent has been uploaded to the backend
  // RAG retrieval parameters
  topK: number;
  similarityThreshold: number;
  hybridSearchAlpha: number;
  contextAwareRetrieval: boolean;
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
    llmApiKeyId: null,
    embeddingApiKeyId: null,
    hasLlmApiKey: false,
    hasEmbeddingApiKey: false,
    llmApiKeyInvalid: false,
    embeddingApiKeyInvalid: false,
    status: "active",
    enableMemory: false,
    enableWebSearch: false,
    responseFormat: "text",
    documents: null,
    roles: [],
    functions: [],
    lastUpdated: "unknown",
    uploaded: false,
    topK: 5,
    similarityThreshold: 0.5,
    hybridSearchAlpha: 0.75,
    contextAwareRetrieval: true,
  };
}

export interface Role {
  id: string;
  name: string;
  prompt: string;
  documentAccess: string[]; // Array of document IDs
  functionAccess: string[];
}

export interface AgentFunction {
  id: string;
  name: string;
  requiredFields: FunctionField[];
  callInstructions: string;
  explanation?: string;
  exampleOutput?: string;
}

export interface FunctionField {
  id: string;
  name: string;
  type: string;
  arrayItemType?: string;
}

export interface LLM {
  provider: string;
  name: string;
  GDPR_compliant: boolean;
  description: string;
}

export interface AccessKeyPublic {
  id: string;
  name: string;
  prefix: string | null;
  expiry_date: string | null;
  created: string | null;
  last_use: string | null;
}

/** Response of access-key creation: the only time the plaintext key is sent. */
export interface AccessKeyCreated extends AccessKeyPublic {
  key: string;
}

/** Agent as returned by the backend (AgentPublic): never contains a secret. */
interface DatabaseAgent {
  id: string; // optional for creation
  name: string;
  description: string;
  prompt: string;
  llm_provider: string;
  llm_model: string; // TODO: Change to LLM model
  llm_temperature: number;
  llm_max_tokens: number;
  access_key?: AccessKeyPublic[]; // managed by backend access-key endpoints
  retrieval_method?: string;
  embedding_model?: string; // optional for now
  llm_api_key_id?: string | null;
  embedding_api_key_id?: string | null;
  has_llm_api_key?: boolean;
  has_embedding_api_key?: boolean;
  llm_api_key_invalid?: boolean;
  embedding_api_key_invalid?: boolean;
  status?: "active" | "inactive";
  response_format: "text" | "structured";
  enableMemory: boolean; // not in backend
  enableWebSearch: boolean; // not in backend and also we wont do this low key
  last_updated?: string;
  roles: DatabaseRole[];
  functions?: DatabaseAgentFunction[];
  // RAG retrieval parameters
  top_k?: number;
  similarity_threshold?: number;
  hybrid_search_alpha?: number;
  context_aware_retrieval?: boolean;
}

/** Body for agent create/update: may carry a pasted provider key. */
type AgentWriteBody = Omit<
  DatabaseAgent,
  | "access_key"
  | "has_llm_api_key"
  | "has_embedding_api_key"
  | "llm_api_key_invalid"
  | "embedding_api_key_invalid"
> & {
  llm_api_key: string;
  embedding_api_key: string;
};

interface DatabaseRole {
  name: string;
  description: string;
  document_access: string[];
  function_access?: string[];
}

interface DatabaseAgentFunction {
  name: string;
  required_fields: DatabaseFunctionField[];
  call_instructions: string;
  explanation?: string | null;
  example_output?: string | null;
}

type DatabaseFunctionField =
  | string
  | { name: string; type?: string | null; array_item_type?: string | null };

function normalizeFunctionField(
  field: DatabaseFunctionField,
  index: number
): FunctionField {
  if (typeof field === "string") {
    return {
      id: `field-${index + 1}`,
      name: field,
      type: "string",
    };
  }

  return {
    id: `field-${index + 1}`,
    name: field.name,
    type: field.type || "string",
    arrayItemType: field.array_item_type || "",
  };
}

interface BackendDocument {
  id: string | null;
  name: string;
  size?: string | null;
  created_at?: string | null;
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
          llmApiKey: null,
          embeddingApiKey: null,
          llmApiKeyId: agent.llm_api_key_id ?? null,
          embeddingApiKeyId: agent.embedding_api_key_id ?? null,
          hasLlmApiKey: agent.has_llm_api_key ?? false,
          hasEmbeddingApiKey: agent.has_embedding_api_key ?? false,
          llmApiKeyInvalid: agent.llm_api_key_invalid ?? false,
          embeddingApiKeyInvalid: agent.embedding_api_key_invalid ?? false,
          responseFormat: agent.response_format,
          documents: null,
          roles: agent.roles.map((role, index) => ({
            id: `role-${index + 1}`,
            name: role.name,
            prompt: role.description,
            documentAccess: role.document_access,
            functionAccess: role.function_access ?? [],
          })),
          functions: (agent.functions ?? []).map((functionConfig, index) => ({
            id: `function-${index + 1}`,
            name: functionConfig.name,
            requiredFields: (functionConfig.required_fields ?? []).map(
              normalizeFunctionField
            ),
            callInstructions: functionConfig.call_instructions ?? "",
            explanation: functionConfig.explanation ?? "",
            exampleOutput: functionConfig.example_output ?? "",
          })),
          lastUpdated: agent.last_updated || "unknown",
          uploaded: true,
          topK: agent.top_k ?? 5,
          similarityThreshold: agent.similarity_threshold ?? 0.5,
          hybridSearchAlpha: agent.hybrid_search_alpha ?? 0.75,
          contextAwareRetrieval: agent.context_aware_retrieval ?? true,
        }) as AgentUIState
    );
  },

  convertToDB(agents: AgentUIState[]): AgentWriteBody[] {
    return agents.map((agent) => {
      const llmApiKey = agent.llmApiKey?.trim();
      const embeddingApiKey = agent.embeddingApiKey?.trim();

      if (!llmApiKey && !agent.llmApiKeyId && !agent.databaseId) {
        throw new Error("LLM API key is required when saving an agent");
      }

      if (!embeddingApiKey && !agent.embeddingApiKeyId && !agent.databaseId) {
        throw new Error("Embedding API key is required when saving an agent");
      }

      if (!agent.model && !agent.databaseId) {
        throw new Error("Language model is required when creating an agent");
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
          function_access: role.functionAccess ?? [],
        })),
        functions: agent.functions.map((functionConfig) => ({
          name: functionConfig.name,
          required_fields: functionConfig.requiredFields.map((field) => ({
            name: field.name,
            type: field.type,
            ...(field.arrayItemType
              ? { array_item_type: field.arrayItemType }
              : {}),
          })),
          call_instructions: functionConfig.callInstructions,
          explanation: functionConfig.explanation || null,
          example_output: functionConfig.exampleOutput || null,
        })),
        llm_provider: agent.model?.provider ?? "",
        llm_model: agent.model?.name ?? "",
        llm_temperature: agent.temperature,
        llm_max_tokens: agent.maxTokens,
        // A pasted key wins over a stored-key id; an empty key and no id
        // keeps whatever the backend has stored.
        llm_api_key: llmApiKey ?? "",
        embedding_api_key: embeddingApiKey ?? "",
        llm_api_key_id: llmApiKey ? null : agent.llmApiKeyId,
        embedding_api_key_id: embeddingApiKey ? null : agent.embeddingApiKeyId,
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
        context_aware_retrieval: agent.contextAwareRetrieval,
      } as AgentWriteBody;
    });
  },

  async createNewAgent(
    name: string,
    description: string,
    embedding: string,
    model?: LLM | null,
    llmApiKeyId?: string | null,
    embeddingApiKeyId?: string | null
  ): Promise<AgentUIState> {
    const agent = defaultAgent();
    agent.name = name;
    agent.description = description;
    agent.embeddingModel = embedding;
    agent.model = model || null;
    agent.llmApiKeyId = llmApiKeyId ?? null;
    agent.embeddingApiKeyId = embeddingApiKeyId ?? null;
    // Create a default role with the same name as the agent
    agent.roles = [
      {
        id: Date.now().toString(),
        name: name,
        prompt: "",
        documentAccess: [],
        functionAccess: [],
      },
    ];
    return this.updateAgent(agent);
  },

  async updateAgent(agent: AgentUIState): Promise<AgentUIState> {
    const response = await fetch("/api/set-agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this.convertToDB([agent])[0]),
    });
    if (!response.ok) {
      // e.g. 403 when a collaborator picks a stored key: only the owner may.
      const body = await response.json().catch(() => null);
      const detail =
        typeof body?.detail === "string" ? `: ${body.detail}` : "";
      throw new Error(`Failed to save agent (${response.status})${detail}`);
    }
    return await this.convertFromDB([await response.json()])[0];
  },
  // Get an agent by ID
  async getAgentById(agentId: string): Promise<AgentUIState> {
    const response = await fetch(`/api/fetch-agent?agent_id=${agentId}`, {
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
      params: { agentId },
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
    return data.documents.map((doc: BackendDocument) => ({
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
      params: { documentId, agentId },
    });
    if (response.status !== 200) {
      if (response.status === 404) {
        throw new Error("Document not found");
      }
      throw new Error(`Failed to delete document: ${response.status}`);
    }
  },
};
