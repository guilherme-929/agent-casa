import { SqliteRepository } from './SqliteRepository';
import { v4 as uuidv4 } from 'uuid';

export interface Conversation {
    id: string;
    user_id: string;
    provider: string;
}

export class ConversationRepository {
    private db = SqliteRepository.getInstance();

    public create(user_id: string, provider: string): Conversation {
        const id = uuidv4();
        const stmt = this.db.prepare('INSERT INTO conversations (id, user_id, provider) VALUES (?, ?, ?)');
        stmt.run(id, user_id, provider);
        return { id, user_id, provider };
    }

    public findByUserId(user_id: string): Conversation | undefined {
        const stmt = this.db.prepare('SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
        return stmt.get(user_id) as Conversation | undefined;
    }

    public ensureConversation(user_id: string, provider: string): Conversation {
        let conversation = this.findByUserId(user_id);
        if (!conversation) {
            conversation = this.create(user_id, provider);
        }
        return conversation;
    }
}
