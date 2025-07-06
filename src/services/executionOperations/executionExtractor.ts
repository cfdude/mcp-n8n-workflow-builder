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
      return {
        nodeName: 'Execution',
        errorMessage: error.message || 'Unknown execution error',
        errorType: error.name,
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