import { Bot, Context, InputFile } from 'grammy';
import { AudioService } from '../services/AudioService';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export interface OutputOptions {
    requiresAudioReply?: boolean;
    voiceId?: string;
    fileName?: string;
}

export class TelegramOutputHandler {
    private bot: Bot;
    private audioService: AudioService;
    private tmpDir: string;
    private maxChunkSize = 4000;

    constructor(bot: Bot) {
        this.bot = bot;
        this.audioService = new AudioService();
        this.tmpDir = path.join(process.cwd(), 'tmp');
    }

    public async sendResponse(
        ctx: Context,
        response: string,
        options: OutputOptions = {}
    ): Promise<void> {
        const { requiresAudioReply, voiceId, fileName } = options;

        if (requiresAudioReply && voiceId) {
            await this.sendAudioResponse(ctx, response, voiceId);
            return;
        }

        if (response.length > this.maxChunkSize) {
            await this.sendChunkedResponse(ctx, response);
            return;
        }

        try {
            await ctx.reply(response, { parse_mode: 'Markdown' });
        } catch {
            await ctx.reply(response);
        }
    }

    private async sendAudioResponse(
        ctx: Context,
        text: string,
        voiceId: string
    ): Promise<void> {
        try {
            await ctx.replyWithChatAction('record_voice');

            const cleanedText = this.stripMarkdown(text);
            const audioPath = await this.audioService.synthesize(cleanedText, voiceId, this.tmpDir);

            await ctx.replyWithVoice(new InputFile(audioPath));

            this.cleanupTempFile(audioPath);
        } catch (error: any) {
            console.error('[TelegramOutputHandler] Error generating audio:', error);
            await ctx.reply(`⚠️ Falha ao gerar áudio: ${error.message}`);
            await ctx.reply(text);
        }
    }

    private async sendChunkedResponse(ctx: Context, response: string): Promise<void> {
        const chunks = this.chunkText(response, this.maxChunkSize);
        
        for (const chunk of chunks) {
            try {
                await ctx.reply(chunk, { parse_mode: 'Markdown' });
            } catch {
                await ctx.reply(chunk);
            }
        }
    }

    private chunkText(text: string, maxSize: number): string[] {
        const chunks: string[] = [];
        let currentChunk = '';
        const paragraphs = text.split('\n\n');

        for (const paragraph of paragraphs) {
            if (currentChunk.length + paragraph.length + 2 > maxSize) {
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }
                
                if (paragraph.length > maxSize) {
                    const subChunks = this.chunkBySentences(paragraph, maxSize);
                    chunks.push(...subChunks);
                } else {
                    currentChunk = paragraph;
                }
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }

        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    private chunkBySentences(text: string, maxSize: number): string[] {
        const chunks: string[] = [];
        let currentChunk = '';
        const sentences = text.split(/(?<=[.!?])\s+/);

        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxSize) {
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }
                
                if (sentence.length > maxSize) {
                    const words = sentence.split(' ');
                    for (const word of words) {
                        if (currentChunk.length + word.length + 1 > maxSize) {
                            chunks.push(currentChunk);
                            currentChunk = '';
                        }
                        currentChunk += (currentChunk ? ' ' : '') + word;
                    }
                } else {
                    currentChunk = sentence;
                }
            } else {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
            }
        }

        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    private stripMarkdown(text: string): string {
        return text
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/`(.+?)`/g, '$1')
            .replace(/\[(.+?)\]\(.+?\)/g, '$1')
            .replace(/!\[.*?\]\(.+?\)/g, '')
            .replace(/[-*_]{3,}/g, '')
            .trim();
    }

    private cleanupTempFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error(`[TelegramOutputHandler] Failed to cleanup temp file: ${filePath}`, error);
        }
    }
}