import { Bot, Context, InputFile } from 'grammy';
import { AgentController } from '../core/AgentController';
import { TelegramOutputHandler } from './TelegramOutputHandler';
import { AudioService } from '../services/AudioService';
import { DocumentParser } from '../services/DocumentParser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export interface ProcessedInput {
    userId: string;
    username: string;
    text: string;
    requiresAudioReply: boolean;
    audioVoiceId?: string;
    metadata?: {
        fileName?: string;
        mimeType?: string;
    };
}

export class TelegramInputHandler {
    private bot: Bot;
    private controller: AgentController;
    private outputHandler: TelegramOutputHandler;
    private audioService: AudioService;
    private documentParser: DocumentParser;
    private allowedUserIds: string[];
    private tmpDir: string;

    constructor() {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            throw new Error('TELEGRAM_BOT_TOKEN is not defined');
        }

        this.bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
        this.controller = new AgentController();
        this.outputHandler = new TelegramOutputHandler(this.bot);
        this.audioService = new AudioService();
        this.documentParser = new DocumentParser();
        this.allowedUserIds = (process.env.TELEGRAM_ALLOWED_USER_IDS || '').split(',');
        this.tmpDir = path.join(process.cwd(), 'tmp');
        
        this.ensureTmpDir();
        this.setupHandlers();
    }

    private ensureTmpDir(): void {
        if (!fs.existsSync(this.tmpDir)) {
            fs.mkdirSync(this.tmpDir, { recursive: true });
        }
    }

    private setupHandlers(): void {
        this.bot.use(async (ctx, next) => {
            const userId = ctx.from?.id.toString();
            if (userId && this.allowedUserIds.includes(userId)) {
                return next();
            }
            console.warn(`[TelegramInputHandler] Unauthorized access attempt from user ${userId}`);
        });

        this.bot.on('message:text', async (ctx) => {
            const userId = ctx.from.id.toString();
            const username = ctx.from.username || ctx.from.first_name;
            const text = ctx.message.text;

            const hasAudioTrigger = /responda e[m|ã]o|a(?:udio)|fale com(?:igo)?m?i?g?o?|em voz/i.test(text);
            const processedInput: ProcessedInput = {
                userId,
                username,
                text,
                requiresAudioReply: hasAudioTrigger
            };

            await this.handleInput(ctx, processedInput);
        });

        this.bot.on('message:voice', async (ctx) => {
            const userId = ctx.from.id.toString();
            const username = ctx.from.username || ctx.from.first_name;
            
            await ctx.replyWithChatAction('record_voice');

            try {
                const file = await ctx.api.getFile(ctx.message.voice.file_id);
                const filePath = await this.audioService.downloadAudio(file, this.tmpDir);
                
                const transcription = await this.audioService.transcribe(filePath);
                
                this.cleanupTempFile(filePath);

                if (!transcription || transcription.trim() === '') {
                    await ctx.reply('Áudio vazio captado. Pode reenviar?');
                    return;
                }

                console.log(`[TelegramInputHandler] Transcript: ${transcription}`);

                const processedInput: ProcessedInput = {
                    userId,
                    username,
                    text: transcription,
                    requiresAudioReply: true,
                    audioVoiceId: 'pt-BR-ThalitaMultilingualNeural'
                };

                await this.handleInput(ctx, processedInput);
            } catch (error: any) {
                console.error('[TelegramInputHandler] Error processing voice:', error);
                await ctx.reply(`⚠️ Falha ao processar o áudio: ${error.message}`);
            }
        });

        this.bot.on('message:audio', async (ctx) => {
            const userId = ctx.from.id.toString();
            const username = ctx.from.username || ctx.from.first_name;
            
            await ctx.replyWithChatAction('record_voice');

            try {
                const file = await ctx.api.getFile(ctx.message.audio.file_id);
                const filePath = await this.audioService.downloadAudio(file, this.tmpDir);
                
                const transcription = await this.audioService.transcribe(filePath);
                
                this.cleanupTempFile(filePath);

                if (!transcription || transcription.trim() === '') {
                    await ctx.reply('Áudio vazio captado. Pode reenviar?');
                    return;
                }

                const processedInput: ProcessedInput = {
                    userId,
                    username,
                    text: transcription,
                    requiresAudioReply: true,
                    audioVoiceId: 'pt-BR-ThalitaMultilingualNeural'
                };

                await this.handleInput(ctx, processedInput);
            } catch (error: any) {
                console.error('[TelegramInputHandler] Error processing audio:', error);
                await ctx.reply(`⚠️ Falha ao processar o áudio: ${error.message}`);
            }
        });

        this.bot.on('message:document', async (ctx) => {
            const userId = ctx.from.id.toString();
            const username = ctx.from.username || ctx.from.first_name;
            const document = ctx.message.document;
            const fileName = document.file_name || '';
            const mimeType = document.mime_type || '';

            if (!fileName.endsWith('.pdf') && !fileName.endsWith('.md')) {
                await ctx.reply('⚠️ No momento, só consigo processar texto estruturado (.md), áudio e PDF.');
                return;
            }

            await ctx.replyWithChatAction('typing');

            try {
                const file = await ctx.api.getFile(document.file_id);
                const filePath = await this.downloadFile(file, this.tmpDir, fileName);
                
                let textContent: string;
                if (fileName.endsWith('.pdf')) {
                    textContent = await this.documentParser.parsePdf(filePath);
                } else {
                    textContent = fs.readFileSync(filePath, 'utf-8');
                }

                this.cleanupTempFile(filePath);

                const caption = ctx.message.caption || '';
                const fullText = caption ? `${caption}\n\n---Document---\n${textContent}` : textContent;

                const processedInput: ProcessedInput = {
                    userId,
                    username,
                    text: fullText,
                    requiresAudioReply: false,
                    metadata: {
                        fileName,
                        mimeType
                    }
                };

                await this.handleInput(ctx, processedInput);
            } catch (error: any) {
                console.error('[TelegramInputHandler] Error processing document:', error);
                await ctx.reply(`⚠️ Falha ao processar o documento: ${error.message}`);
            }
        });
    }

    private async handleInput(ctx: Context, input: ProcessedInput): Promise<void> {
        await ctx.replyWithChatAction('typing');

        try {
            const response = await this.controller.processMessage(
                input.userId,
                input.username,
                input.text
            );

            await this.outputHandler.sendResponse(ctx, response, {
                requiresAudioReply: input.requiresAudioReply,
                voiceId: input.audioVoiceId
            });
        } catch (error: any) {
            console.error('[TelegramInputHandler] Error processing message:', error);
            await ctx.reply(`⚠️ Erro: ${error.message}`);
        }
    }

    private async downloadFile(file: any, tmpDir: string, fileName: string): Promise<string> {
        const filePath = path.join(tmpDir, fileName);
        const content = await file.getUrl();
        const response = await fetch(content);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        return filePath;
    }

    private cleanupTempFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error(`[TelegramInputHandler] Failed to cleanup temp file: ${filePath}`, error);
        }
    }

    public async start(): Promise<void> {
        console.log('[TelegramInputHandler] Starting bot polling...');
        this.bot.start();
    }
}