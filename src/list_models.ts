import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('API KEY NOT FOUND');
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json() as any;
        if (data.models) {
            const geminiModels = data.models.filter((m: any) => m.name.includes('gemini'));
            console.log('Gemini Models Found:');
            geminiModels.forEach((m: any) => console.log(`- ${m.name}`));
        } else {
            console.log('No models found or error:', data);
        }
    } catch (e: any) {
        console.error('Fetch error:', e.message);
    }
}

listModels();
