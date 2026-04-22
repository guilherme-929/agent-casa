import { BaseTool } from './BaseTool';
import { ToolDefinition } from '../types';
import fs from 'fs';
import path from 'path';

interface Task {
    id: string;
    title: string;
    datetime: string;
    description: string;
    priority: string;
    status: string;
    notificationCount?: number;
    lastAlertAt?: string;
    notified?: boolean;
}

export class TaskTool extends BaseTool {
    private tasksPath: string;

    constructor() {
        super();
        this.tasksPath = path.join(process.cwd(), 'tasks.json');
    }

    public definition: ToolDefinition = {
        name: 'manage_tasks',
        description: 'Manage tasks: create, list, update status, or delete tasks. Use this for any task management.',
        parameters: {
            type: 'object',
            properties: {
                action: {
                    type: 'string',
                    description: 'Action to perform: create, list, update, delete, or complete'
                },
                title: {
                    type: 'string',
                    description: 'Task title (for create)'
                },
                datetime: {
                    type: 'string',
                    description: 'Date and time in ISO format (YYYY-MM-DDTHH:MM:SS) or natural language (for create)'
                },
                description: {
                    type: 'string',
                    description: 'Task description (for create)'
                },
                priority: {
                    type: 'string',
                    description: 'Priority: Alta, Média, or Baixa (for create)'
                },
                taskId: {
                    type: 'string',
                    description: 'Task ID (for update, delete, or complete)'
                },
                status: {
                    type: 'string',
                    description: 'New status: Pendente, Concluída, or Cancelada (for update)'
                }
            },
            required: ['action']
        }
    };

    public async execute(args: {
        action: string;
        title?: string;
        datetime?: string;
        description?: string;
        priority?: string;
        taskId?: string;
        status?: string;
    }): Promise<string> {
        try {
            const action = args.action;
            
            if (action === 'create') {
                if (!args.title) return 'Error: title is required for create';
                return this.createTask({
                    title: args.title,
                    datetime: args.datetime,
                    description: args.description,
                    priority: args.priority
                });
            }
            
            if (action === 'list') {
                return this.listTasks();
            }
            
            if (action === 'update') {
                if (!args.taskId) return 'Error: taskId is required for update';
                return this.updateTask({
                    taskId: args.taskId,
                    status: args.status,
                    title: args.title,
                    description: args.description,
                    priority: args.priority
                });
            }
            
            if (action === 'delete') {
                if (!args.taskId) return 'Error: taskId is required for delete';
                return this.deleteTask({ taskId: args.taskId });
            }
            
            if (action === 'complete') {
                if (!args.taskId) return 'Error: taskId is required for complete';
                return this.completeTask({ taskId: args.taskId });
            }
            
            return `Unknown action: ${action}. Use: create, list, update, delete, or complete`;
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }

    private generateTaskId(title: string, datetime: string): string {
        const datePart = datetime ? datetime.split('T')[0].replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
        const timePart = datetime && datetime.includes('T') ? datetime.split('T')[1].substring(0, 5).replace(':', '') : '0000';
        const slug = title.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 10);
        return `task-${datePart}-${timePart}-${slug}`;
    }

    private normalize(text: string): string {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }

    private parseDatetime(datetime: string): string {
        if (!datetime) return new Date().toISOString();

        const now = new Date();
        const lower = datetime.toLowerCase();

        if (lower.includes('amanhã') || lower.includes('amanha')) {
            now.setDate(now.getDate() + 1);
        }

        const timeMatch = datetime.match(/(\d{1,2})[:h](\d{2})?/);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            now.setHours(hours, minutes, 0, 0);
        }

        return now.toISOString();
    }

    private createTask(args: {
        title: string;
        datetime?: string;
        description?: string;
        priority?: string;
    }): string {
        let tasks: Task[] = [];

        if (fs.existsSync(this.tasksPath)) {
            const content = fs.readFileSync(this.tasksPath, 'utf-8');
            tasks = JSON.parse(content);
        }

        const taskdatetime = this.parseDatetime(args.datetime || '');
        const newTaskId = this.generateTaskId(args.title, taskdatetime);

        // Check for duplicate
        const existingTask = tasks.find(t => t.id === newTaskId);
        if (existingTask) {
            return `⚠️ Task already exists: "${args.title}" for ${new Date(taskdatetime).toLocaleString('pt-BR')}`;
        }

        const newTask: Task = {
            id: newTaskId,
            title: args.title,
            datetime: taskdatetime,
            description: args.description || '',
            priority: args.priority || 'Média',
            status: 'Pendente',
            notificationCount: 0
        };

        tasks.push(newTask);
        fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');

        return `✅ Task created: "${args.title}" for ${new Date(taskdatetime).toLocaleString('pt-BR')}`;
    }

    private listTasks(): string {
        if (!fs.existsSync(this.tasksPath)) {
            return 'No tasks found.';
        }

        const content = fs.readFileSync(this.tasksPath, 'utf-8');
        const tasks: Task[] = JSON.parse(content);

        if (tasks.length === 0) {
            return 'No tasks found.';
        }

        const pending = tasks.filter(t => t.status === 'Pendente');
        const completed = tasks.filter(t => t.status === 'Concluída');

        let output = '## Tasks\n\n';
        output += '### Pending (' + pending.length + ')\n';
        for (const task of pending) {
            const date = new Date(task.datetime).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            output += `- [${task.id}] ${task.title} (${date}) - ${task.priority}\n`;
        }

        output += '\n### Completed (' + completed.length + ')\n';
        for (const task of completed) {
            output += `- ${task.title}\n`;
        }

        return output;
    }

    private updateTask(args: { taskId: string; status?: string; title?: string; description?: string; priority?: string }): string {
        if (!fs.existsSync(this.tasksPath)) {
            return 'No tasks found.';
        }

        const content = fs.readFileSync(this.tasksPath, 'utf-8');
        let tasks: Task[] = JSON.parse(content);

        const index = tasks.findIndex(t => t.id === args.taskId);
        if (index === -1) {
            return 'Task not found: ' + args.taskId;
        }

        if (args.status) tasks[index].status = args.status;
        if (args.title) tasks[index].title = args.title;
        if (args.description) tasks[index].description = args.description;
        if (args.priority) tasks[index].priority = args.priority;

        fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');

        return 'Task updated: ' + args.taskId;
    }

    private deleteTask(args: { taskId: string }): string {
        if (!fs.existsSync(this.tasksPath)) {
            return 'No tasks found.';
        }

        const content = fs.readFileSync(this.tasksPath, 'utf-8');
        let tasks: Task[] = JSON.parse(content);

        const index = tasks.findIndex(t => t.id === args.taskId);
        if (index === -1) {
            return 'Task not found: ' + args.taskId;
        }

        tasks.splice(index, 1);
        fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');

        return 'Task deleted: ' + args.taskId;
    }

    private completeTask(args: { taskId: string }): string {
        return this.updateTask({ ...args, status: 'Concluída' });
    }
}