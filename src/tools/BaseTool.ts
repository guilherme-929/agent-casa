import { ToolDefinition } from '../types';

export abstract class BaseTool {
    public abstract definition: ToolDefinition;
    public abstract execute(args: any): Promise<string>;
}

export class ToolRegistry {
    private tools = new Map<string, BaseTool>();

    public register(tool: BaseTool): void {
        this.tools.set(tool.definition.name, tool);
    }

    public get(name: string): BaseTool | undefined {
        return this.tools.get(name);
    }

    public getAllDefinitions(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(t => t.definition);
    }
}
