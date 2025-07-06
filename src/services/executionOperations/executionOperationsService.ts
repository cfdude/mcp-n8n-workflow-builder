import { listExecutions, getExecution } from '../n8nApi';
import { extractExecutionError, formatExecutionError, ExecutionError } from './executionExtractor';
import logger from '../../utils/logger';

/**
 * Gets error details for the most recent execution of a workflow
 */
export async function getWorkflowError(
  workflowId: string,
  instanceSlug?: string
): Promise<string> {
  try {
    logger.log(`Getting error details for workflow ${workflowId}`);
    
    // Get the most recent execution for this workflow
    const executionsList = await listExecutions({
      workflowId,
      limit: 1,
      // order and orderBy defaults are already set in listExecutions
    }, instanceSlug);
    
    if (!executionsList.data || executionsList.data.length === 0) {
      return `No executions found for workflow ${workflowId}`;
    }
    
    const latestExecution = executionsList.data[0];
    logger.log(`Found latest execution ${latestExecution.id} with status: ${latestExecution.status}`);
    
    // If the execution was successful, return success message
    if (latestExecution.status === 'success') {
      return 'No errors found in the most current execution';
    }
    
    // If there was an error, get detailed execution data
    if (latestExecution.status === 'error') {
      const detailedExecution = await getExecution(
        latestExecution.id,
        true, // includeData = true to get error details
        instanceSlug
      );
      
      // Extract error information
      const errorDetails = extractExecutionError(detailedExecution);
      
      if (errorDetails) {
        const formattedError = formatExecutionError(errorDetails);
        logger.log(`Extracted error details: ${formattedError}`);
        return formattedError;
      } else {
        return `Execution ${latestExecution.id} failed but no specific error details could be extracted`;
      }
    }
    
    // Handle other statuses (waiting, etc.)
    return `Latest execution ${latestExecution.id} has status: ${latestExecution.status}`;
    
  } catch (error) {
    logger.error(`Failed to get workflow error for ${workflowId}`, error);
    throw new Error(`Failed to get workflow error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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