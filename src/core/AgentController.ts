import { MemoryManager } from './MemoryManager';
import { ProviderFactory } from './ProviderFactory';
import { SkillLoader, Skill } from '../skills/SkillLoader';
import { SkillRouter } from '../skills/SkillRouter';
import { AgentLoop } from './AgentLoop';
import { ToolRegistry } from '../tools/BaseTool';
import { FileTool } from '../tools/FileTool';
import { ReadFileTool } from '../tools/ReadFileTool';
import { ShellTool } from '../tools/ShellTool';
import { PdfParserTool } from '../tools/PdfParserTool';
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

        // 3. Select Provider for Routing
        const routerProvider = ProviderFactory.create(provider);
        const skillRouter = new SkillRouter(routerProvider);

        // 4. Identify Skill
        let skill = await skillRouter.route(text, availableSkills);
        
        // Se não identificar skill específica, usa o orchestrator como default
        if (!skill) {
            skill = availableSkills.find(s => s.metadata.id === 'orchestrator') || null;
            if (skill) {
                console.log(`[AgentController] No specific skill identified. Using Orchestrator as default.`);
            }
        }
        
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
        if (skill.metadata.id === 'orchestrator') {
            // Orchestrator usa seu próprio prompt
            const mainProvider = ProviderFactory.create(provider);
            const agentLoop = new AgentLoop(mainProvider, this.toolRegistry);
            response = await agentLoop.run(messages, skill.content);
        } else {
            // Outras skills usam only their content (não o orchestrator)
            const mainProvider = ProviderFactory.create(provider);
            const agentLoop = new AgentLoop(mainProvider, this.toolRegistry);
            // Passa só o content da skill, sem o prompt do Orchestrator
            response = await agentLoop.run(messages, skill.content);
        }

        // 8. CHAINING: After conteudo-shopee, automatically call video-shopee
        if (skill.metadata.id === 'conteudo-shopee') {
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

        // 9. Persist
        await this.memoryManager.saveMessage(conversation.id, 'user', text);
        await this.memoryManager.saveMessage(conversation.id, 'assistant', response);

        await logResponse(userId, username, response, skill?.metadata.name || 'unknown').catch(() => {});

        return response;
    }
}
