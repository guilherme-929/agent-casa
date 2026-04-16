import { ILlmProvider } from '../types';
import { GeminiProvider } from './GeminiProvider';
import { OpenAiProvider } from './OpenAiProvider';
import dotenv from 'dotenv';

dotenv.config();

export class ProviderFactory {
    public static create(provider?: string): ILlmProvider {
        const targetProvider = provider || process.env.DEFAULT_PROVIDER || 'gemini';

        switch (targetProvider.toLowerCase()) {
            case 'gemini':
                if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not defined');
                return new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL);
            
            case 'deepseek':
                if (!process.env.DEEPSEEK_API_KEY) throw new Error('DEEEPSEEK_API_KEY is not defined');
                return new OpenAiProvider(process.env.DEEPSEEK_API_KEY, 'https://api.deepseek.com', 'deepseek-chat');
            
            case 'groq':
                if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not defined');
                return new OpenAiProvider(process.env.GROQ_API_KEY, 'https://api.groq.com/openai/v1', process.env.GROQ_MODEL || 'llama-3.3-70b-versatile');
            
            default:
                throw new Error(`Provider ${targetProvider} not supported`);
        }
    }
}
