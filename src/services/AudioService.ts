import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export class AudioService {
    private whisperModelPath: string;
    private edgeTtsPath: string;

    constructor() {
        this.whisperModelPath = process.env.WHISPER_MODEL_PATH || 'base';
        this.edgeTtsPath = process.env.EDGE_TTS_PATH || 'edge-tts';
    }

    public async transcribe(audioPath: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const args = [
                    '-m', this.whisperModelPath,
                    '-f', audioPath,
                    '--language', 'pt'
                ];

                const whisper = spawn('whisper', args, { shell: true });
                let output = '';
                let errorOutput = '';

                whisper.stdout.on('data', (data) => {
                    output += data.toString();
                });

                whisper.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                whisper.on('close', (code) => {
                    if (code === 0) {
                        resolve(output.trim());
                    } else {
                        console.error('[AudioService] Whisper error:', errorOutput);
                        reject(new Error(`Whisper failed: ${errorOutput}`));
                    }
                });

                whisper.on('error', (err) => {
                    console.error('[AudioService] Whisper spawn error:', err);
                    reject(err);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    public async synthesize(text: string, voiceId: string, tmpDir: string): Promise<string> {
        const outputPath = path.join(tmpDir, `tts_${Date.now()}.mp3`);

        return new Promise(async (resolve, reject) => {
            try {
                const args = [
                    '--voice', voiceId,
                    '--text', text,
                    '--write-mp3', outputPath
                ];

                const tts = spawn(this.edgeTtsPath, args, { shell: true });
                let errorOutput = '';

                tts.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                tts.on('close', (code) => {
                    if (code === 0 && fs.existsSync(outputPath)) {
                        resolve(outputPath);
                    } else {
                        console.error('[AudioService] Edge-TTS error:', errorOutput);
                        reject(new Error(`Edge-TTS failed: ${errorOutput}`));
                    }
                });

                tts.on('error', (err) => {
                    console.error('[AudioService] Edge-TTS spawn error:', err);
                    reject(err);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    public async downloadAudio(file: any, tmpDir: string): Promise<string> {
        const fileUrl = await file.getUrl();
        const fileId = file.file_id;
        const ext = 'ogg';
        const filePath = path.join(tmpDir, `${fileId}.${ext}`);

        const response = await fetch(fileUrl);
        const buffer = await response.arrayBuffer();
        
        fs.writeFileSync(filePath, Buffer.from(buffer));
        
        return filePath;
    }
}