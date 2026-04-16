import { ILlmProvider, ChatMessage, ToolDefinition, ProviderResponse } from '../types';
import { spawn, ChildProcess } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

export class OpenCodeProvider implements ILlmProvider {
    private model: string;

    constructor() {
        this.model = process.env.OPENCODE_MODEL || 'coder';
    }

    public async generateResponse(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ProviderResponse> {
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const conversation = messages.filter(m => m.role !== 'system');

        let prompt = '';
        if (systemMessage) {
            prompt += `System: ${systemMessage}\n\n`;
        }

        for (const msg of conversation) {
            prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        }

        if (tools && tools.length > 0) {
            prompt += `\nYou have access to these tools:\n`;
            for (const tool of tools) {
                prompt += `- ${tool.name}: ${tool.description}\n`;
            }
        }

        prompt += '\nAssistant:';

        try {
            const result = await this.callOpenCode(prompt);
            return {
                content: result
            };
        } catch (error: any) {
            console.error('[OpenCodeProvider] Error:', error.message);
            return {
                content: `Error: ${error.message}`
            };
        }
    }

    private callOpenCode(prompt: string): Promise<string> {
        return new Promise((resolve, reject) => {
            console.log(`[OpenCodeProvider] Calling opencode run...`);

            const opencode: ChildProcess = spawn(
                'opencode',
                ['run', '--model', this.model, prompt],
                {
                    shell: true,
                    stdio: ['pipe', 'pipe', 'pipe']
                }
            );

            let output = '';
            let errorOutput = '';

            opencode.stdout?.on('data', (data: Buffer) => {
                output += data.toString();
            });

            opencode.stderr?.on('data', (data: Buffer) => {
                errorOutput += data.toString();
            });

            opencode.on('close', (code: number | null) => {
                if (code === 0) {
                    resolve(output.trim());
                } else {
                    reject(new Error(errorOutput || `Process exited with code ${code}`));
                }
            });

            opencode.on('error', (err: Error) => {
                reject(err);
            });

            // Timeout after 60 seconds
            setTimeout(() => {
                opencode.kill();
                reject(new Error('OpenCode timeout'));
            }, 60000);
        });
    }
}