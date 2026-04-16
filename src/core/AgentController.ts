import { MemoryManager } from './MemoryManager';
import { ProviderFactory } from './ProviderFactory';
import { SkillLoader } from '../skills/SkillLoader';
import { SkillRouter } from '../skills/SkillRouter';
import { AgentLoop } from './AgentLoop';
import { ToolRegistry } from '../tools/BaseTool';
import { FileTool } from '../tools/FileTool';
import { ReadFileTool } from '../tools/ReadFileTool';
import { ShellTool } from '../tools/ShellTool';
import { PdfParserTool } from '../tools/PdfParserTool';
import { ChatMessage } from '../types';
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

    private isSimpleGreeting(text: string): boolean {
        const greetings = ['oi', 'ola', 'olá', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'eai', 'e aí'];
        const normalized = text.toLowerCase().trim().replace(/[?!.]/g, '');
        return greetings.includes(normalized) || text.length < 5;
    }

    public async processMessage(userId: string, username: string, text: string): Promise<string> {
        console.log(`[AgentController] Processing message from ${username} (${userId})`);

        const provider = this.getDefaultProvider();
        const isGreeting = this.isSimpleGreeting(text);
        
        // 1. Get/Set context
        // If it's a greeting, we only need a tiny slice of history
        const historyLimit = isGreeting ? 3 : 20;
        const { conversation, history } = await this.memoryManager.getContext(userId, provider);
        const slicedHistory = history.slice(-historyLimit);

        let skill = null;
        if (!isGreeting) {
            // 2. Load Skills
            const availableSkills = this.skillLoader.loadAll();

            // 3. Select Provider for Routing
            const routerProvider = ProviderFactory.create(provider);
            const skillRouter = new SkillRouter(routerProvider);

            // 4. Identify Skill
            skill = await skillRouter.route(text, availableSkills);
            if (skill) {
                console.log(`[AgentController] Skill identified: ${skill.metadata.name}`);
            }
        } else {
            console.log(`[AgentController] Simple greeting detected. Bypassing skill routing.`);
        }

        // 5. Initialize Main Provider for Reasoning
        const mainProvider = ProviderFactory.create(provider);
        const loopToolRegistry = isGreeting ? new ToolRegistry() : this.toolRegistry;
        const agentLoop = new AgentLoop(mainProvider, loopToolRegistry);

        // 6. Prepare Messages
        const messages: ChatMessage[] = [
            ...slicedHistory.map(h => ({ role: h.role as any, content: h.content })),
            { role: 'user', content: text }
        ];

        // 7. Run Loop
        // Provide skill content only if skill was identified
        const response = await agentLoop.run(messages, skill?.content);

        // 8. Persist
        await this.memoryManager.saveMessage(conversation.id, 'user', text);
        await this.memoryManager.saveMessage(conversation.id, 'assistant', response);

        return response;
    }
}
