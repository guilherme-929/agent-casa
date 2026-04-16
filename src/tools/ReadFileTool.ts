import { BaseTool } from './BaseTool';
import { ToolDefinition } from '../types';
import fs from 'fs';
import path from 'path';

export class ReadFileTool extends BaseTool {
    public definition: ToolDefinition = {
        name: 'read_file',
        description: 'Reads the content of a file.',
        parameters: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'The path of the file to read.'
                }
            },
            required: ['filePath']
        }
    };

    public async execute(args: { filePath: string }): Promise<string> {
        try {
            const fullPath = path.isAbsolute(args.filePath) 
                ? args.filePath 
                : path.join(process.cwd(), args.filePath);

            if (!fs.existsSync(fullPath)) {
                return `Error: File not found at ${args.filePath}`;
            }

            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                return `Error: ${args.filePath} is a directory. Use list_dir (if available) to see its contents.`;
            }

            const content = fs.readFileSync(fullPath, 'utf8');
            return content;
        } catch (error: any) {
            return `Error reading file: ${error.message}`;
        }
    }
}
