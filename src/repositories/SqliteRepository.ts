import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class SqliteRepository {
    private static instance: Database.Database;
    private static dbPath = path.join(process.cwd(), 'data', 'db.sqlite');

    public static getInstance(): Database.Database {
        if (!SqliteRepository.instance) {
            // Ensure data directory exists
            const dataDir = path.dirname(SqliteRepository.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            SqliteRepository.instance = new Database(SqliteRepository.dbPath, { 
                verbose: console.log 
            });
            
            // Enable WAL mode for performance
            SqliteRepository.instance.pragma('journal_mode = WAL');
            
            SqliteRepository.initializeSchema();
        }
        return SqliteRepository.instance;
    }

    private static initializeSchema(): void {
        const db = SqliteRepository.instance;
        
        db.exec(`
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                provider TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            );

            CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
        `);
    }
}
