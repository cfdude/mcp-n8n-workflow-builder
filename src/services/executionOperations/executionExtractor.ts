import { N8NExecutionResponse } from '../../types/api';
import { ExecutionData, NodeExecutionData } from '../../types/execution';
import logger from '../../utils/logger';

export interface ExecutionError {
  nodeId?: string;
  nodeName: string;
  errorMessage: string;
  errorType?: string;
  lineNumber?: number;
  stackTrace?: string;
}

export interface NodeDataContext {
  errorNode: string;
  dataDepth: number;
  nodeExecutionOrder: string[];
  nodeData: Array<{
    nodeName: string;
    position: number;
    distanceFromError: number;
    runData: any;
  }>;
}

/**
 * Extracts compact error information from an execution response
 */
export function extractExecutionError(execution: N8NExecutionResponse): ExecutionError | null {
  try {
    if (!execution.data) {
      return null;
    }

    const executionData = execution.data as ExecutionData;
    
    // Check for top-level execution error
    if (executionData.resultData?.error) {
      const error = executionData.resultData.error;
      // Try to get the actual node name from lastNodeExecuted
      const actualNodeName = executionData.resultData.lastNodeExecuted || 'Execution';
      return {
        nodeName: actualNodeName,
        errorMessage: error.message || 'Unknown execution error',
        errorType: (error as any).name,
        stackTrace: error.stack,
        lineNumber: extractLineNumber(error.message || error.stack)
      };
    }

    // Check for node-specific errors in runData
    if (executionData.resultData?.runData) {
      for (const [nodeName, nodeExecutions] of Object.entries(executionData.resultData.runData)) {
        if (Array.isArray(nodeExecutions) && nodeExecutions.length > 0) {
          const nodeExecution = nodeExecutions[0] as NodeExecutionData;
          
          if (nodeExecution.error) {
            return {
              nodeId: nodeExecution.name, // n8n might store ID differently
              nodeName: nodeName,
              errorMessage: nodeExecution.error.message || 'Unknown node error',
              errorType: nodeExecution.error.name,
              stackTrace: nodeExecution.error.stack,
              lineNumber: extractLineNumber(nodeExecution.error.message || nodeExecution.error.stack)
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    logger.error('Failed to extract execution error details', error);
    return {
      nodeName: 'Error Extraction',
      errorMessage: `Failed to parse execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errorType: 'ParseError'
    };
  }
}

/**
 * Extracts line number from error message or stack trace
 */
function extractLineNumber(text?: string): number | undefined {
  if (!text) return undefined;
  
  // Look for patterns like "[line 14]" or "line 14" or ":14:"
  const linePatterns = [
    /\[line (\d+)\]/i,
    /line (\d+)/i,
    /:(\d+):/,
    /at line (\d+)/i
  ];
  
  for (const pattern of linePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const lineNum = parseInt(match[1], 10);
      if (!isNaN(lineNum)) {
        return lineNum;
      }
    }
  }
  
  return undefined;
}

/**
 * Validates execution error extraction result
 */
export function validateExecutionError(error: ExecutionError | null): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  if (!error) {
    return { valid: true, warnings };
  }
  
  if (!error.nodeName || error.nodeName.trim().length === 0) {
    warnings.push('Missing or empty node name');
  }
  
  if (!error.errorMessage || error.errorMessage.trim().length === 0) {
    warnings.push('Missing or empty error message');
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Formats execution error for compact display
 */
export function formatExecutionError(error: ExecutionError): string {
  const parts: string[] = [];
  
  // Node information
  if (error.nodeId && error.nodeId !== error.nodeName) {
    parts.push(`Node: ${error.nodeName} (${error.nodeId})`);
  } else {
    parts.push(`Node: ${error.nodeName}`);
  }
  
  // Error type
  if (error.errorType) {
    parts.push(`Type: ${error.errorType}`);
  }
  
  // Line number
  if (error.lineNumber) {
    parts.push(`Line: ${error.lineNumber}`);
  }
  
  // Error message
  parts.push(`Error: ${error.errorMessage}`);
  
  return parts.join(' | ');
}

/**
 * Extracts node data context for debugging
 */
export function extractNodeDataContext(
  execution: N8NExecutionResponse,
  errorNodeName: string,
  dataDepth: number
): NodeDataContext | null {
  try {
    if (!execution.data) {
      logger.debug('No execution data available');
      return null;
    }

    const executionData = execution.data as ExecutionData;
    logger.debug(`Extracting node data context for error node: ${errorNodeName}, depth: ${dataDepth}`);
    
    // Get node execution order
    let nodeOrder = executionData.executionData?.nodeExecutionOrder || [];
    if (nodeOrder.length === 0) {
      // Fallback: extract order from runData keys
      const runData = executionData.resultData?.runData || {};
      nodeOrder = Object.keys(runData);
      
      // If still no order, try to get from workflowData.nodes
      if (nodeOrder.length === 0 && executionData.workflowData?.nodes) {
        nodeOrder = executionData.workflowData.nodes.map((node: any) => node.name);
      }
    }
    
    logger.debug(`Node execution order: ${JSON.stringify(nodeOrder)}`);
    
    // Find the position of the error node
    let errorNodeIndex = nodeOrder.findIndex(node => node === errorNodeName);
    
    // If error node not found and it's "Execution", try lastNodeExecuted
    if (errorNodeIndex === -1 && errorNodeName === 'Execution') {
      const lastNode = executionData.resultData?.lastNodeExecuted;
      logger.debug(`Error node not found, trying lastNodeExecuted: ${lastNode}`);
      if (lastNode) {
        errorNodeIndex = nodeOrder.findIndex(node => node === lastNode);
        errorNodeName = lastNode;
      }
    }
    
    if (errorNodeIndex === -1) {
      logger.debug(`Could not find error node ${errorNodeName} in execution order`);
      return null;
    }
    
    // Calculate start index for data extraction
    const startIndex = Math.max(0, errorNodeIndex - dataDepth);
    const endIndex = errorNodeIndex; // Exclusive of error node
    
    // Extract node data
    const nodeData: NodeDataContext['nodeData'] = [];
    const runData = executionData.resultData?.runData || {};
    
    for (let i = startIndex; i < endIndex; i++) {
      const nodeName = nodeOrder[i];
      const nodeRunData = runData[nodeName];
      
      if (nodeRunData && Array.isArray(nodeRunData) && nodeRunData.length > 0) {
        // Extract the most recent run data for the node
        const latestRun = nodeRunData[nodeRunData.length - 1];
        
        nodeData.push({
          nodeName: nodeName,
          position: i + 1, // 1-indexed for user clarity
          distanceFromError: errorNodeIndex - i,
          runData: extractSafeRunData(latestRun)
        });
      }
    }
    
    return {
      errorNode: errorNodeName,
      dataDepth: dataDepth,
      nodeExecutionOrder: nodeOrder,
      nodeData: nodeData
    };
  } catch (error) {
    logger.error('Failed to extract node data context', error);
    return null;
  }
}

/**
 * Safely extracts run data, handling large datasets
 */
function extractSafeRunData(nodeExecution: any): any {
  try {
    // n8n stores execution data differently than our type suggests
    const safeData: any = {};
    
    // Extract timing data (n8n uses startedAt/stoppedAt as ISO strings)
    if (nodeExecution.startedAt) {
      safeData.startedAt = nodeExecution.startedAt;
    }
    if (nodeExecution.stoppedAt) {
      safeData.stoppedAt = nodeExecution.stoppedAt;
    }
    
    // Include execution status if available
    if (nodeExecution.executionStatus) {
      safeData.executionStatus = nodeExecution.executionStatus;
    }
    
    // Include output data - n8n stores this as data array
    if (nodeExecution.data) {
      // Check if data exists and has the expected structure
      if (nodeExecution.data.main && Array.isArray(nodeExecution.data.main)) {
        const dataString = JSON.stringify(nodeExecution.data);
        if (dataString.length < 50000) { // 50KB limit
          safeData.data = nodeExecution.data;
        } else {
          safeData.dataTruncated = true;
          safeData.dataSize = dataString.length;
          // Try to at least show the structure/count
          safeData.dataInfo = {
            mainBranches: nodeExecution.data.main.length,
            totalItems: nodeExecution.data.main.reduce((sum: number, branch: any[]) => 
              sum + (Array.isArray(branch) ? branch.length : 0), 0)
          };
        }
      }
    }
    
    // Include error if present
    if (nodeExecution.error) {
      safeData.error = nodeExecution.error;
    }
    
    // Include source data if available (shows input connections)
    if (nodeExecution.source) {
      safeData.source = nodeExecution.source;
    }
    
    return safeData;
  } catch (error) {
    return {
      error: 'Failed to extract run data',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}