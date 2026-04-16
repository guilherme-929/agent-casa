import OpenAI from 'openai';
import { ILlmProvider, ChatMessage, ToolDefinition, ProviderResponse, ToolCall } from '../types';

export class OpenAiProvider implements ILlmProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, baseURL?: string, model: string = "gpt-4-turbo") {
        this.client = new OpenAI({ apiKey, baseURL });
        this.model = model;
    }

    public async generateResponse(messages: ChatMessage[], tools?: ToolDefinition[], jsonMode?: boolean): Promise<ProviderResponse> {
        let currentMessages = [...messages];

        console.log(`[OpenAiProvider] Sending ${currentMessages.length} messages, tools: ${tools?.length || 0}`);
        
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: currentMessages as any[],
                tools: tools && tools.length > 0 ? tools.map(t => ({
                    type: 'function',
                    function: {
                        name: t.name,
                        description: t.description,
                        parameters: t.parameters
                    }
                })) : undefined,
                tool_choice: tools && tools.length > 0 ? 'auto' : undefined,
                response_format: jsonMode ? { type: 'json_object' } : undefined
            });

            const choice = response.choices[0].message;
            console.log(`[OpenAiProvider] Response Choice: ${JSON.stringify(choice)}`);

            return {
                content: choice.content,
                toolCalls: choice.tool_calls?.map((tc: any) => {
                    try {
                        return {
                            id: tc.id,
                            name: tc.function.name,
                            arguments: JSON.parse(tc.function.arguments)
                        };
                    } catch (e) {
                        console.error(`[OpenAiProvider] Error parsing tool arguments: ${tc.function.arguments}`, e);
                        return null;
                    }
                }).filter((tc: any) => tc !== null)
            };
        } catch (error: any) {
            // Groq Llama models often hallucinate XML brackets <function=... causing the API to 400.
            if (error.status === 400 && error.error?.code === 'tool_use_failed') {
                console.warn(`[OpenAiProvider] Caught tool hallucination: ${error.message}`);
                return {
                    content: null,
                    toolCalls: [{
                        id: 'error_call_' + Date.now(),
                        name: 'system_error',
                        arguments: { error: "An internal parser error occurred with your tool call syntax. Please ensure you are strictly following the tool calling rules and try calling it again, or respond directly to the user without tools." }
                    }]
                };
            }
            throw error;
        }
    }
}
