import { LLM } from "@/components/agent-configuration/select-model";

const backend_api_url = process.env.BACKEND_API_URL|| "http://localhost:8000";

export interface Agent {
  id: string; // optional for creation
  name: string;
  description: string;
  prompt: string;
  corpa: string[];
  roles: Role[];
  llm_model: string;
  llm_temperature: number;
  llm_max_tokens: number;
  llm_api_key: string;
  access_key: string[]; // may change later
  retrieval_method?: string;
  embedding_model?: string; // optional for now
  status?: "active" | "inactive";
  response_format: "text" | "structured";
  lastUpdated?: string; // optional for tracking updates
  connectedCorpuses: string[]; // DEPRECATED
  enableMemory: boolean; // DEPRECATED
  enableWebSearch: boolean; // DEPRECATED
  model: LLM | null; // DEPRECATED, use llm_model instead but didn't want to break existing frontend
}


 
export interface Role {
  id: string;
  name: string;
  description: string;
  subset_of_corpa: number[];
  createdAt?: string;
}

export const agentsClient = {
  // Fetch all agents
  async getAll(): Promise<Agent[]> {
    const res = await fetch(`${backend_api_url}/agents`);
    if (!res.ok) {
      throw new Error("Failed to fetch agents");
    }
    
    const agents = await res.json();

    return agents.map((agent: any) => ({
      ...agent,
      status: agent.status || "inactive", // Default to inactive if status is missing
    }));
  }
};