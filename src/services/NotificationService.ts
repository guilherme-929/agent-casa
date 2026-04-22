import fs from 'fs';
import path from 'path';
import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

interface Task {
    id: string;
    title: string;
    datetime: string;
    description: string;
    priority: string;
    status: string;
    notificationCount?: number;
    lastAlertAt?: string;
}

export class NotificationService {
    private tasksPath: string;
    private bot: Bot;
    private checkInterval: number = 60000; // 1 minute
    private targetUserId: string;

    constructor(bot: Bot) {
        this.bot = bot;
        this.tasksPath = path.join(process.cwd(), 'tasks.json');
        
        const allowedIds = (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(',');
        this.targetUserId = allowedIds[0];
    }

    public start(): void {
        console.log('[NotificationService] Starting alert monitor...');
        setInterval(() => this.checkTasks(), this.checkInterval);
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
                if (task.status === 'Pendente') {
                    const taskDate = new Date(task.datetime);
                    const count = task.notificationCount || 0;
                    const now = new Date();
                    
                    // Skip future tasks
                    if (taskDate > now) continue;
                    
                    // 1º Alerta (Horário Chegou)
                    if (count === 0) {
                        await this.sendAlert(task, 1);
                        task.notificationCount = 1;
                        task.lastAlertAt = now.toISOString();
                        hasChanges = true;
                    } 
                    // 2º Alerta (Reforço após 2 minutos)
                    else if (count === 1 && task.lastAlertAt) {
                        const lastAlert = new Date(task.lastAlertAt);
                        const diffMinutes = (now.getTime() - lastAlert.getTime()) / 60000;

                        if (diffMinutes >= 2) {
                            await this.sendAlert(task, 2);
                            task.notificationCount = 2;
                            task.lastAlertAt = now.toISOString();
                            hasChanges = true;
                        }
                    }
                    // Stop alerting after count >= 2
                }
            }

            if (hasChanges) {
                fs.writeFileSync(this.tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
            }
        } catch (error) {
            console.error('[NotificationService] Error checking tasks:', error);
        }
    }

    private async sendAlert(task: Task, alertNumber: number): Promise<void> {
        if (!this.targetUserId) return;

        const header = alertNumber === 1 
            ? '🔔 **HORA DO COMPROMISSO!** 🔔' 
            : '⚠️ **REFORÇO DE ALERTA!** ⚠️';

        const message = `${header}\n\nMestre, você tem uma tarefa agendada:\n\n` +
            `📌 **${task.title}**\n` +
            `⏰ Horário: ${new Date(task.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n` +
            `📝 Descrição: ${task.description}\n` +
            `🔥 Prioridade: ${task.priority}\n\n` +
            (alertNumber === 1 ? '_Vou te avisar novamente em 2 minutos se você não concluir!_' : '_Este é o último aviso para esta tarefa._');

        const keyboard = new InlineKeyboard()
            .text('✅ Concluir Tarefa', `done:${task.id}`);

        try {
            await this.bot.api.sendMessage(this.targetUserId, message, { 
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            console.log(`[NotificationService] Alert #${alertNumber} sent for task: ${task.title}`);
        } catch (error) {
            console.error('[NotificationService] Failed to send Telegram alert:', error);
        }
    }
}
