/**
 * Tool to list available n8n instances and their configurations
 * Similar to the Jira MCP server's list-instances tool
 */

import { listAvailableInstances } from '../utils/tool-wrapper';
import { BaseToolArgs } from '../types/config';

interface ListInstancesArgs extends BaseToolArgs {
  // No additional arguments needed
}

export async function handleListInstances(args: ListInstancesArgs) {
  try {
    const { instances, workflows } = await listAvailableInstances();
    
    let result = "# Available n8n Instances\n\n";
    
    if (instances.length === 0) {
      result += "No n8n instances configured.\n\n";
      result += "To configure multiple instances, create or update your .config.json file with this structure:\n";
      result += "```json\n";
      result += JSON.stringify({
        instances: {
          "onvex": {
            "n8n_host": "https://n8n.onvex.ai/api/v1/",
            "n8n_api_key": "your-api-key",
            "description": "Onvex Production n8n",
            "workflows": ["workflow-1", "workflow-2"]
          },
          "listreports": {
            "n8n_host": "https://n8n.listreports.tech/api/v1/", 
            "n8n_api_key": "your-api-key",
            "description": "Highway n8n Instance",
            "workflows": ["workflow-3", "workflow-4"]
          }
        },
        workflows: {
          "workflow-1": {
            "instance": "onvex",
            "name": "Production Data Pipeline",
            "tags": ["production", "data"]
          },
          "workflow-2": {
            "instance": "onvex",
            "name": "Email Automation", 
            "tags": ["email", "automation"]
          }
        },
        defaultInstance: "onvex"
      }, null, 2);
      result += "\n```\n";
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }
    
    // List instances
    result += "## Configured Instances\n\n";
    instances.forEach((instance, index) => {
      result += `### ${index + 1}. ${instance.name}\n`;
      result += `- **Host**: ${instance.host}\n`;
      if (instance.description) {
        result += `- **Description**: ${instance.description}\n`;
      }
      result += `- **Pre-configured Workflows**: ${instance.configuredWorkflows.length > 0 ? instance.configuredWorkflows.join(", ") : "None"}\n\n`;
    });
    
    // List workflow mappings
    if (workflows.length > 0) {
      result += "## Workflow-to-Instance Mappings\n\n";
      workflows.forEach(workflow => {
        result += `- **${workflow.workflowId}** → ${workflow.instance}`;
        if (workflow.name) {
          result += ` (${workflow.name})`;
        }
        if (workflow.tags && workflow.tags.length > 0) {
          result += ` [${workflow.tags.join(", ")}]`;
        }
        result += "\n";
      });
      result += "\n";
    }
    
    // Usage guidance
    result += "## Usage Guidelines\n\n";
    result += "### Automatic Instance Selection\n";
    result += "1. **Explicit Workflow Mapping**: If a workflow is configured in the `workflows` section, that instance will be used\n";
    result += "2. **Instance Workflow Lists**: If an instance lists the workflow in its `workflows` array, that instance will be used\n";
    result += "3. **Default Instance**: The configured default instance will be used for unmapped workflows\n";
    result += "4. **Single Instance**: If only one instance is configured, it will be used for all workflows\n\n";
    
    result += "### Manual Instance Selection\n";
    result += "You can override automatic selection by adding an `instance` parameter to any tool call:\n";
    result += "```json\n";
    result += JSON.stringify({
      "workflowId": "your-workflow-id",
      "instance": "onvex", 
      "name": "New workflow name"
    }, null, 2);
    result += "\n```\n\n";
    
    result += "### Adding New Workflows\n";
    result += "When you use a workflow ID that isn't configured:\n";
    result += "1. The system will attempt auto-discovery based on instance workflow lists\n";
    result += "2. Fall back to the default instance\n";
    result += "3. Use the only available instance if there's just one\n";
    result += "4. Prompt you to specify an instance if multiple are available\n\n";
    
    result += "### Configuration Examples\n\n";
    result += "**Multi-instance setup:**\n";
    result += "```json\n";
    result += JSON.stringify({
      instances: {
        onvex: {
          n8n_host: "https://n8n.onvex.ai/api/v1/",
          n8n_api_key: "onvex-api-key",
          description: "Onvex Production Environment",
          workflows: ["prod-pipeline", "email-automation"]
        },
        listreports: {
          n8n_host: "https://n8n.listreports.tech/api/v1/",
          n8n_api_key: "listreports-api-key",
          description: "Highway Development Environment",
          workflows: ["dev-testing", "staging-pipeline"]
        }
      },
      workflows: {
        "prod-pipeline": { 
          instance: "onvex", 
          name: "Production Data Pipeline",
          tags: ["production", "data"] 
        },
        "dev-testing": { 
          instance: "listreports", 
          name: "Development Testing Workflow",
          tags: ["development", "testing"] 
        }
      },
      defaultInstance: "onvex"
    }, null, 2);
    result += "\n```\n\n";
    
    result += "**Simple setup (minimal required fields):**\n";
    result += "```json\n";
    result += JSON.stringify({
      instances: {
        main: {
          n8n_host: "https://your-n8n.example.com/api/v1/",
          n8n_api_key: "your-api-key"
        }
      },
      defaultInstance: "main"
    }, null, 2);
    result += "\n```\n\n";
    
    result += "**Legacy format (still supported):**\n";
    result += "```json\n";
    result += JSON.stringify({
      environments: {
        default: {
          n8n_host: "https://your-n8n.example.com/api/v1/",
          n8n_api_key: "your-api-key"
        }
      },
      defaultEnv: "default"
    }, null, 2);
    result += "\n```\n";
    
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
    
  } catch (error) {
    console.error("Error listing instances:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        },
      ],
    };
  }
}