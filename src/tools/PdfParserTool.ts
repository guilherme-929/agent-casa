import { BaseTool } from './BaseTool';
import { ToolDefinition } from '../types';
import fs from 'fs';
import path from 'path';

const pdf = require('pdf-parse');

export class PdfParserTool extends BaseTool {
    public definition: ToolDefinition = {
        name: 'parse_pdf',
        description: 'Extracts text content from a PDF file.',
        parameters: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'The path to the PDF file.'
                }
            },
            required: ['filePath']
        }
    };

    public async execute(args: { filePath: string }): Promise<string> {
        try {
            const fullPath = path.isAbsolute(args.filePath) 
                ? args.filePath 
                : path.join(process.cwd(), args.filePath);

            if (!fs.existsSync(fullPath)) {
                return `Error: File not found at ${args.filePath}`;
            }

            const dataBuffer = fs.readFileSync(fullPath);
            const data = await pdf(dataBuffer);

            return `PDF Content (first 5000 chars):\n${data.text.substring(0, 5000)}`;
        } catch (error: any) {
            return `Error parsing PDF: ${error.message}`;
        }
    }
}
