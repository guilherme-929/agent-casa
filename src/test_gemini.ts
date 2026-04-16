import { GeminiProvider } from './core/GeminiProvider';
import dotenv from 'dotenv';

dotenv.config();

async function testGemini() {
    console.log('--- Testando Gemini Provider ---');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error('ERRO: GEMINI_API_KEY não encontrada no .env');
        return;
    }

    try {
        const provider = new GeminiProvider(apiKey);
        console.log('Instanciado com sucesso. Enviando mensagem...');
        
        const response = await provider.generateResponse([
            { role: 'user', content: 'Olá, você está funcionando? Responda com "SIM" se sim.' }
        ]);

        console.log('Resposta Recebida:', response.content);
        
        if (response.content?.includes('SIM')) {
            console.log('✅ TESTE PASSOU!');
        } else {
            console.log('⚠️ Resposta inesperada, mas comunicação ok.');
        }
    } catch (error: any) {
        console.error('❌ FALHA NO TESTE:', error.message);
    }
}

testGemini();
