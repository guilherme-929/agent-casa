import { ILlmProvider, ChatMessage, ProviderResponse } from '../types';

export class OllamaProvider implements ILlmProvider {
    private baseUrl: string;

    constructor(
        apiKey: string,
        private model: string = 'qwen2.5',
        baseUrl: string = 'http://localhost:11434'
    ) {
        this.baseUrl = baseUrl;
    }

    async generateResponse(
        messages: ChatMessage[],
        tools?: any,
        raw: boolean = false
    ): Promise<ProviderResponse> {
        const ollamaMessages = messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    messages: ollamaMessages,
                    stream: false
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Ollama error: ${error}`);
            }

            const data = await response.json();
            
            return {
                content: data.message?.content || '',
                toolCalls: []
            };
        } catch (error: any) {
            console.error('[OllamaProvider] Error:', error.message);
            throw new Error(`Failed to connect to Ollama: ${error.message}`);
        }
    }
}