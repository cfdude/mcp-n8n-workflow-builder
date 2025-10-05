export interface N8NInstance {
  n8n_host: string;
  n8n_api_key: string;
  description?: string;
  workflows?: string[]; // Optional: list of workflow IDs this instance supports
}

export interface WorkflowMapping {
  instance: string; // which instance to use for this workflow
  name?: string;
  tags?: string[];
}

export interface EnhancedMultiInstanceConfig {
  instances: Record<string, N8NInstance>;
  defaultInstance: string;
  workflows?: Record<string, WorkflowMapping>; // Optional workflow-to-instance mappings
}

// Legacy configuration interfaces for backward compatibility
export interface MultiInstanceConfig {
  environments: Record<string, N8NInstance>;
  defaultEnv: string;
}

export interface Config {
  // For backward compatibility - single instance
  n8n_host?: string;
  n8n_api_key?: string;
  
  // For legacy multi-instance support
  environments?: Record<string, N8NInstance>;
  defaultEnv?: string;
  
  // For enhanced multi-instance support
  instances?: Record<string, N8NInstance>;
  defaultInstance?: string;
  workflows?: Record<string, WorkflowMapping>;
}

// Base arguments interface for tools that support instance selection
export interface BaseToolArgs {
  instance?: string; // Optional: specify which instance to use
}