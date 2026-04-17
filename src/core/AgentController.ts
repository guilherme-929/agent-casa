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

    public async processMessage(userId: string, username: string, text: string): Promise<string> {
        console.log(`[AgentController] Processing message from ${username} (${userId})`);

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
        if (skill) {
            console.log(`[AgentController] Skill identified: ${skill.metadata.name}`);
        } else {
            console.log(`[AgentController] No specific skill identified. Proceeding as Mestre Kami.`);
        }

        // 5. Initialize Main Provider for Reasoning
        const mainProvider = ProviderFactory.create(provider);
        const agentLoop = new AgentLoop(mainProvider, this.toolRegistry);

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
