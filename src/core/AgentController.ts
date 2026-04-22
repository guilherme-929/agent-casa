import { MemoryManager } from './MemoryManager';
import { ProviderFactory } from './ProviderFactory';
import { SkillLoader, Skill } from '../skills/SkillLoader';
import { AgentLoop } from './AgentLoop';
import { ToolRegistry } from '../tools/BaseTool';
import { FileTool } from '../tools/FileTool';
import { ReadFileTool } from '../tools/ReadFileTool';
import { ShellTool } from '../tools/ShellTool';
import { PdfParserTool } from '../tools/PdfParserTool';
import { TaskTool } from '../tools/TaskTool';
import { ChatMessage } from '../types';
import { logMessage, logAgentSelected, logResponse } from '../dashboard/client';
import dotenv from 'dotenv';

dotenv.config();

export class AgentController {
    private memoryManager = new MemoryManager();
    private skillLoader = new SkillLoader();
    private toolRegistry = new ToolRegistry();

    constructor() {
        // Register default tools
        this.toolRegistry.register(new FileTool());
        this.toolRegistry.register(new ReadFileTool());
        this.toolRegistry.register(new ShellTool());
        this.toolRegistry.register(new PdfParserTool());
        this.toolRegistry.register(new TaskTool());
    }

    private getDefaultProvider(): string {
        return process.env.DEFAULT_PROVIDER || 'groq';
    }

    private async runSkill(text: string, skillName: string, availableSkills: Skill[], messages: ChatMessage[]): Promise<{ response: string; skill: any }> {
        const skill = availableSkills.find(s => s.metadata.id === skillName);
        if (!skill) {
            throw new Error(`Skill ${skillName} not found`);
        }

        const provider = this.getDefaultProvider();
        const mainProvider = ProviderFactory.create(provider);
        const agentLoop = new AgentLoop(mainProvider, this.toolRegistry);

        console.log(`[AgentController] Running skill: ${skill.metadata.name}`);
        await logAgentSelected('', '', text, skill.metadata.name).catch(() => {});

        const response = await agentLoop.run(messages, skill.content);
        
        return { response, skill };
    }

    public async processMessage(userId: string, username: string, text: string): Promise<string> {
        console.log(`[AgentController] Processing message from ${username} (${userId})`);

        await logMessage(userId, username, text).catch(() => {});

        const provider = this.getDefaultProvider();
        
        // 1. Get/Set context
        const historyLimit = 10;
        const { conversation, history } = await this.memoryManager.getContext(userId, provider);
        const slicedHistory = history.slice(-historyLimit);

        // 2. Load Skills
        const availableSkills = this.skillLoader.loadAll();

        // 3. ALWAYS use Orchestrator first to decide which skill to use
        let skill = availableSkills.find(s => s.metadata.id === 'orchestrator') || null;
        
        if (!skill) {
            throw new Error('Orchestrator skill not found');
        }
        
        console.log(`[AgentController] Using Orchestrator to route request.`);
        
        if (skill) {
            console.log(`[AgentController] Skill identified: ${skill.metadata.name}`);
            await logAgentSelected(userId, username, text, skill.metadata.name).catch(() => {});
        } else {
            console.log(`[AgentController] No skill available.`);
            throw new Error('Nenhum agente disponível');
        }

        // 5. Prepare Messages
        const messages: ChatMessage[] = [
            ...slicedHistory.map(h => ({ role: h.role as any, content: h.content })),
            { role: 'user', content: text }
        ];

        // 6. Run main skill (sem o system prompt do orchestrator se for uma skill específica)
        let response: string;
        let chainedSkill: string | null = null;
        
        if (skill.metadata.id === 'orchestrator') {
            // Orchestrator usa seu próprio prompt
            const mainProvider = ProviderFactory.create(provider);
            const agentLoop = new AgentLoop(mainProvider, this.toolRegistry);
            response = await agentLoop.run(messages, skill.content);
            
            // Parse: identificar se o orchestrator indica qual agente chamar
            // Formatos aceitos: "→video-shopee", "[video-shopee]", "→ goku", "[goku]"
            // OU formato: "AGENTE: conteudo-shopee"
            let delegateMatch = response.match(/(?:→|\[)\s*(\w+(?:-\w+)?)\s*(?:\]|)/i);
            if (!delegateMatch) {
                delegateMatch = response.match(/^AGENTE:\s*(\w+(?:-\w+)?)\s*$/m);
            }
            if (delegateMatch) {
                chainedSkill = delegateMatch[1].toLowerCase();
                console.log(`[AgentController] Orchestrator delegating to: ${chainedSkill}`);
            }
        } else {
            // Outras skills usam only their content (não o orchestrator)
            const mainProvider = ProviderFactory.create(provider);
            const agentLoop = new AgentLoop(mainProvider, this.toolRegistry);
            response = await agentLoop.run(messages, skill.content);
        }

        // 7. CHAINING: After conteudo-shopee, automatically call video-shopee
        if (skill.metadata.id === 'conteudo-shopee' || chainedSkill === 'video-shopee') {
            console.log(`[AgentController] Chaining: calling video-shopee`);
            
            try {
                const videoMessages: ChatMessage[] = [
                    { role: 'user', content: `Com base neste produto, crie o roteiro do vídeo:\n\n${response}` }
                ];
                
                const videoResult = await this.runSkill(text, 'video-shopee', availableSkills, videoMessages);
                
                response = `## 📦 CONTEÚDO CRIADO\n\n${response}\n\n---\n\n## 🎬 ROTEIRO DE VÍDEO\n\n${videoResult.response}`;
                
                await logAgentSelected(userId, username, text, 'video-shopee').catch(() => {});
            } catch (videoError: any) {
                console.error('[AgentController] Chaining error:', videoError.message);
                response += `\n\n⚠️ *Aviso: O roteiro de vídeo não pôde ser gerado automaticamente. Solicite novamente mais tarde.*`;
            }
        }

        // 8. Delegate to other skill if orchestrator specified one
        if (chainedSkill && chainedSkill !== 'video-shopee' && chainedSkill !== skill.metadata.id) {
            console.log(`[AgentController] Delegating to: ${chainedSkill}`);
            
            try {
                const delegateMessages: ChatMessage[] = [
                    { role: 'user', content: text }
                ];
                
                const delegateResult = await this.runSkill(text, chainedSkill, availableSkills, delegateMessages);
                
                response = delegateResult.response;
                
                await logAgentSelected(userId, username, text, chainedSkill).catch(() => {});
            } catch (delegateError: any) {
                console.error('[AgentController] Delegate error:', delegateError.message);
            }
        }

        // 9. Persist
        await this.memoryManager.saveMessage(conversation.id, 'user', text);
        await this.memoryManager.saveMessage(conversation.id, 'assistant', response);

        await logResponse(userId, username, response, skill?.metadata.name || 'unknown').catch(() => {});

        const finalResponse = this.cleanResponse(response);
        
        return finalResponse;
    }

    private cleanResponse(response: string): string {
        return response
            .replace(/→\s*\w+(?:-\w+)?\s*$/gm, '')
            .replace(/\[fim\]\s*$/gm, '')
            .replace(/\n\s*[-−*]\s*(?:video-shopee|pesquisa-produto|goku|infra-n8n)\s*$/gim, '')
            .trim();
    }
}
