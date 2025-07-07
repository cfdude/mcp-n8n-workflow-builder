# Debugging Workflows with n8n MCP Tools

This guide demonstrates how to use the new debugging and analysis tools to efficiently troubleshoot and modify n8n workflows.

## Debugging Tools Overview

The n8n MCP server provides several powerful tools for debugging and analyzing workflows:

- **get_error**: Quickly identify errors in workflow executions
- **get_node_names**: Get an overview of all nodes in a workflow
- **get_node**: Extract specific nodes for detailed analysis
- **update_node**: Modify individual nodes without affecting the rest of the workflow

## Common Debugging Scenarios

### 1. Identifying Workflow Errors

When a workflow fails, use `get_error` to quickly identify the problem:

**Claude command**:
```
Check if there are any errors in my "Data Processing Pipeline" workflow
```

**Example response**:
```json
{
  "status": "error",
  "workflowId": "abc123",
  "executionId": "456",
  "error": {
    "nodeName": "Transform Data",
    "errorMessage": "Cannot read property 'id' of undefined [line 5]",
    "lineNumber": 5,
    "stackTrace": "..."
  }
}
```

### 2. Understanding Workflow Structure

Use `get_node_names` to get a quick overview of your workflow:

**Claude command**:
```
Show me all the nodes in my "Customer Sync" workflow
```

**Example response**:
```json
[
  {
    "id": "node_1",
    "name": "Schedule Trigger",
    "type": "n8n-nodes-base.scheduleTrigger",
    "position": [0, 300]
  },
  {
    "id": "node_2",
    "name": "Fetch Customers",
    "type": "n8n-nodes-base.httpRequest",
    "position": [200, 300]
  },
  {
    "id": "node_3",
    "name": "Transform Data",
    "type": "n8n-nodes-base.code",
    "position": [400, 300]
  }
]
```

### 3. Analyzing Specific Nodes

Extract specific nodes for detailed analysis:

**Claude command**:
```
Show me the code in the "Transform Data" node from my workflow
```

**Using get_node with single node**:
```json
{
  "id": "node_3",
  "name": "Transform Data",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "jsCode": "// Transform customer data\nreturn items.map(item => ({\n  customerId: item.json.id,\n  fullName: `${item.json.firstName} ${item.json.lastName}`,\n  email: item.json.email\n}));"
  }
}
```

### 4. Batch Node Analysis

Analyze multiple nodes at once:

**Claude command**:
```
Show me both the "Fetch Customers" and "Transform Data" nodes
```

**Using get_node with multiple nodes**:
```json
[
  {
    "id": "node_2",
    "name": "Fetch Customers",
    "parameters": {
      "url": "https://api.example.com/customers",
      "method": "GET"
    }
  },
  {
    "id": "node_3",
    "name": "Transform Data",
    "parameters": {
      "jsCode": "..."
    }
  }
]
```

### 5. Fixing Errors in Nodes

When you identify an error, use `update_node` to fix it:

**Claude command**:
```
Fix the error in the "Transform Data" node by adding a null check for the id property
```

**Using update_node**:
```json
{
  "nodeId": "node_3",
  "node": {
    "parameters": {
      "jsCode": "// Transform customer data with null check\nreturn items.map(item => {\n  if (!item.json || !item.json.id) {\n    console.error('Missing customer data');\n    return null;\n  }\n  return {\n    customerId: item.json.id,\n    fullName: `${item.json.firstName} ${item.json.lastName}`,\n    email: item.json.email\n  };\n}).filter(item => item !== null);"
    }
  }
}
```

### 6. Batch Updates

Update multiple nodes in one operation:

**Claude command**:
```
Update both the API endpoint in "Fetch Customers" and add error handling to "Transform Data"
```

**Using update_node with batch updates**:
```json
[
  {
    "nodeId": "node_2",
    "node": {
      "parameters": {
        "url": "https://api.example.com/v2/customers"
      }
    }
  },
  {
    "nodeId": "node_3",
    "node": {
      "parameters": {
        "jsCode": "// Enhanced error handling\ntry {\n  return items.map(item => ({...}));\n} catch (error) {\n  throw new Error(`Transformation failed: ${error.message}`);\n}"
      }
    }
  }
]
```

## Debugging Workflow Examples

### Example 1: Debug Failed API Integration

**Scenario**: Your API integration workflow is failing intermittently.

**Steps**:
1. Check for errors:
   ```
   Get the error from my "API Integration" workflow
   ```

2. If the error shows a timeout or connection issue, examine the HTTP node:
   ```
   Show me the HTTP Request node from the workflow
   ```

3. Update the node with better error handling and timeout:
   ```
   Update the HTTP Request node to add a 30-second timeout and retry logic
   ```

### Example 2: Fix Data Transformation Issues

**Scenario**: Your data transformation is producing unexpected results.

**Steps**:
1. Get all nodes to understand the flow:
   ```
   List all nodes in my "Data Transform Pipeline"
   ```

2. Extract the transformation nodes:
   ```
   Show me nodes "Parse JSON" and "Transform Data"
   ```

3. Update the transformation logic:
   ```
   Fix the Transform Data node to handle nested objects properly
   ```

### Example 3: Debug Complex Workflows

**Scenario**: A complex workflow with 20+ nodes is failing somewhere.

**Steps**:
1. Get the error to identify the failing node:
   ```
   What error is occurring in my "Complex ETL Process" workflow?
   ```

2. Get the failing node and its upstream nodes:
   ```
   Show me the "Process Orders" node and the two nodes that feed into it
   ```

3. Fix the identified issue:
   ```
   Update the "Process Orders" node to handle empty arrays gracefully
   ```

## Best Practices for Debugging

1. **Start with get_error**: Always check for errors first to quickly identify the problem node.

2. **Use get_node_names for overview**: In complex workflows, get a bird's-eye view before diving into specific nodes.

3. **Batch operations for efficiency**: When analyzing or updating multiple related nodes, use batch operations.

4. **Preserve workflow integrity**: The update_node tool maintains all connections and workflow structure.

5. **Test incrementally**: After fixing an error, test the workflow before making additional changes.

## Tips for Efficient Debugging

- **Multi-instance debugging**: If you have staging and production environments, use the instance parameter:
  ```
  Get the error from my "Data Sync" workflow in production
  ```

- **Compare nodes across workflows**: Extract the same node type from different workflows to compare implementations.

- **Quick fixes**: For simple fixes like typos or small logic changes, update_node is faster than editing the entire workflow.

- **Error patterns**: Common errors include:
  - Undefined property access (add null checks)
  - Array method on non-arrays (add Array.isArray checks)
  - API endpoint changes (update URLs)
  - Authentication failures (check credentials)

Remember that all debugging tools support the optional `instance` parameter for multi-environment setups.