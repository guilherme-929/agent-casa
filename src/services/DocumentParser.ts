import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DocumentParser {
    public async parsePdf(filePath: string): Promise<string> {
        try {
            const pdfParse = require('pdf-parse');
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } catch (error: any) {
            console.error('[DocumentParser] PDF parse error:', error);
            throw new Error(`Failed to parse PDF: ${error.message}`);
        }
    }

    public validateFileSize(filePath: string, maxSizeMB: number = 20): boolean {
        const stats = fs.statSync(filePath);
        const fileSizeMB = stats.size / (1024 * 1024);
        return fileSizeMB <= maxSizeMB;
    }
}