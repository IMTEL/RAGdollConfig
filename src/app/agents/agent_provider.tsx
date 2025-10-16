import { createContext, ReactNode, useContext, useReducer, useEffect, useState } from "react";
import { AgentUIState, agentsClient, DocumentMetadata, Role } from "./agent_data";

type AgentAction =
  | { type: 'SET_AGENTS'; payload: (prev: AgentUIState[]) => AgentUIState[] }
  | { type: 'SET_AGENT'; payload: { agentId: string; update: (prev: AgentUIState) => AgentUIState } }
  | { type: 'SET_DOCUMENTS'; payload: { agentId: string; update: (prev: DocumentMetadata[]) => DocumentMetadata[] } }
  | { type: 'SET_ROLES'; payload: { agentId: string; update: (prev: Role[]) => Role[] } }
  | { type: 'SET_ROLE'; payload: { agentId: string; roleId: string; update: ( prev: Role) => Role } };


function agentReducer(state: AgentUIState[], action: AgentAction): AgentUIState[] {
  switch (action.type) {
    case 'SET_AGENTS':
      return action.payload(state);
    case 'SET_AGENT':
      return state.map(agent => agent.id === action.payload.agentId ? action.payload.update(agent) : agent);
    case 'SET_DOCUMENTS':
        return state.map(agent => {
            if (agent.id === action.payload.agentId) {
                return { ...agent, documents: action.payload.update(agent.documents || []) } as AgentUIState;
            }
            return agent;
        });
    case 'SET_ROLES':
        return state.map(agent => {
            if (agent.id === action.payload.agentId) {
                return { ...agent, roles: action.payload.update((agent as any).roles || []) } as AgentUIState;
            }
            return agent;
        });
    case 'SET_ROLE':
        return state.map(agent => {
            if (agent.id === action.payload.agentId) {
                const roles = (agent as any).roles || [];
                return { 
                    ...agent, 
                    roles: roles.map((role: Role) => role.id === action.payload.roleId ? action.payload.update(role) : role)
                } as AgentUIState;
            }
            return agent;
        });
    default:
      return state;

  }
}

const AgentContext = createContext<{
  state: AgentUIState[];
  dispatch: React.Dispatch<AgentAction>;
  isLoading: boolean;
} | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(agentReducer, []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    agentsClient.getAll().then(databaseContent => {
        let agents = agentsClient.convertFromDB(databaseContent);
        dispatch({ type: 'SET_AGENTS', payload: () => agents });
        setIsLoading(false);
    }).catch(error => {
        console.error('Failed to load agents:', error);
        dispatch({ type: 'SET_AGENTS', payload: () => [] });
        setIsLoading(false);
    });
  }, []);

  return (
    <AgentContext.Provider value={{ state, dispatch, isLoading }}>
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
    setAgents: (update: (prev: AgentUIState[]) => AgentUIState[]) => {
      dispatch({ type: 'SET_AGENTS', payload: update });
    },
    setAgent: (agentId: string, update: (prev: AgentUIState) => AgentUIState) => {
      dispatch({ type: 'SET_AGENT', payload: { agentId, update } });
    },
    setDocuments: (agentId: string, update: (prev: DocumentMetadata[]) => DocumentMetadata[]) => {
      dispatch({ type: 'SET_DOCUMENTS', payload: { agentId, update } });
    },
    setRoles: (agentId: string, update: (prev: Role[]) => Role[]) => {
      dispatch({ type: 'SET_ROLES', payload: { agentId, update } });
    },
    setRole: (agentId: string, roleId: string, update: (prev: Role) => Role) => {
      dispatch({ type: 'SET_ROLE', payload: { agentId, roleId, update } });
    },
  };
}