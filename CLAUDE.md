# CLAUDE.md

MCP server for managing n8n workflows with multi-instance support.

## Commands
```bash
npm run build    # Build
npm start        # Start MCP server
npm run dev      # Development mode
node test-mcp-tools.js  # Test
```

## Configuration

### Enhanced Multi-Instance Configuration (Recommended)
The enhanced format supports workflow mappings and improved instance management:

```json
{
  "instances": {
    "onvex": {
      "n8n_host": "https://n8n.onvex.ai/api/v1/",
      "n8n_api_key": "your-api-key",
      "description": "Onvex Production Environment",
      "workflows": ["workflow-1", "workflow-2"]
    },
    "staging": {
      "n8n_host": "https://staging-n8n.example.com/api/v1/",
      "n8n_api_key": "your-staging-key",
      "description": "Staging Environment"
    }
  },
  "workflows": {
    "workflow-1": {
      "instance": "onvex",
      "name": "Production Pipeline",
      "tags": ["production", "data"]
    }
  },
  "defaultInstance": "onvex"
}
```

### Legacy Configuration (Still Supported)
```json
{
  "environments": {
    "onvex": {
      "n8n_host": "https://n8n.onvex.ai/api/v1/",
      "n8n_api_key": "your-api-key"
    }
  },
  "defaultEnv": "onvex"
}
```

### Fallback Configuration
- `.env`: Single-instance (legacy)
- System auto-falls back to .env if no .config.json

## Architecture
- `src/index.ts`: Main MCP server
- `src/services/n8nApiWrapper.ts`: Multi-instance API management
- `src/services/workflowBuilder.ts`: Workflow construction
- `src/services/credentialOperations.ts`: Credential CRUD operations
- `src/services/executionOperations/`: Error extraction and debugging
- `src/services/nodeOperations/`: Node manipulation and analysis
- Connection formats: Legacy array → n8n native object

## Available MCP Tools

### Workflow Management
- `list_workflows`: List all workflows with pagination support
  - Optional: `limit` (number) - Maximum workflows to return
  - Optional: `cursor` (string) - Pagination cursor for next page
  - Returns: `{ data: Workflow[], nextCursor?: string }`
- `create_workflow`: Create new workflows
- `get_workflow`: Get workflow details
- `update_workflow`: Update existing workflows
- `delete_workflow`: Delete workflows
- `activate_workflow`: Activate workflows
- `deactivate_workflow`: Deactivate workflows
- `execute_workflow`: Manually execute workflows

### Execution Management
- `list_executions`: List workflow executions with pagination
  - Optional: `limit` (number) - Maximum executions to return
  - Optional: `cursor` (string) - Pagination cursor
  - Optional: `status` (string) - Filter by status (error, success, waiting)
  - Optional: `workflowId` (string) - Filter by workflow
  - Returns: `{ data: Execution[], nextCursor?: string }`
- `get_execution`: Get execution details
- `delete_execution`: Delete execution records
- `get_error`: Get error details from most recent execution
  - Optional: `includeData` (boolean, default: false) - Include execution data from nodes preceding the error
  - Optional: `dataDepth` (number, default: 1, max: 10) - Number of preceding nodes to include data from

### Credentials Management
- `list_credentials`: List all credentials with pagination
  - Optional: `limit` (number) - Maximum credentials to return
  - Optional: `cursor` (string) - Pagination cursor
  - Returns: `{ data: Credential[], nextCursor?: string }`
- `get_credential`: Get credential by ID
  - Required: `id` (string) - Credential ID
- `create_credential`: Create new credential
  - Required: `name` (string) - Credential name
  - Required: `type` (string) - Credential type (e.g., "httpBasicAuth", "airtableApi")
  - Required: `data` (object) - Credential data (e.g., `{"apiKey": "key"}`)
  - Optional: `nodesAccess` (array) - Nodes that can access this credential
- `update_credential`: Update existing credential
  - Required: `id` (string) - Credential ID
  - Optional: `name` (string) - New name
  - Optional: `type` (string) - New type
  - Optional: `data` (object) - Updated data
  - Optional: `nodesAccess` (array) - Updated access list
- `delete_credential`: Delete credential
  - Required: `id` (string) - Credential ID
- `get_credential_schema`: Get schema for credential type
  - Required: `credentialType` (string) - Type name (e.g., "githubOAuth2Api")

### Node Operations
- `get_node_names`: List all nodes in a workflow
- `get_node`: Get specific node(s) details
- `update_node`: Update node(s) without touching rest of workflow

### Tag Management
- `create_tag`: Create tags
- `get_tags`: List all tags with pagination
  - Optional: `limit` (number) - Maximum tags to return
  - Optional: `cursor` (string) - Pagination cursor
  - Returns: `{ data: Tag[], nextCursor?: string }`
- `get_tag`: Get tag details
- `update_tag`: Update tags
- `delete_tag`: Delete tags

### Instance Management
- `list_instances`: List available instances and their configurations
  - Shows instance details, workflow mappings, and usage guidelines
  - Provides configuration examples and migration guidance

## n8n Compatibility
- **n8n 1.111.0** (n8n-workflow package)
- **n8n API v1** fully supported
- **Trigger nodes required** for activation
- **manualTrigger not recognized** - auto-adds scheduleTrigger
- **Cursor-based pagination** for all list endpoints

## Development
### Adding Tools
1. Define schema in `setupToolHandlers()`
2. Implement in `handleToolCall()` switch
3. Update test script

### Workflow Creation
1. Validate parameters → 2. Transform connections → 3. Submit to API

## Testing
- `test-mcp-tools.js`: Comprehensive testing
- `DEBUG=true`: Verbose logging
- Common issues: Port conflicts (use MCP_PORT), auth errors, missing trigger nodes

## Instance Resolution
The system automatically determines which n8n instance to use based on:

1. **Explicit instance parameter** - Use specified instance if provided in tool call
2. **Workflow mapping** - Use configured instance for specific workflow (if workflows config exists)  
3. **Instance workflow lists** - Auto-discover based on instance's `workflows` array
4. **Default instance** - Fall back to configured default instance
5. **Single instance** - Use the only available instance if just one configured

### Manual Instance Override
Add `instance` parameter to any tool call:
```json
{
  "workflowId": "your-workflow-id",
  "instance": "staging",
  "name": "Test workflow"
}
```

## Files
- `.config.json`: Enhanced or legacy configuration
- `.env`: Environment variables (fallback)
- `cline_mcp_settings.json`: Claude Desktop integration
- All MCP tools accept optional `instance` parameter

## Build/Deploy
- TypeScript → `build/` directory
- `npm run prepublishOnly && npm run publish`

Test workflow operations before deploying changes.