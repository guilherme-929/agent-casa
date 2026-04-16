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

        const skillDirs = fs.readdirSync(this.skillsPath);
        const skills: Skill[] = [];

        for (const dir of skillDirs) {
            const skillFilePath = path.join(this.skillsPath, dir, 'SKILL.md');
            if (fs.existsSync(skillFilePath)) {
                const skill = this.parseSkillFile(skillFilePath, dir);
                if (skill) {
                    skills.push(skill);
                }
            }
        }

        return skills;
    }

    private parseSkillFile(filePath: string, dirName: string): Skill | null {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

            if (!match) return null;

            const frontmatter = yaml.load(match[1]) as any;
            const content = match[2];

            return {
                metadata: {
                    name: frontmatter.name || dirName,
                    description: frontmatter.description || '',
                    version: frontmatter.version,
                    id: dirName
                },
                content: content,
                path: filePath
            };
        } catch (error) {
            console.error(`Error parsing skill at ${filePath}:`, error);
            return null;
        }
    }
}
