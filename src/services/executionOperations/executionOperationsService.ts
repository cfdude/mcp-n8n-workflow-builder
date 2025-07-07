import { listExecutions, getExecution } from '../n8nApi';
import { extractExecutionError, formatExecutionError, ExecutionError } from './executionExtractor';
import { N8NApiWrapper } from '../n8nApiWrapper';
import logger from '../../utils/logger';

// Note: getWorkflowError function has been moved directly into the get_error tool implementation
// in index.ts to follow the exact specification requirements

/**
 * Gets detailed error information for a specific execution
 */
export async function getExecutionError(
  executionId: number,
  instanceSlug?: string
): Promise<ExecutionError | null> {
  try {
    logger.log(`Getting error details for execution ${executionId}`);
    
    const execution = await getExecution(executionId, true, instanceSlug);
    const errorDetails = extractExecutionError(execution);
    
    if (errorDetails) {
      logger.log(`Successfully extracted error details for execution ${executionId}`);
    } else {
      logger.log(`No error details found for execution ${executionId}`);
    }
    
    return errorDetails;
  } catch (error) {
    logger.error(`Failed to get execution error for ${executionId}`, error);
    throw new Error(`Failed to get execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the most recent execution for a workflow (summary only)
 */
export async function getLatestExecution(
  workflowId: string,
  instanceSlug?: string
): Promise<{ id: number; status: string; startedAt?: string; stoppedAt?: string } | null> {
  try {
    logger.log(`Getting latest execution for workflow ${workflowId}`);
    
    const executionsList = await listExecutions({
      workflowId,
      limit: 1
    }, instanceSlug);
    
    if (!executionsList.data || executionsList.data.length === 0) {
      return null;
    }
    
    const latest = executionsList.data[0];
    return {
      id: latest.id,
      status: latest.status || 'unknown',
      startedAt: latest.startedAt,
      stoppedAt: latest.stoppedAt
    };
  } catch (error) {
    logger.error(`Failed to get latest execution for workflow ${workflowId}`, error);
    throw new Error(`Failed to get latest execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}