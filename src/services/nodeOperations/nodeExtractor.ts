import { WorkflowNode } from '../../types/workflow';
import { N8NWorkflowResponse } from '../../types/api';
import logger from '../../utils/logger';

export interface NodeSummary {
  id: string;
  name: string;
  type: string;
  disabled?: boolean;
  position?: [number, number];
}

export interface ExtractedNode extends WorkflowNode {
  connections?: {
    inputs: Array<{ nodeId: string; nodeName: string }>;
    outputs: Array<{ nodeId: string; nodeName: string }>;
  };
}

/**
 * Extracts lightweight node metadata from a workflow
 */
export function extractNodeSummaries(workflow: N8NWorkflowResponse): NodeSummary[] {
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    logger.warn('No nodes found in workflow');
    return [];
  }

  return workflow.nodes.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type,
    disabled: node.disabled || false,
    position: node.position
  }));
}

/**
 * Extracts specific nodes by ID(s) from a workflow
 */
export function extractNodes(
  workflow: N8NWorkflowResponse, 
  nodeIds: string | string[]
): ExtractedNode[] {
  const targetIds = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
  const extractedNodes: ExtractedNode[] = [];

  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    logger.warn('No nodes found in workflow');
    return [];
  }

  for (const nodeId of targetIds) {
    const node = workflow.nodes.find(n => n.id === nodeId);
    
    if (!node) {
      logger.warn(`Node with ID ${nodeId} not found in workflow`);
      continue;
    }

    // Create a deep copy of the node
    const extractedNode: ExtractedNode = JSON.parse(JSON.stringify(node));

    // Add connection information for context
    extractedNode.connections = {
      inputs: [],
      outputs: []
    };

    // Find inputs (nodes that connect TO this node)
    if (workflow.connections) {
      for (const [sourceNodeId, connectionData] of Object.entries(workflow.connections)) {
        const typedConnectionData = connectionData as any;
        if (typedConnectionData?.main) {
          for (const outputs of typedConnectionData.main) {
            if (Array.isArray(outputs)) {
              for (const connection of outputs) {
                if (connection?.node === nodeId) {
                  const sourceNode = workflow.nodes.find(n => n.id === sourceNodeId);
                  if (sourceNode) {
                    extractedNode.connections.inputs.push({
                      nodeId: sourceNodeId,
                      nodeName: sourceNode.name
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    // Find outputs (nodes that this node connects TO)
    const nodeConnections = workflow.connections?.[nodeId] as any;
    if (nodeConnections?.main) {
      for (const outputs of nodeConnections.main) {
        if (Array.isArray(outputs)) {
          for (const connection of outputs) {
            if (connection?.node) {
              const targetNode = workflow.nodes.find(n => n.id === connection.node);
              if (targetNode) {
                extractedNode.connections.outputs.push({
                  nodeId: connection.node,
                  nodeName: targetNode.name
                });
              }
            }
          }
        }
      }
    }

    extractedNodes.push(extractedNode);
  }

  return extractedNodes;
}

/**
 * Validates that a node update is safe to perform
 */
export function validateNodeUpdate(
  originalNode: WorkflowNode,
  updatedNode: Partial<WorkflowNode>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Can't change node ID
  if ('id' in updatedNode && updatedNode.id !== originalNode.id) {
    errors.push('Cannot change node ID');
  }

  // Validate type compatibility if type is being changed
  if ('type' in updatedNode && updatedNode.type !== originalNode.type) {
    // Could add more sophisticated type compatibility checks here
    logger.warn(`Changing node type from ${originalNode.type} to ${updatedNode.type}`);
  }

  // Validate position is an array of two numbers
  if ('position' in updatedNode && updatedNode.position) {
    if (!Array.isArray(updatedNode.position) || 
        updatedNode.position.length !== 2 ||
        !updatedNode.position.every(p => typeof p === 'number')) {
      errors.push('Position must be an array of two numbers');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}