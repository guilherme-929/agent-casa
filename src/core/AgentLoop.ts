import { ILlmProvider, ChatMessage, ProviderResponse, ToolCall } from '../types';
import { ToolRegistry } from '../tools/BaseTool';
import { getMestreKamiPrompt } from './SystemPrompts';

export class AgentLoop {
    private maxIterations = 10;

    constructor(
        private provider: ILlmProvider,
        private toolRegistry: ToolRegistry
    ) {}

    public async run(messages: ChatMessage[], skillContent?: string): Promise<string> {
        let currentMessages = [...messages];
        
        let systemPrompt = getMestreKamiPrompt();

        // Inject skill content if present
        if (skillContent) {
            systemPrompt += `\n\n--- INSTRUÇÕES DA SKILL ESPECIALIZADA ATUAL ---\n${skillContent}`;
        }
        
        currentMessages.unshift({
            role: 'system',
            content: systemPrompt
        });

        let iterations = 0;
        let finalResponse = "I'm sorry, I couldn't reach a conclusion after several attempts.";

        while (iterations < this.maxIterations) {
            console.log(`[AgentLoop] Iteration ${iterations + 1}...`);
            
            const tools = this.toolRegistry.getAllDefinitions();
            const response: ProviderResponse = await this.provider.generateResponse(currentMessages, tools.length > 0 ? tools : undefined);

            console.log(`[AgentLoop] Response: ${response.content?.substring(0, 100)}...`);
            console.log(`[AgentLoop] Tool calls: ${response.toolCalls?.length || 0}`);

            // Add the assistant's response to the history
            currentMessages.push({
                role: 'assistant',
                content: response.content || ''
            });

            if (response.toolCalls && response.toolCalls.length > 0) {
                console.log(`[AgentLoop] Handling ${response.toolCalls.length} tool calls...`);
                
                for (const toolCall of response.toolCalls) {
                    const tool = this.toolRegistry.get(toolCall.name);
                    let observation: string;

                    if (toolCall.name === 'system_error') {
                        observation = `SYSTEM FAULT: ${toolCall.arguments.error || 'Unknown error'}`;
                        console.warn(`[AgentLoop] Feeding system fault back to agent: ${observation}`);
                    } else if (tool) {
                        console.log(`[AgentLoop] Executing tool: ${toolCall.name}`);
                        console.log(`[AgentLoop] Args: ${JSON.stringify(toolCall.arguments)}`);
                        observation = await tool.execute(toolCall.arguments);
                        console.log(`[AgentLoop] Tool result: ${observation}`);
                    } else {
                        observation = `Error: Tool ${toolCall.name} not found.`;
                    }

                    currentMessages.push({
                        role: 'tool',
                        name: toolCall.name,
                        tool_call_id: toolCall.id,
                        content: observation
                    });
                }
                
                iterations++;
                continue; // Continue loop to let AI process observations
            }

            // If no tool calls, check if there's actual content
            if (response.content && response.content.trim().length > 0) {
                finalResponse = response.content;
                break;
            }
            
            // Empty response, try again
            iterations++;
        }

        if (iterations >= this.maxIterations) {
            console.warn('[AgentLoop] Max iterations reached.');
            // Fallback: if we have any assistant content from the last iteration, use it instead of the error message
            const lastAssistantMessage = currentMessages.reverse().find(m => m.role === 'assistant' && m.content.trim().length > 0);
            if (lastAssistantMessage) {
                return lastAssistantMessage.content;
            }
        }

        return finalResponse;
    }
}
