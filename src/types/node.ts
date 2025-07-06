// Re-export official n8n node types for convenience
export type { 
  INode as WorkflowNode,
  INodeParameters,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription
} from 'n8n-workflow';

// Import enum as value for runtime usage
export { NodeConnectionType } from 'n8n-workflow';

// Import node constants
export {
  MANUAL_TRIGGER_NODE_TYPE,
  HTTP_REQUEST_NODE_TYPE,
  WEBHOOK_NODE_TYPE,
  CODE_NODE_TYPE,
  STICKY_NODE_TYPE,
  ERROR_TRIGGER_NODE_TYPE,
  START_NODE_TYPE,
  EXECUTE_WORKFLOW_TRIGGER_NODE_TYPE,
  FUNCTION_NODE_TYPE,
  MERGE_NODE_TYPE
} from 'n8n-workflow';
