import { createContext, ReactNode, useContext, useReducer, useEffect } from "react";
import { Agent, agentsClient, CorpusDocument, initialState, Role } from "./agent_data";

// save state to localStorage to make it persistent across reloads
const STORAGE_KEY = 'ragdoll-agents';

const loadFromStorage = (): Agent[] => {
  if (typeof window === 'undefined') return initialState;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load agents from localStorage:', error);
  }
  return initialState;
};

const saveToStorage = (agents: Agent[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  } catch (error) {
    console.error('Failed to save agents to localStorage:', error);
  }
};

type AgentAction =
  | { type: 'SET_AGENTS'; payload: (prev: Agent[]) => Agent[] }
  | { type: 'SET_AGENT'; payload: (prev: Agent) => Agent } // updates the agent with the same id
  | { type: 'SET_DOCUMENTS'; payload: { agentId: string; update: (prev: CorpusDocument[]) => CorpusDocument[] } }
  | { type: 'SET_ROLES'; payload: { agentId: string; update: (prev: Role[]) => Role[] } }
  | { type: 'SET_ROLE'; payload: { agentId: string; update: (prev: Role) => Role } }; // updates the role with the same id within the specified agent


function agentReducer(state: Agent[], action: AgentAction): Agent[] {
  switch (action.type) {
    case 'SET_AGENTS':
      return action.payload(state);
    case 'SET_AGENT':
      return state.map(agent => action.payload(agent.id === action.payload(agent).id ? action.payload(agent) : agent));
    case 'SET_DOCUMENTS':
        return state.map(agent => {
            if (agent.id === action.payload.agentId) {
                return { ...agent, documents: action.payload.update(agent.documents) } as Agent;
            }
            return agent;
        });
    case 'SET_ROLES':
        return state.map(agent => {
            if (agent.id === action.payload.agentId) {
                return { ...agent, roles: action.payload.update((agent as any).roles || []) } as Agent;
            }
            return agent;
        });
    case 'SET_ROLE':
        return state.map(agent => {
            if (agent.id === action.payload.agentId) {
                const roles = (agent as any).roles || [];
                return { 
                    ...agent, 
                    roles: roles.map((role: Role) => role.id === action.payload.update(role).id ? action.payload.update(role) : role)
                } as Agent;
            }
            return agent;
        });
    default:
      return state;

  }
}

const AgentContext = createContext<{
  state: Agent[];
  dispatch: React.Dispatch<AgentAction>;
} | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(agentReducer, initialState);

  // Load from localStorage after hydration
  useEffect(() => {
    // const storedAgents = loadFromStorage();
    // if (storedAgents !== initialState) {
    //   dispatch({ type: 'SET_AGENTS', payload: () => storedAgents });
    // }

    agentsClient.getAll().then(databaseContent => {
        dispatch({ type: 'SET_AGENTS', payload: () => agentsClient.convertFromDB(databaseContent) });
    });
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  return (
    <AgentContext.Provider value={{ state, dispatch }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}

export function useAgentActions() {
  const { dispatch, state } = useAgents();

  return {
    setAgents: (update: (prev: Agent[]) => Agent[]) => {
      dispatch({ type: 'SET_AGENTS', payload: update });
    },
    setAgent: (update: (prev: Agent) => Agent) => {
      dispatch({ type: 'SET_AGENT', payload: update });
    },
    setDocuments: (agentId: string, update: (prev: CorpusDocument[]) => CorpusDocument[]) => {
      dispatch({ type: 'SET_DOCUMENTS', payload: { agentId, update } });
    },
    setRoles: (agentId: string, update: (prev: Role[]) => Role[]) => {
      dispatch({ type: 'SET_ROLES', payload: { agentId, update } });
    },
    setRole: (agentId: string, update: (prev: Role) => Role) => {
      dispatch({ type: 'SET_ROLE', payload: { agentId, update } });
    },
  };
}