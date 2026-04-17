import { Bot } from 'grammy';
import { TelegramInputHandler } from './interfaces/TelegramInputHandler';
import { NotificationService } from './services/NotificationService';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }

    const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
    const handler = new TelegramInputHandler(bot);
    const notifier = new NotificationService(bot);

    // Iniciar monitor de alertas
    notifier.start();

    // Iniciar bot
    handler.start().catch(err => {
        console.error('Fatal error starting the bot:', err);
        process.exit(1);
    });

    console.log('--- SandecoClaw (Agent-Casa) initialized with Goku Alerts ---');
}

main();
