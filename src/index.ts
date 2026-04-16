import { TelegramInputHandler } from './interfaces/TelegramInputHandler';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const handler = new TelegramInputHandler();

    handler.start().catch(err => {
        console.error('Fatal error starting the bot:', err);
        process.exit(1);
    });

    console.log('--- SandecoClaw (Agent-Casa) initialized ---');
}

main();
