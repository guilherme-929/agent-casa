import { ILlmProvider, ChatMessage, ProviderResponse } from '../types';
import dotenv from 'dotenv';

dotenv.config();

export class OllamaProvider implements ILlmProvider {
    private baseUrl: string;
    private timeout: number;
    private numCtx: number;

    constructor(
        apiKey: string,
        private model: string = 'llama3.2:1b',
        baseUrl: string = 'http://localhost:11434'
    ) {
        this.baseUrl = baseUrl;
        this.timeout = parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000');
        this.numCtx = parseInt(process.env.OLLAMA_NUM_CTX || '512');
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    messages: ollamaMessages,
                    stream: false,
                    options: {
                        num_ctx: this.numCtx,
                        num_gpu: 0,
                        num_thread: 2,
                        low_vram: true
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

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
            clearTimeout(timeoutId);
            console.error('[OllamaProvider] Error:', error.message);
            throw new Error(`Failed to connect to Ollama: ${error.message}`);
        }
    }
}