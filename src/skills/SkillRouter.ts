import { ILlmProvider, ChatMessage } from '../types';
import { Skill } from './SkillLoader';

export class SkillRouter {
    constructor(private provider: ILlmProvider) {}

    public async route(userInput: string, availableSkills: Skill[]): Promise<Skill | null> {
        if (availableSkills.length === 0) return null;

        const skillsSummary = availableSkills.map(s => {
            return `ID: ${s.metadata.id}\nName: ${s.metadata.name}\nDescription: ${s.metadata.description}\n---`;
        }).join('\n');

        const systemPrompt = `
You are a skill router for an AI agent. Your task is to identify which skill (if any) is best suited to handle the user's request.
Available skills:
${skillsSummary}

If a skill is a good match, respond ONLY with the skill ID in JSON format: {"skillId": "..."}.
If no skill is a clear match, respond with {"skillId": null}.
        `;

        const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userInput }
        ];

        try {
            const response = await this.provider.generateResponse(messages, undefined, true);
            if (!response.content) return null;

            const result = JSON.parse(response.content.match(/\{.*\}/)?.[0] || '{}');
            const skillId = result.skillId;

            return availableSkills.find(s => s.metadata.id === skillId) || null;
        } catch (error) {
            console.error('Error routing skill:', error);
            return null;
        }
    }
}
