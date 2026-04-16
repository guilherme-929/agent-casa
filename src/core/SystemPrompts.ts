import fs from 'fs';
import path from 'path';

export function getMestreKamiPrompt(): string {
    const kamiPath = path.join(process.cwd(), '.agents', 'skills', 'mestre-kami', 'skill.md');
    const kamiPathUpper = path.join(process.cwd(), '.agents', 'skills', 'mestre-kami', 'SKILL.md');
    
    let filePath = '';
    if (fs.existsSync(kamiPathUpper)) {
        filePath = kamiPathUpper;
    } else if (fs.existsSync(kamiPath)) {
        filePath = kamiPath;
    }

    if (!filePath) {
        return `Você é o Mestre Kami, o Agent Orquestrador central do sistema Antigravity. Emita suas respostas de forma direta.`;
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // Remover frontmatter
        const match = fileContent.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
        return match ? match[1].trim() : fileContent.trim();
    } catch (e) {
        return `Você é o Mestre Kami. Erro ao ler seu prompt local.`;
    }
}
