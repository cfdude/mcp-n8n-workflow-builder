// Import official n8n types
import type { 
  INode, 
  IConnections, 
  IConnection,
  INodeParameters,
  IWorkflowSettings,
  NodeConnectionType 
} from 'n8n-workflow';

// Use official n8n interfaces
export type WorkflowNode = INode;
export type ConnectionItem = IConnection;
export type ConnectionMap = IConnections;
export type WorkflowSettings = IWorkflowSettings;

export interface WorkflowSpec {
  name: string;
  nodes: WorkflowNode[];
  connections: ConnectionMap;
  settings?: WorkflowSettings;
  tags?: string[];
}

// Temporary interface to support the old input format
export interface LegacyWorkflowConnection {
  source: string;
  target: string;
  sourceOutput?: number;
  targetInput?: number;
}

// Interface for simplified input data (backward compatibility)
export interface WorkflowInput {
  name?: string;
  nodes: {
    type: string;
    name: string;
    parameters?: INodeParameters;
    id?: string;
    position?: [number, number];
    typeVersion?: number;
    disabled?: boolean;
    notes?: string;
    continueOnFail?: boolean;
  }[];
  connections: LegacyWorkflowConnection[];
  active?: boolean;
  settings?: WorkflowSettings;
  tags?: string[];
}
