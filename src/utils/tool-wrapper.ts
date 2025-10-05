/**
 * Tool wrapper utility for handling multi-instance n8n configuration
 * Eliminates duplication of instance resolution logic across all tools
 * Based on the Jira MCP server pattern
 */

import { AxiosInstance } from 'axios';
import { BaseToolArgs, N8NInstance, EnhancedMultiInstanceConfig } from '../types/config';
import { N8NApiWrapper } from '../services/n8nApiWrapper';

export interface N8NContext {
  apiWrapper: N8NApiWrapper;
  instanceConfig: N8NInstance;
  instanceName: string;
}

export interface ToolOptions {
  requiresWorkflowId?: boolean;
  extractWorkflowFromOperation?: boolean;
  defaultWorkflowId?: string;
}

/**
 * Extract workflow ID from various sources
 */
function extractWorkflowId(args: any, options: ToolOptions): string | undefined {
  // 1. Use explicit workflowId if provided
  if (args.workflowId || args.workflow_id || args.id) {
    return args.workflowId || args.workflow_id || args.id;
  }
  
  // 2. Extract from operation context if enabled
  if (options.extractWorkflowFromOperation && args.workflow) {
    return args.workflow;
  }
  
  // 3. Use default if provided
  if (options.defaultWorkflowId) {
    return options.defaultWorkflowId;
  }
  
  // 4. Return undefined if no workflow ID can be determined (for tools that don't require it)
  if (!options.requiresWorkflowId) {
    return undefined;
  }
  
  // 5. Require explicit workflow ID
  throw new Error(
    "Workflow ID is required. Either provide 'workflowId' or 'id' parameter for workflow-specific operations."
  );
}

/**
 * Get the appropriate instance configuration for a workflow or manual override
 */
async function getInstanceForWorkflow(
  config: EnhancedMultiInstanceConfig,
  workflowId?: string,
  instanceOverride?: string
): Promise<{ instance: N8NInstance; instanceName: string }> {
  
  // If instance is explicitly specified, use that
  if (instanceOverride) {
    console.error(`Using explicitly specified instance: ${instanceOverride} for workflow: ${workflowId || 'global'}`);
    const instance = config.instances[instanceOverride];
    if (!instance) {
      throw new Error(
        `Instance '${instanceOverride}' not found. Available instances: ${Object.keys(config.instances).join(", ")}`
      );
    }
    
    return {
      instance,
      instanceName: instanceOverride
    };
  }
  
  // Check if workflow is explicitly configured
  if (workflowId && config.workflows) {
    const workflowConfig = config.workflows[workflowId];
    if (workflowConfig) {
      console.error(`Found configured workflow ${workflowId} using instance: ${workflowConfig.instance}`);
      const instance = config.instances[workflowConfig.instance];
      if (!instance) {
        throw new Error(
          `Instance '${workflowConfig.instance}' configured for workflow '${workflowId}' not found`
        );
      }
      
      return {
        instance,
        instanceName: workflowConfig.instance
      };
    }
    
    // Try to auto-discover workflow in instances
    console.error(`Workflow ${workflowId} not explicitly configured. Attempting auto-discovery...`);
    
    for (const [instanceName, instanceConfig] of Object.entries(config.instances)) {
      if (instanceConfig.workflows && instanceConfig.workflows.includes(workflowId)) {
        console.error(`Auto-discovered workflow ${workflowId} in instance: ${instanceName}`);
        return {
          instance: instanceConfig,
          instanceName
        };
      }
    }
  }
  
  // Use default instance if available
  if (config.defaultInstance) {
    console.error(`Using default instance ${config.defaultInstance} for workflow: ${workflowId || 'global'}`);
    const instance = config.instances[config.defaultInstance];
    return {
      instance,
      instanceName: config.defaultInstance
    };
  }
  
  // If only one instance available, use it
  const instanceNames = Object.keys(config.instances);
  if (instanceNames.length === 1) {
    const instanceName = instanceNames[0];
    console.error(`Only one instance available. Using ${instanceName} for workflow: ${workflowId || 'global'}`);
    return {
      instance: config.instances[instanceName],
      instanceName
    };
  }
  
  // Unable to determine instance
  throw new Error(
    `Unable to determine n8n instance for workflow '${workflowId}'. ` +
    `Available instances: ${instanceNames.join(", ")}. ` +
    `Please configure the workflow in the config or specify an instance parameter.`
  );
}

/**
 * Wrapper function that handles all n8n instance resolution and provides clean context to tools
 */
export async function withN8NContext<TArgs extends BaseToolArgs, TResult>(
  args: TArgs,
  options: ToolOptions,
  handler: (toolArgs: Omit<TArgs, keyof BaseToolArgs>, context: N8NContext) => Promise<TResult>
): Promise<TResult> {
  const { instance, ...toolArgs } = args;
  
  console.error(`[Tool Wrapper] Processing tool with instance: ${instance || 'auto'}`);
  
  // Extract workflow ID using smart resolution
  const workflowId = extractWorkflowId(args, options);
  console.error(`[Tool Wrapper] Resolved workflow ID: ${workflowId || 'none'}`);
  
  // Get the enhanced configuration
  const apiWrapper = new N8NApiWrapper();
  const config = await apiWrapper.getEnhancedConfig();
  
  // Get the appropriate instance configuration
  const { instance: instanceConfig, instanceName } = await getInstanceForWorkflow(
    config,
    workflowId,
    instance
  );
  
  console.error(`[Tool Wrapper] Using instance: ${instanceName} (${instanceConfig.n8n_host}) for workflow: ${workflowId || 'global'}`);
  
  // Create context object with all necessary n8n resources
  const context: N8NContext = {
    apiWrapper,
    instanceConfig,
    instanceName
  };
  
  // Call the actual tool handler with clean context
  return handler(toolArgs as Omit<TArgs, keyof BaseToolArgs>, context);
}

/**
 * List available instances and their configurations
 */
export async function listAvailableInstances(): Promise<{
  instances: Array<{
    name: string;
    host: string;
    description?: string;
    configuredWorkflows: string[];
  }>;
  workflows: Array<{
    workflowId: string;
    instance: string;
    name?: string;
    tags?: string[];
  }>;
}> {
  const apiWrapper = new N8NApiWrapper();
  const config = await apiWrapper.getEnhancedConfig();
  
  const instances = Object.entries(config.instances).map(([name, instanceConfig]) => ({
    name,
    host: instanceConfig.n8n_host,
    description: instanceConfig.description,
    configuredWorkflows: instanceConfig.workflows || []
  }));
  
  const workflows = config.workflows 
    ? Object.entries(config.workflows).map(([workflowId, workflowConfig]) => ({
        workflowId,
        instance: workflowConfig.instance,
        name: workflowConfig.name,
        tags: workflowConfig.tags
      }))
    : [];
  
  return { instances, workflows };
}