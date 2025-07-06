import { getWorkflow, updateWorkflow as updateWorkflowApi } from '../n8nApi';
import { extractNodeSummaries, extractNodes, ExtractedNode, NodeSummary } from './nodeExtractor';
import { mergeNodeUpdates, validateWorkflowIntegrity, NodeUpdate } from './nodeMerger';
import logger from '../../utils/logger';
import { WorkflowInput } from '../../types/workflow';

/**
 * Gets a list of all node names and IDs in a workflow
 */
export async function getNodeNames(
  workflowId: string,
  instanceSlug?: string
): Promise<NodeSummary[]> {
  try {
    logger.log(`Getting node names for workflow ${workflowId}`);
    
    // Fetch the workflow
    const workflow = await getWorkflow(workflowId, instanceSlug);
    
    // Extract node summaries
    const nodeSummaries = extractNodeSummaries(workflow);
    
    logger.log(`Found ${nodeSummaries.length} nodes in workflow ${workflowId}`);
    return nodeSummaries;
  } catch (error) {
    logger.error(`Failed to get node names for workflow ${workflowId}`, error);
    throw new Error(`Failed to get node names: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets specific node(s) from a workflow
 */
export async function getNode(
  workflowId: string,
  nodeIds: string | string[],
  instanceSlug?: string
): Promise<ExtractedNode[]> {
  try {
    const nodeIdArray = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
    logger.log(`Getting nodes [${nodeIdArray.join(', ')}] from workflow ${workflowId}`);
    
    // Fetch the workflow
    const workflow = await getWorkflow(workflowId, instanceSlug);
    
    // Extract the requested nodes
    const extractedNodes = extractNodes(workflow, nodeIds);
    
    if (extractedNodes.length === 0) {
      throw new Error(`No nodes found with IDs: ${nodeIdArray.join(', ')}`);
    }
    
    logger.log(`Successfully extracted ${extractedNodes.length} nodes`);
    return extractedNodes;
  } catch (error) {
    logger.error(`Failed to get nodes from workflow ${workflowId}`, error);
    throw new Error(`Failed to get nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Updates specific node(s) in a workflow
 */
export async function updateNode(
  workflowId: string,
  updates: NodeUpdate | NodeUpdate[],
  instanceSlug?: string
): Promise<{
  success: boolean;
  updatedNodeIds: string[];
  errors: string[];
}> {
  try {
    const updateArray = Array.isArray(updates) ? updates : [updates];
    logger.log(`Updating ${updateArray.length} nodes in workflow ${workflowId}`);
    
    // Fetch the current workflow
    const workflow = await getWorkflow(workflowId, instanceSlug);
    
    // Merge the node updates
    const mergeResult = mergeNodeUpdates(workflow, updates);
    
    if (!mergeResult.success || !mergeResult.updatedWorkflow) {
      return {
        success: false,
        updatedNodeIds: mergeResult.updatedNodeIds,
        errors: mergeResult.errors
      };
    }
    
    // Validate workflow integrity
    const validation = validateWorkflowIntegrity(mergeResult.updatedWorkflow);
    if (!validation.valid) {
      return {
        success: false,
        updatedNodeIds: [],
        errors: validation.warnings
      };
    }
    
    // Prepare the update payload
    const updatePayload: WorkflowInput = {
      name: mergeResult.updatedWorkflow.name,
      nodes: mergeResult.updatedWorkflow.nodes,
      connections: [], // Will be transformed from the workflow connections
      settings: (mergeResult.updatedWorkflow as any).settings,
      active: mergeResult.updatedWorkflow.active
    };
    
    // Transform connections to array format for the update API
    if (mergeResult.updatedWorkflow.connections) {
      for (const [sourceId, connectionData] of Object.entries(mergeResult.updatedWorkflow.connections)) {
        const typedConnectionData = connectionData as any;
        if (typedConnectionData?.main) {
          typedConnectionData.main.forEach((outputs: any, outputIndex: number) => {
            if (Array.isArray(outputs)) {
              outputs.forEach((connection) => {
                if (connection?.node) {
                  updatePayload.connections.push({
                    source: sourceId,
                    target: connection.node,
                    sourceOutput: outputIndex,
                    targetInput: connection.index || 0
                  });
                }
              });
            }
          });
        }
      }
    }
    
    // Update the workflow
    await updateWorkflowApi(workflowId, updatePayload, instanceSlug);
    
    logger.log(`Successfully updated ${mergeResult.updatedNodeIds.length} nodes in workflow ${workflowId}`);
    
    return {
      success: true,
      updatedNodeIds: mergeResult.updatedNodeIds,
      errors: mergeResult.errors
    };
  } catch (error) {
    logger.error(`Failed to update nodes in workflow ${workflowId}`, error);
    throw new Error(`Failed to update nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch get multiple nodes from potentially different workflows
 */
export async function batchGetNodes(
  requests: Array<{ workflowId: string; nodeIds: string | string[] }>,
  instanceSlug?: string
): Promise<Map<string, ExtractedNode[]>> {
  const results = new Map<string, ExtractedNode[]>();
  
  // Process requests in parallel for efficiency
  const promises = requests.map(async (request) => {
    try {
      const nodes = await getNode(request.workflowId, request.nodeIds, instanceSlug);
      return { workflowId: request.workflowId, nodes };
    } catch (error) {
      logger.error(`Failed to get nodes from workflow ${request.workflowId}`, error);
      return { workflowId: request.workflowId, nodes: [] };
    }
  });
  
  const batchResults = await Promise.all(promises);
  
  for (const result of batchResults) {
    results.set(result.workflowId, result.nodes);
  }
  
  return results;
}

/**
 * Batch update nodes across potentially different workflows
 */
export async function batchUpdateNodes(
  requests: Array<{ workflowId: string; updates: NodeUpdate | NodeUpdate[] }>,
  instanceSlug?: string
): Promise<Map<string, { success: boolean; updatedNodeIds: string[]; errors: string[] }>> {
  const results = new Map<string, { success: boolean; updatedNodeIds: string[]; errors: string[] }>();
  
  // Process updates sequentially to avoid conflicts
  for (const request of requests) {
    try {
      const result = await updateNode(request.workflowId, request.updates, instanceSlug);
      results.set(request.workflowId, result);
    } catch (error) {
      logger.error(`Failed to update nodes in workflow ${request.workflowId}`, error);
      results.set(request.workflowId, {
        success: false,
        updatedNodeIds: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }
  
  return results;
}