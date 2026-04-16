import { BaseTool } from './BaseTool';
import { ToolDefinition } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ShellTool extends BaseTool {
    public definition: ToolDefinition = {
        name: 'shell',
        description: 'Executes a shell command on the local system.',
        parameters: {
            type: 'object',
            properties: {
                command: {
                    type: 'string',
                    description: 'The command to execute.'
                }
            },
            required: ['command']
        }
    };

    public async execute(args: { command: string }): Promise<string> {
        try {
            console.log(`[ShellTool] Executing: ${args.command}`);
            const { stdout, stderr } = await execAsync(args.command);
            
            if (stderr && !stdout) {
                return `Error: ${stderr}`;
            }
            
            return stdout || stderr || 'Command executed successfully (no output).';
        } catch (error: any) {
            return `Error executing command: ${error.message}`;
        }
    }
}
