import { WorkflowNode } from '../../types/workflow';
import { N8NWorkflowResponse } from '../../types/api';
import logger from '../../utils/logger';
import { validateNodeUpdate } from './nodeExtractor';

export interface NodeUpdate {
  nodeId: string;
  node: Partial<WorkflowNode>;
}

export interface MergeResult {
  success: boolean;
  updatedWorkflow?: N8NWorkflowResponse;
  errors: string[];
  updatedNodeIds: string[];
}

/**
 * Merges node updates into a workflow
 */
export function mergeNodeUpdates(
  workflow: N8NWorkflowResponse,
  updates: NodeUpdate | NodeUpdate[]
): MergeResult {
  const nodeUpdates = Array.isArray(updates) ? updates : [updates];
  const errors: string[] = [];
  const updatedNodeIds: string[] = [];

  // Create a deep copy of the workflow to avoid mutations
  const updatedWorkflow: N8NWorkflowResponse = JSON.parse(JSON.stringify(workflow));

  if (!updatedWorkflow.nodes || !Array.isArray(updatedWorkflow.nodes)) {
    return {
      success: false,
      errors: ['Workflow has no nodes array'],
      updatedNodeIds: []
    };
  }

  // Process each update
  for (const update of nodeUpdates) {
    const nodeIndex = updatedWorkflow.nodes.findIndex(n => n.id === update.nodeId);
    
    if (nodeIndex === -1) {
      errors.push(`Node with ID ${update.nodeId} not found in workflow`);
      continue;
    }

    const originalNode = updatedWorkflow.nodes[nodeIndex];
    
    // Validate the update
    const validation = validateNodeUpdate(originalNode, update.node);
    if (!validation.valid) {
      errors.push(...validation.errors.map(e => `Node ${update.nodeId}: ${e}`));
      continue;
    }

    // Perform a deep merge, preserving existing properties not in the update
    const mergedNode = mergeNodeProperties(originalNode, update.node);
    
    // Replace the node in the workflow
    updatedWorkflow.nodes[nodeIndex] = mergedNode;
    updatedNodeIds.push(update.nodeId);
    
    logger.log(`Successfully merged updates for node ${update.nodeId} (${originalNode.name})`);
  }

  // If there were errors but some updates succeeded, still return the partial update
  const success = errors.length === 0 || updatedNodeIds.length > 0;

  return {
    success,
    updatedWorkflow: success ? updatedWorkflow : undefined,
    errors,
    updatedNodeIds
  };
}

/**
 * Deep merges node properties, handling nested objects properly
 */
function mergeNodeProperties(
  original: WorkflowNode,
  updates: Partial<WorkflowNode>
): WorkflowNode {
  const merged = { ...original };

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      // Skip undefined values
      continue;
    }

    if (key === 'parameters' && typeof value === 'object' && value !== null) {
      // Special handling for parameters - deep merge
      merged.parameters = mergeParameters(original.parameters || {}, value);
    } else if (key === 'credentials' && typeof value === 'object' && value !== null) {
      // Special handling for credentials - replace entirely
      merged.credentials = value as any;
    } else {
      // For all other properties, replace the value
      (merged as any)[key] = value;
    }
  }

  return merged;
}

/**
 * Deep merges parameter objects
 */
function mergeParameters(
  original: Record<string, any>,
  updates: Record<string, any>
): Record<string, any> {
  const merged = { ...original };

  for (const [key, value] of Object.entries(updates)) {
    if (value === null) {
      // Explicitly setting to null removes the parameter
      delete merged[key];
    } else if (typeof value === 'object' && !Array.isArray(value) && 
               typeof original[key] === 'object' && !Array.isArray(original[key])) {
      // Both are objects, merge recursively
      merged[key] = mergeParameters(original[key], value);
    } else {
      // Replace the value (including arrays)
      merged[key] = value;
    }
  }

  return merged;
}

/**
 * Validates that the workflow structure remains valid after node updates
 */
export function validateWorkflowIntegrity(workflow: N8NWorkflowResponse): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!workflow.nodes || workflow.nodes.length === 0) {
    warnings.push('Workflow has no nodes');
    return { valid: false, warnings };
  }

  // Check for duplicate node IDs and build name/ID maps
  const nodeIds = new Set<string>();
  const nodeNames = new Set<string>();
  const nodeIdByName = new Map<string, string>();
  
  for (const node of workflow.nodes) {
    if (nodeIds.has(node.id)) {
      warnings.push(`Duplicate node ID found: ${node.id}`);
      return { valid: false, warnings };
    }
    if (nodeNames.has(node.name)) {
      warnings.push(`Duplicate node name found: ${node.name}`);
      return { valid: false, warnings };
    }
    nodeIds.add(node.id);
    nodeNames.add(node.name);
    nodeIdByName.set(node.name, node.id);
  }

  // Check that all connections reference existing nodes
  // n8n connections can use either node names or node IDs
  if (workflow.connections) {
    for (const [sourceRef, connectionData] of Object.entries(workflow.connections)) {
      // Check if sourceRef is a node ID or name
      const sourceExists = nodeIds.has(sourceRef) || nodeNames.has(sourceRef);
      if (!sourceExists) {
        warnings.push(`Connection from non-existent node: ${sourceRef}`);
      }

      const typedConnectionData = connectionData as any;
      if (typedConnectionData?.main) {
        for (const outputs of typedConnectionData.main) {
          if (Array.isArray(outputs)) {
            for (const connection of outputs) {
              if (connection?.node) {
                // Check if target is a node ID or name
                const targetExists = nodeIds.has(connection.node) || nodeNames.has(connection.node);
                if (!targetExists) {
                  warnings.push(`Connection to non-existent node: ${connection.node}`);
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}