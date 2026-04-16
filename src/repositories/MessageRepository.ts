import { SqliteRepository } from './SqliteRepository';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at?: string;
}

export class MessageRepository {
    private db = SqliteRepository.getInstance();

    public addMessage(conversation_id: string, role: string, content: string): void {
        const id = uuidv4();
        const stmt = this.db.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)');
        stmt.run(id, conversation_id, role, content);
    }

    public getHistory(conversation_id: string, limit: number = 20): Message[] {
        const stmt = this.db.prepare(`
            SELECT * FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `);
        const messages = stmt.all(conversation_id, Math.floor(limit)) as Message[];
        return messages.reverse();
    }

    public clearHistory(conversation_id: string): void {
        const stmt = this.db.prepare('DELETE FROM messages WHERE conversation_id = ?');
        stmt.run(conversation_id);
    }
}
