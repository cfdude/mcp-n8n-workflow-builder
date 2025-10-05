import { EnvironmentManager } from './environmentManager';
import logger from '../utils/logger';

/**
 * Credential interface based on n8n API v1
 */
export interface Credential {
  id?: string;
  name: string;
  type: string;
  data: Record<string, any>;
  nodesAccess?: Array<{
    nodeType: string;
    date?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Credential schema interface
 */
export interface CredentialSchema {
  type: string;
  displayName: string;
  properties: Array<{
    displayName: string;
    name: string;
    type: string;
    default?: any;
    required?: boolean;
    description?: string;
  }>;
}

/**
 * Paginated credentials response
 */
export interface CredentialsListResponse {
  data: Credential[];
  nextCursor?: string;
}

/**
 * Service for managing n8n credentials operations
 */
export class CredentialOperations {
  private envManager: EnvironmentManager;

  constructor() {
    this.envManager = EnvironmentManager.getInstance();
  }

  /**
   * List all credentials with pagination support
   */
  async listCredentials(
    options: { limit?: number; cursor?: string } = {},
    instanceSlug?: string
  ): Promise<CredentialsListResponse> {
    const api = this.envManager.getApiInstance(instanceSlug);

    try {
      logger.log('Listing credentials');
      const response = await api.get('/credentials', { params: options });
      logger.log(`Retrieved ${response.data.data?.length || 0} credentials`);

      return {
        data: response.data.data || response.data,
        nextCursor: response.data.nextCursor
      };
    } catch (error: any) {
      logger.error(`Failed to list credentials: ${error.message}`);
      throw new Error(`Failed to list credentials: ${error.message}`);
    }
  }

  /**
   * Get a specific credential by ID
   */
  async getCredential(id: string, instanceSlug?: string): Promise<Credential> {
    const api = this.envManager.getApiInstance(instanceSlug);

    try {
      logger.log(`Getting credential with ID: ${id}`);
      const response = await api.get(`/credentials/${id}`);
      logger.log(`Retrieved credential: ${response.data.name}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get credential ${id}: ${error.message}`);
      throw new Error(`Failed to get credential ${id}: ${error.message}`);
    }
  }

  /**
   * Create a new credential
   */
  async createCredential(
    credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>,
    instanceSlug?: string
  ): Promise<Credential> {
    const api = this.envManager.getApiInstance(instanceSlug);

    try {
      logger.log(`Creating credential: ${credential.name}`);
      const response = await api.post('/credentials', credential);
      logger.log(`Created credential with ID: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to create credential ${credential.name}: ${error.message}`);
      throw new Error(`Failed to create credential ${credential.name}: ${error.message}`);
    }
  }

  /**
   * Update an existing credential
   */
  async updateCredential(
    id: string,
    credential: Partial<Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>>,
    instanceSlug?: string
  ): Promise<Credential> {
    const api = this.envManager.getApiInstance(instanceSlug);

    try {
      logger.log(`Updating credential with ID: ${id}`);
      const response = await api.put(`/credentials/${id}`, credential);
      logger.log(`Updated credential: ${response.data.name}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to update credential ${id}: ${error.message}`);
      throw new Error(`Failed to update credential ${id}: ${error.message}`);
    }
  }

  /**
   * Delete a credential
   */
  async deleteCredential(id: string, instanceSlug?: string): Promise<{ success: boolean }> {
    const api = this.envManager.getApiInstance(instanceSlug);

    try {
      logger.log(`Deleting credential with ID: ${id}`);
      await api.delete(`/credentials/${id}`);
      logger.log(`Deleted credential: ${id}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Failed to delete credential ${id}: ${error.message}`);
      throw new Error(`Failed to delete credential ${id}: ${error.message}`);
    }
  }

  /**
   * Get credential schema for a specific type
   */
  async getCredentialSchema(
    credentialType: string,
    instanceSlug?: string
  ): Promise<CredentialSchema> {
    const api = this.envManager.getApiInstance(instanceSlug);

    try {
      logger.log(`Getting credential schema for type: ${credentialType}`);
      const response = await api.get(`/credentials/schema/${credentialType}`);
      logger.log(`Retrieved schema for: ${credentialType}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get credential schema for ${credentialType}: ${error.message}`);
      throw new Error(`Failed to get credential schema for ${credentialType}: ${error.message}`);
    }
  }
}
