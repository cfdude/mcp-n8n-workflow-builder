
# n8n Workflow Builder MCP Server

This project provides an MCP (Model Context Protocol) server for managing n8n workflows. It allows you to create, update, delete, activate, and deactivate workflows through a set of tools available in Claude AI and Cursor IDE.


***PLEASE, be aware if you dont limit permissions for actions of MCP, it could remove your workflow***

**Key Features:**
- Full integration with Claude AI and Cursor IDE via MCP protocol
- **Multi-instance support** - Manage multiple n8n environments (production, staging, development)
- Create and manage n8n workflows via natural language
- Predefined workflow templates through prompts system
- Interactive workflow building with real-time feedback
- Backward compatible with existing single-instance setups

## Requirements

- Node.js (v14+ recommended)
- npm
- n8n instance with API access (tested and compatible with n8n version 1.82.3)
- Claude App or Cursor IDE for AI interaction

## Installation Guide

### 1. Install from npm (Recommended)

You can install the package directly from npm:

```bash
# Install globally
npm install -g @kernel.salacoste/n8n-workflow-builder

# Or as a local dependency
npm install @kernel.salacoste/n8n-workflow-builder
```

After installation, you need to configure the environment variables (see step 3).

### 2. Clone the Repository

Alternatively, you can clone the repository from GitHub:

```bash
git clone https://github.com/salacoste/mcp-n8n-workflow-builder.git
```

Then navigate to the project directory:

```bash
cd mcp-n8n-workflow-builder
```

### 3. Install Dependencies

Install the necessary dependencies using npm:

```bash
npm install
```

### 4. Configure Environment Variables

You have two options for configuration:

#### Option A: Multi-Instance Configuration (Recommended)

Create a `.config.json` file in the project root for managing multiple n8n environments:

```json
{
  "environments": {
    "production": {
      "n8n_host": "https://n8n.example.com/api/v1/",
      "n8n_api_key": "n8n_api_key_for_production"
    },
    "staging": {
      "n8n_host": "https://staging-n8n.example.com/api/v1/", 
      "n8n_api_key": "n8n_api_key_for_staging"
    },
    "development": {
      "n8n_host": "http://localhost:5678/api/v1/",
      "n8n_api_key": "n8n_api_key_for_development"
    }
  },
  "defaultEnv": "development"
}
```

#### Option B: Single-Instance Configuration (Legacy)

Create an `.env` file in the project root with the following variables:

```
N8N_HOST=https://your-n8n-instance.com/api/v1/
N8N_API_KEY=your_api_key_here
```

**Note:** The system automatically falls back to `.env` configuration if no `.config.json` is found, ensuring backward compatibility.

### 5. Build and Run

If you installed via npm globally, you can run the server using the command:

```bash
n8n-workflow-builder
```

Or with JSON-RPC mode:

```bash
n8n-workflow-builder --json-rpc
```

If you cloned the repository or installed as a local dependency, use the following commands:

- **Build the project:**
  
  ```bash
  npm run build
  ```

- **Start the MCP Server in standalone mode:**
  
  ```bash
  npm start
  ```

- **Start with JSON-RPC mode for testing:**
  
  ```bash
  npm run start -- --json-rpc
  ```

The server will start and accept requests via stdio or JSON-RPC depending on the mode.

### 6. Claude App Integration

For integration with Claude App, you need to create a configuration file `cline_mcp_settings.json`. You can copy the example from `cline_mcp_settings.example.json` and edit it:

```bash
cp cline_mcp_settings.example.json cline_mcp_settings.json
```

Then edit the file, providing the correct environment variable values:

```json
{
  "n8n-workflow-builder": {
    "command": "node",
    "args": ["path/to/your/project/build/index.js"],
    "env": {
      "N8N_HOST": "https://your-n8n-instance.com/api/v1/",
      "N8N_API_KEY": "your_api_key_here",
      "MCP_PORT": "58921"
    },
    "disabled": false,
    "alwaysAllow": [
      "list_workflows",
      "get_workflow",
      "list_executions",
      "get_execution"
    ],
    "autoApprove": [
      "create_workflow",
      "update_workflow",
      "activate_workflow",
      "deactivate_workflow",
      "delete_workflow",
      "delete_execution"
    ]
  }
}
```

**Important Notes:**
- The `MCP_PORT` parameter is optional but recommended to avoid port conflicts
- Use a non-standard high port (like 58921) if you encounter conflicts
- Starting with version 0.7.2, the server gracefully handles port conflicts
- Do not add `cline_mcp_settings.json` to the repository as it contains your personal access credentials

## Available Tools and Features

### MCP Tools

The following tools are available through the MCP protocol:

#### Workflow Management
- **list_workflows**: Displays a streamlined list of workflows with pagination support
  - Optional: `limit` (number) - Maximum workflows to return
  - Optional: `cursor` (string) - Pagination cursor for next page
  - Returns: `{ data: Workflow[], nextCursor?: string }`
- **create_workflow**: Creates a new workflow in n8n
- **get_workflow**: Gets complete workflow details by its ID (includes nodes and connections)
- **update_workflow**: Updates an existing workflow
- **delete_workflow**: Deletes a workflow by its ID
- **activate_workflow**: Activates a workflow by its ID
- **deactivate_workflow**: Deactivates a workflow by its ID
- **execute_workflow**: Manually executes a workflow by its ID

#### Execution Management
- **list_executions**: List workflow executions with pagination and filtering
  - Optional: `limit` (number) - Maximum executions to return
  - Optional: `cursor` (string) - Pagination cursor
  - Optional: `status` (string) - Filter by status (error, success, waiting)
  - Optional: `workflowId` (string) - Filter by workflow
  - Returns: `{ data: Execution[], nextCursor?: string }`
- **get_execution**: Gets details of a specific execution by its ID
- **delete_execution**: Deletes an execution record by its ID

#### Credentials Management
- **list_credentials**: List all credentials with pagination
  - Optional: `limit` (number) - Maximum credentials to return
  - Optional: `cursor` (string) - Pagination cursor
  - Returns: `{ data: Credential[], nextCursor?: string }`
- **get_credential**: Get credential by ID
  - Required: `id` (string) - Credential ID
- **create_credential**: Create new credential
  - Required: `name` (string) - Credential name
  - Required: `type` (string) - Credential type (e.g., "httpBasicAuth", "airtableApi")
  - Required: `data` (object) - Credential data (e.g., `{"apiKey": "key"}`)
  - Optional: `nodesAccess` (array) - Nodes that can access this credential
- **update_credential**: Update existing credential
  - Required: `id` (string) - Credential ID
  - Optional: `name`, `type`, `data`, `nodesAccess` - Fields to update
- **delete_credential**: Delete credential by ID
  - Required: `id` (string) - Credential ID
- **get_credential_schema**: Get schema for credential type
  - Required: `credentialType` (string) - Type name (e.g., "githubOAuth2Api")

#### Tag Management
- **create_tag**: Creates a new tag
- **get_tags**: List all tags with pagination
  - Optional: `limit` (number) - Maximum tags to return
  - Optional: `cursor` (string) - Pagination cursor
  - Returns: `{ data: Tag[], nextCursor?: string }`
- **get_tag**: Gets tag details by its ID
- **update_tag**: Updates an existing tag
- **delete_tag**: Deletes a tag by its ID

#### Workflow Debugging and Analysis
- **get_error**: Retrieves error details from the most recent workflow execution. Returns structured error information including node name, error message, line numbers, and stack traces for efficient debugging.
  - Optional: `includeData` (boolean, default: false) - Include execution data from nodes preceding the error
  - Optional: `dataDepth` (number, default: 1, max: 10) - Number of preceding nodes to include data from
- **get_node_names**: Gets a list of all node names and IDs in a workflow without downloading the full workflow data. Useful for understanding workflow structure.
- **get_node**: Retrieves specific node(s) from a workflow. Supports both single node retrieval and batch operations for multiple nodes.
- **update_node**: Updates specific node(s) in a workflow without modifying the rest of the workflow. Supports batch updates for multiple nodes, preserving workflow integrity.

### Multi-Instance Support

**New in v0.8.0**: All MCP tools now support an optional `instance` parameter to specify which n8n environment to target:

```json
{
  "name": "list_workflows",
  "arguments": {
    "instance": "production"
  }
}
```

- If no `instance` parameter is provided, the default environment is used
- Available instances are defined in your `.config.json` file
- For single-instance setups (using `.env`), the instance parameter is ignored

All tools have been tested and optimized for n8n API v1. The server uses n8n-workflow package v1.111.0 for maximum compatibility.

### Important Note About Workflow Triggers

When working with n8n version 1.82.3, please note the following important requirements:

- **Trigger nodes are required for activation**: n8n requires at least one valid trigger node to successfully activate a workflow.
- **Valid trigger node types** include:
  - `scheduleTrigger` (recommended for automation)
  - `webhook` (for HTTP-triggered workflows)
  - Service-specific trigger nodes
- **Automatic trigger addition**: The `activate_workflow` tool automatically adds a `scheduleTrigger` node when no trigger is detected
- **Manual trigger limitation**: The `manualTrigger` node type is NOT recognized as a valid trigger by n8n API v1.82

The `activate_workflow` tool implements intelligent detection of trigger nodes and adds necessary attributes to ensure compatibility with the n8n API.

### Known Limitations and API Issues

During testing with n8n version 1.82.3, we've identified several API limitations that users should be aware of:

#### Trigger Node Activation Issue

The n8n API enforces strict requirements for workflow activation that aren't clearly documented:

```
Status: 400
Error: Workflow has no node to start the workflow - at least one trigger, poller or webhook node is required
```

**Impact**:
- Workflows without a recognized trigger node cannot be activated via API
- The `manualTrigger` node is NOT recognized as a valid trigger despite being usable in the UI
- Even adding attributes like `group: ['trigger']` to `manualTrigger` does not solve the issue

**Our solution**:
- The `activate_workflow` function automatically detects missing trigger nodes
- Adds a properly configured `scheduleTrigger` when needed
- Preserves all your existing nodes and connections

#### Tag Management Conflicts

When updating tags that already exist, the API returns a **409 Conflict Error**:

```
Status: 409
Error: Tag with this name already exists
```

**Impact**:
- Tag updates may fail if a tag with the requested name already exists
- This happens even when updating a tag to the same name

**Our solution**:
- The test script now implements UUID generation for tag names
- Performs cleanup of existing tags before testing
- Implements proper error handling for tag conflicts

#### Execution Limitations

The execution API has limitations with certain trigger types:

- **Webhook triggers**: Return 404 errors when executed via API (expected behavior)
- **Manual triggers**: Cannot be properly executed through the API in version 1.82.3
- **Schedule triggers**: Can be activated but may not execute immediately

**Recommendation**:
For workflows that need to be executed via API, use the `scheduleTrigger` with your desired interval settings.

### MCP Resources

The server provides the following resources for more efficient context access:

#### Static Resources
- **/workflows**: List of all available workflows in the n8n instance
- **/execution-stats**: Summary statistics about workflow executions

#### Dynamic Resource Templates
- **/workflows/{id}**: Detailed information about a specific workflow
- **/executions/{id}**: Detailed information about a specific execution

### MCP Prompts

The server offers predefined workflow templates through the prompts system:

#### Available Prompts
- **Schedule Triggered Workflow**: Create a workflow that runs on a schedule
- **HTTP Webhook Workflow**: Create a workflow that responds to HTTP webhook requests
- **Data Transformation Workflow**: Create a workflow for processing and transforming data
- **External Service Integration Workflow**: Create a workflow that integrates with external services
- **API Data Polling Workflow**: Create a workflow that polls an API and processes data with filtering

Each prompt has variables that can be customized when generating a workflow, such as workflow name, schedule expression, webhook path, and more.

## Migration from Single to Multi-Instance

If you're currently using a single-instance setup with `.env` and want to migrate to multi-instance:

1. **Create .config.json** with your existing configuration:
   ```json
   {
     "environments": {
       "default": {
         "n8n_host": "https://your-existing-n8n.com/api/v1/",
         "n8n_api_key": "your_existing_api_key"
       }
     },
     "defaultEnv": "default"
   }
   ```

2. **Add additional environments** as needed:
   ```json
   {
     "environments": {
       "default": {
         "n8n_host": "https://your-existing-n8n.com/api/v1/",
         "n8n_api_key": "your_existing_api_key"
       },
       "staging": {
         "n8n_host": "https://staging-n8n.com/api/v1/",
         "n8n_api_key": "staging_api_key"
       }
     },
     "defaultEnv": "default"
   }
   ```

3. **Keep your .env file** for backward compatibility (optional)

4. **Start using instance parameters** in your MCP calls when needed

## Usage Examples

### Basic Multi-Instance Usage

```javascript
// List workflows from default environment
await listWorkflows();

// List workflows from specific environment  
await listWorkflows("production");

// Create workflow in staging environment
await createWorkflow(workflowData, "staging");
```

### Claude AI Examples

You can now specify which n8n instance to target in your Claude conversations:

- "List all workflows from the production environment"
- "Create a new workflow in the staging instance"
- "Show me executions from the development n8n"

### Credential Management Examples

```javascript
// List all credentials
await listCredentials({ limit: 10 });

// Get specific credential
await getCredential("credential-id-123");

// Create HTTP Basic Auth credential
await createCredential({
  name: "My API Credentials",
  type: "httpBasicAuth",
  data: {
    user: "apiuser",
    password: "secret123"
  }
});

// Create Airtable credential with node access
await createCredential({
  name: "Airtable Production",
  type: "airtableApi",
  data: {
    apiKey: "your-airtable-key"
  },
  nodesAccess: [
    { nodeType: "n8n-nodes-base.airtable" }
  ]
});

// Update credential
await updateCredential("credential-id-123", {
  name: "Updated API Credentials",
  data: {
    user: "newuser",
    password: "newsecret456"
  }
});

// Delete credential
await deleteCredential("credential-id-123");

// Get credential schema for a type
await getCredentialSchema("githubOAuth2Api");
```

### Pagination Examples

```javascript
// Paginate through workflows
let cursor = null;
do {
  const result = await listWorkflows({ limit: 50, cursor });
  console.log(`Retrieved ${result.data.length} workflows`);
  cursor = result.nextCursor;
} while (cursor);

// Paginate through credentials
let credCursor = null;
do {
  const result = await listCredentials({ limit: 25, cursor: credCursor });
  console.log(`Retrieved ${result.data.length} credentials`);
  credCursor = result.nextCursor;
} while (credCursor);
```

In the `examples` directory, you'll find examples and instructions for setting up and using n8n Workflow Builder with Claude App:

1. **setup_with_claude.md** - Step-by-step instructions for setting up integration with Claude App
2. **workflow_examples.md** - Simple query examples for working with n8n workflows
3. **complex_workflow.md** - Examples of creating and updating complex workflows
4. **using_prompts.md** - Guide to using the prompts feature for quick workflow creation

## Testing the Server

You can use the provided test scripts to verify the functionality:

### Using test-mcp-tools.js

The `test-mcp-tools.js` script provides comprehensive testing of all MCP tools against your n8n instance. This is the recommended way to validate your setup and ensure all functionality works correctly.

```bash
# Run all tests
node test-mcp-tools.js
```

The script performs the following tests:
1. Health check and tools availability
2. Workflow management (create, read, update, activate)
3. Tag management (create, read, update, delete)
4. Execution management (execute, list, get, delete)

The test script creates temporary test workflows and tags which are automatically cleaned up after testing. You can customize the test behavior by modifying the test configuration variables at the top of the script.

```javascript
// Configuration options in test-mcp-tools.js
const config = {
  mcpServerUrl: 'http://localhost:3456/mcp',
  healthCheckUrl: 'http://localhost:3456/health',
  testWorkflowName: 'Test Workflow MCP',
  // ... other options
};

// Test flags to enable/disable specific test suites
const testFlags = {
  runWorkflowTests: true,
  runTagTests: true, 
  runExecutionTests: true,
  runCleanup: true
};
```

### Additional Test Scripts

```bash
# Test basic functionality with Claude
node test-claude.js

# Test prompts functionality
node test-prompts.js

# Test workflow creation and management
node test-workflow.js
```

## Troubleshooting

- Make sure you are using npm.
- If you encounter problems, try cleaning the build directory and rebuilding the project:
  ```bash
  npm run clean && npm run build
  ```
- Check that your environment variables in `.env` and `cline_mcp_settings.json` are set correctly.
- If you have problems with Claude integration, check the location of the `cline_mcp_settings.json` file.
- For debugging, run with the `--json-rpc` flag and use curl to send test requests to port 3000.

### Common Errors and Solutions

#### Port Already in Use (EADDRINUSE)

If you see the following error in logs:
```
Error: listen EADDRINUSE: address already in use :::3456
```

This means that port 3456 (default for the MCP server) is already in use by another process. To fix:

**Option 1: Use a Different Port with Environment Variable**

Starting from version 0.7.2, you can specify a custom port using the `MCP_PORT` environment variable:

```bash
# In your code
MCP_PORT=58921 npm start

# Or when running directly
MCP_PORT=58921 node build/index.js
```

If using Claude Desktop, update your `cline_mcp_settings.json` to include the new port:
```json
{
  "n8n-workflow-builder": {
    "command": "node",
    "args": ["path/to/your/project/build/index.js"],
    "env": {
      "N8N_HOST": "https://your-n8n-instance.com/api/v1/",
      "N8N_API_KEY": "your_api_key_here",
      "MCP_PORT": "58921"
    },
    // ...
  }
}
```

**Option 2: Find and kill the process using the port**
```bash
# On macOS/Linux
lsof -i :3456
kill -9 <PID>

# On Windows
netstat -ano | findstr :3456
taskkill /PID <PID> /F
```

**Note on Version 0.7.2+:** Starting with version 0.7.2, the server includes improved handling for port conflicts, automatically detecting when a port is already in use and gracefully continuing operation without throwing errors. This is especially helpful when Claude Desktop attempts to start multiple instances of the same server.

### Running Multiple Server Instances

If you need to run multiple instances of the n8n workflow builder server (for example, for different n8n installations), you can do this by configuring separate ports:

1. **Configure different ports for each instance**:
   ```bash
   # First instance
   MCP_PORT=58921 node build/index.js
   
   # Second instance
   MCP_PORT=58922 node build/index.js
   ```

2. **Create separate Claude Desktop configurations**:
   For each instance, create a separate entry in your `claude_desktop_config.json` file:
   
   ```json
   {
     "mcpServers": {
       "n8n-workflow-builder-prod": {
         "command": "node",
         "args": ["path/to/build/index.js"],
         "env": {
           "N8N_HOST": "https://production-n8n.example.com/api/v1/",
           "N8N_API_KEY": "your_prod_api_key",
           "MCP_PORT": "58921"
         }
       },
       "n8n-workflow-builder-dev": {
         "command": "node",
         "args": ["path/to/build/index.js"],
         "env": {
           "N8N_HOST": "https://dev-n8n.example.com/api/v1/",
           "N8N_API_KEY": "your_dev_api_key",
           "MCP_PORT": "58922"
         }
       }
     }
   }
   ```

3. **Access each instance in Claude**:
   After restarting Claude Desktop, you'll see both servers available in your tools list.

#### Authentication Errors

If you see errors related to API authentication:
```
Error: Request failed with status code 401
```

Check that:
1. Your API key is correct and hasn't expired
2. The N8N_API_KEY in your `.env` file matches your n8n instance
3. Your n8n instance has API access enabled

#### Set Node Parameter Error

If you encounter the error `node.parameters.values.map is not a function` when creating workflows:

This usually happens when creating workflows with Set nodes that use the newer n8n parameter structure. Version 0.7.2+ includes a fix that supports both the legacy array format and the newer object-based format for Set node parameters.

## Version Compatibility

This MCP server has been specifically tested and validated with:
- **n8n API**: v1 (fully compatible)
- **n8n-workflow package**: v1.111.0
- **Node.js**: v14 and above
- **MCP Protocol**: Latest version compatible with Claude and Cursor

The server provides 80% feature parity with the n8n Community Edition API, covering all essential workflow, execution, credential, and tag management operations.

If you're using a different version of n8n, some API endpoints or node types may differ. Please report any compatibility issues in the GitHub repository.

[![Verified on MseeP](https://mseep.ai/badge.svg)](https://mseep.ai/app/01934c6d-aff1-497b-9e11-b21a9d207667)


## Changelog

### 0.9.0 (Current)
- **✨ Credentials Management** - Full CRUD operations for n8n credentials
  - `list_credentials`: List all credentials with pagination
  - `get_credential`: Get credential by ID
  - `create_credential`: Create new credentials
  - `update_credential`: Update existing credentials
  - `delete_credential`: Delete credentials
  - `get_credential_schema`: Get schema for credential types
- **📊 Cursor-Based Pagination** - Efficient handling of large datasets
  - Updated `list_workflows` with limit/cursor pagination
  - Updated `list_executions` with filtering and pagination
  - Updated `list_credentials` with pagination
  - Updated `get_tags` with pagination
  - All paginated responses include `nextCursor` for easy iteration
- **🔧 Enhanced API Support**
  - Upgraded n8n-workflow to v1.111.0 (29 versions ahead)
  - Full n8n API v1 compatibility
  - Improved type safety with comprehensive TypeScript interfaces
- **🧪 Comprehensive Testing**
  - Added credential management tests to test-mcp-tools.js
  - 80% feature parity with n8n Community Edition API
  - All tests passing with pagination and credentials support

### 0.8.0
- **🎉 Multi-instance support** - Manage multiple n8n environments (production, staging, development)
- Added `.config.json` configuration format for multiple n8n instances
- All MCP tools now support optional `instance` parameter for environment targeting
- Created N8NApiWrapper with centralized instance management
- Added EnvironmentManager for API instance caching and configuration loading
- Enhanced ConfigLoader with fallback support (.config.json → .env)
- Maintained full backward compatibility with existing .env setups
- Updated all tool schemas and handlers for multi-instance architecture
- **🚀 Performance optimization** - `list_workflows` now returns streamlined metadata instead of full workflow JSON, preventing large data transfers that could crash Claude Desktop
- **🔍 New debugging tools**:
  - `get_error`: Quickly identify and debug workflow execution errors
  - `get_node_names`: List all nodes in a workflow for quick overview
  - `get_node`: Extract specific nodes for detailed analysis
  - `update_node`: Modify individual nodes without touching the rest of the workflow
- Enhanced node operations with batch support for efficient workflow management
- Added comprehensive testing for multi-instance functionality

### 0.7.2
- Fixed validation error when handling Set node parameters in workflow creation
- Added improved error handling for port conflicts
- Enhanced server startup reliability with multiple running instances
- Fixed `node.parameters.values.map is not a function` error for modern n8n node structure
- Added MCP_PORT environment variable support for custom port configuration

### 0.7.1
- Added detailed documentation about n8n API limitations and known issues
- Enhanced troubleshooting section with specific error codes and solutions
- Added comprehensive explanation of trigger node requirements
- Improved UUID generation for tag management to prevent conflicts
- Updated testing documentation with detailed examples

### Version 0.7.0
- Enhanced trigger node detection and compatibility with n8n 1.82.3
- Improved handling of workflow activation when no trigger node exists
- Added proper handling of different trigger node types (schedule, webhook)
- Fixed tag management with proper conflict handling and UUID generation
- Updated documentation with trigger node requirements and compatibility notes
- Improved test-mcp-tools.js with enhanced workflow testing and error handling

### Version 0.6.1
- Fixed NPM package configuration
- Excluded test scripts and sensitive files from NPM package

### Version 0.6.0
- Added **execute_workflow** tool to manually run workflows by ID
- Added new **API Data Polling Workflow** template for efficient API data retrieval and filtering
- Improved error handling for workflow creation and validation
- Added validation checks for typical workflow configuration issues
- Better error messages with suggestions for common problems

### Version 0.5.0
- Initial public release
- Basic workflow management functionality
- Execution tracking and monitoring
- Four workflow templates

## License

This project is distributed under the MIT License.
