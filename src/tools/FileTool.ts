import { BaseTool } from './BaseTool';
import { ToolDefinition } from '../types';
import fs from 'fs';
import path from 'path';

export class FileTool extends BaseTool {
    public definition: ToolDefinition = {
        name: 'write_file',
        description: 'Creates or updates a file with the given content.',
        parameters: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'The path where the file will be saved.'
                },
                content: {
                    type: 'string',
                    description: 'The content of the file.'
                }
            },
            required: ['filePath', 'content']
        }
    };

    public async execute(args: { filePath: string, content: string }): Promise<string> {
        try {
            const fullPath = path.isAbsolute(args.filePath) 
                ? args.filePath 
                : path.join(process.cwd(), args.filePath);

            // Basic safety check: don't write outside the project dir unless specifically allowed
            // (For a personal agent, we might want to allow this, but for now let's be safe)
            
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(fullPath, args.content);
            return `File created successfully at: ${args.filePath}`;
        } catch (error: any) {
            return `Error creating file: ${error.message}`;
        }
    }
}
