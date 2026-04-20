import fs from 'fs';
import path from 'path';

export function getMestreKamiPrompt(): string {
    const orchestratorPath = path.join(process.cwd(), '.agents', 'skills', 'orchestrator', 'SKILL.md');
    
    if (!fs.existsSync(orchestratorPath)) {
        return `Você é o Orchestrator, o agente central deste sistema. Responda diretamente ao usuário.`;
    }

    try {
        const fileContent = fs.readFileSync(orchestratorPath, 'utf-8');
        const match = fileContent.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
        return match ? match[1].trim() : fileContent.trim();
    } catch (e) {
        return `Você é o Orchestrator. Responda diretamente.`;
    }
}