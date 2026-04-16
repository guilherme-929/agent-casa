import { ConversationRepository, Conversation } from '../repositories/ConversationRepository';
import { MessageRepository, Message } from '../repositories/MessageRepository';

export class MemoryManager {
    private conversationRepo = new ConversationRepository();
    private messageRepo = new MessageRepository();

    public async getContext(userId: string, provider: string): Promise<{ conversation: Conversation, history: Message[] }> {
        const conversation = this.conversationRepo.ensureConversation(userId, provider);
        const history = this.messageRepo.getHistory(conversation.id);
        return { conversation, history };
    }

    public async saveMessage(conversationId: string, role: string, content: string): Promise<void> {
        this.messageRepo.addMessage(conversationId, role, content);
    }

    public async clearHistory(conversationId: string): Promise<void> {
        this.messageRepo.clearHistory(conversationId);
    }
}
