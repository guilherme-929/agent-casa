import fs from 'fs';
import path from 'path';
import { Bot } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

interface Task {
    id: string;
    title: string;
    datetime: string;
    description: string;
    priority: string;
    status: string;
    notified?: boolean;
}

export class NotificationService {
    private tasksPath: string;
    private bot: Bot;
    private checkInterval: number = 60000; // 1 minute
    private targetUserId: string;

    constructor(bot: Bot) {
        this.bot = bot;
        this.tasksPath = path.join(process.cwd(), 'tasks.json');
        
        // Grab the first allowed user ID as the target for proactive alerts
        const allowedIds = (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(',');
        this.targetUserId = allowedIds[0];
    }

    public start(): void {
        console.log('[NotificationService] Starting alert monitor...');
        setInterval(() => this.checkTasks(), this.checkInterval);
        // Initial check
        this.checkTasks();
    }

    private async checkTasks(): Promise<void> {
        if (!fs.existsSync(this.tasksPath)) return;

        try {
            const content = fs.readFileSync(this.tasksPath, 'utf-8');
            const tasks: Task[] = JSON.parse(content);
            const now = new Date();
            let hasChanges = false;

            for (const task of tasks) {
                if (task.status === 'Pendente' && !task.notified) {
                    const taskDate = new Date(task.datetime);
                    
                    // If it's time (or passed)
                    if (taskDate <= now) {
                        await this.sendAlert(task);
                        task.notified = true;
                        // Opcional: Podíamos mudar para 'Notificado' ou algo assim, 
                        // mas manter 'Pendente' e usar a flag 'notified' é mais seguro.
                        hasChanges = true;
                    }
                }
            }

            if (hasChanges) {
                fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
            }
        } catch (error) {
            console.error('[NotificationService] Error checking tasks:', error);
        }
    }

    private async sendAlert(task: Task): Promise<void> {
        if (!this.targetUserId) {
            console.warn('[NotificationService] No target user ID found for alerts');
            return;
        }

        const message = `🔔 **ALERTA DO GOKU!** 🔔\n\n` +
            `Mestre, está na hora do seu compromisso:\n\n` +
            `📌 **${task.title}**\n` +
            `⏰ Horário: ${new Date(task.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n` +
            `📝 Descrição: ${task.description}\n` +
            `🔥 Prioridade: ${task.priority}\n\n` +
            `_Não se atrase!_`;

        try {
            await this.bot.api.sendMessage(this.targetUserId, message, { parse_mode: 'Markdown' });
            console.log(`[NotificationService] Alert sent for task: ${task.title}`);
        } catch (error) {
            console.error('[NotificationService] Failed to send Telegram alert:', error);
        }
    }
}
