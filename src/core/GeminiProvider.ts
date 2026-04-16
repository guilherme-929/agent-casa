import { GoogleGenerativeAI, ChatSession, Part } from '@google/generative-ai';
import { ILlmProvider, ChatMessage, ToolDefinition, ProviderResponse, ToolCall } from '../types';

export class GeminiProvider implements ILlmProvider {
    private genAI: GoogleGenerativeAI;
    private modelName: string;

    constructor(apiKey: string, model: string = "models/gemini-1.5-flash") {
        this.genAI = new GoogleGenerativeAI(apiKey);
        const name = model || "models/gemini-1.5-flash";
        this.modelName = name.startsWith('models/') ? name : `models/${name}`;
    }

    public async generateResponse(messages: ChatMessage[], tools?: ToolDefinition[], jsonMode?: boolean): Promise<ProviderResponse> {
        const systemMessage = messages.find(m => m.role === 'system');
        const historyMessages = messages.filter(m => m.role !== 'system');
        
        // Convert tools to Gemini format
        const declaration = tools?.map(t => ({
            functionDeclarations: [{
                name: t.name,
                description: t.description,
                parameters: t.parameters
            }]
        }));

        // Initialize model with system instruction
        const model = this.genAI.getGenerativeModel({ 
            model: this.modelName,
            systemInstruction: systemMessage?.content ? { role: 'system', parts: [{ text: systemMessage.content }] } : undefined,
            generationConfig: jsonMode ? { responseMimeType: "application/json" } : undefined
        });

        // Ensure history starts with user role
        const history = this.convertToGeminiHistory(historyMessages.slice(0, -1));

        const chat = model.startChat({
            history: history,
            tools: declaration
        });

        const lastMessage = historyMessages[historyMessages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const response = result.response;
        const call = response.functionCalls();

        if (call) {
            return {
                content: response.text(),
                toolCalls: call.map((c: any) => ({
                    id: Math.random().toString(36).substring(7),
                    name: c.name,
                    arguments: c.args
                }))
            };
        }

        return {
            content: response.text()
        };
    }

    private convertToGeminiHistory(messages: ChatMessage[]): any[] {
        const history: any[] = [];
        
        for (let i = 0; i < messages.length; i++) {
            const m = messages[i];
            
            if (m.role === 'user') {
                history.push({ role: 'user', parts: [{ text: m.content }] });
            } else if (m.role === 'assistant') {
                history.push({ role: 'model', parts: [{ text: m.content || '' }] });
            } else if (m.role === 'tool') {
                history.push({
                    role: 'user',
                    parts: [{
                        functionResponse: {
                            name: m.name,
                            response: { result: m.content }
                        }
                    }]
                });
            }
        }

        // Gemini REQUIREMENT: History must start with 'user' role.
        // If the first message is 'model', we must remove it.
        while (history.length > 0 && history[0].role !== 'user') {
            history.shift();
        }

        return history;
    }
}
