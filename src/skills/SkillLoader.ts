import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface SkillMetadata {
    name: string;
    description: string;
    version?: string;
    id: string;
}

export interface Skill {
    metadata: SkillMetadata;
    content: string;
    path: string;
}

export class SkillLoader {
    private skillsPath = path.join(process.cwd(), '.agents', 'skills');

    public loadAll(): Skill[] {
        if (!fs.existsSync(this.skillsPath)) {
            fs.mkdirSync(this.skillsPath, { recursive: true });
            return [];
        }

        const items = fs.readdirSync(this.skillsPath);
        const skills: Skill[] = [];

        for (const item of items) {
            const itemPath = path.join(this.skillsPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                const skillFilePath = path.join(itemPath, 'SKILL.md');
                if (fs.existsSync(skillFilePath)) {
                    const skill = this.parseSkillFile(skillFilePath, item);
                    if (skill) skills.push(skill);
                }
            } else if (stat.isFile() && item.endsWith('.md')) {
                const skillName = item.replace('.md', '');
                const skill = this.parseSkillFile(itemPath, skillName);
                if (skill) skills.push(skill);
            }
        }

        return skills;
    }

    private parseSkillFile(filePath: string, dirName: string): Skill | null {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

            let metadata: SkillMetadata;
            let contentStr: string;

            if (match) {
                const frontmatter = yaml.load(match[1]) as any || {};
                metadata = {
                    name: frontmatter.name || dirName,
                    description: frontmatter.description || 'Nenhuma descrição.',
                    version: frontmatter.version,
                    id: dirName
                };
                contentStr = match[2];
            } else {
                // Fallback para arquivos sem frontmatter YAML
                metadata = {
                    name: dirName,
                    description: 'Skill carregada diretamente do markdown sem metadata.',
                    id: dirName
                };
                contentStr = fileContent;
            }

            return {
                metadata,
                content: contentStr,
                path: filePath
            };
        } catch (error) {
            console.error(`Error parsing skill at ${filePath}:`, error);
            return null;
        }
    }
}
