export interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tool_call_id?: string;
    name?: string;
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: any;
}

export interface ProviderResponse {
    content: string | null;
    toolCalls?: ToolCall[];
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: any;
}

export interface ILlmProvider {
    generateResponse(messages: ChatMessage[], tools?: ToolDefinition[], jsonMode?: boolean): Promise<ProviderResponse>;
}
