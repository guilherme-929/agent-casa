import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

interface AgentEvent {
    id: string;
    type: 'message' | 'agent_selected' | 'response';
    userId: string;
    username: string;
    content: string;
    agent?: string;
    timestamp: number;
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const events: AgentEvent[] = [];
const MAX_EVENTS = 100;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'src', 'dashboard', 'public')));

app.get('/api/events', (req, res) => {
    res.json(events);
});

app.get('/api/agents', (req, res) => {
    const agentsPath = path.join(process.cwd(), '.agents', 'skills');
    if (!fs.existsSync(agentsPath)) {
        return res.json([]);
    }
    
    const dirs = fs.readdirSync(agentsPath).filter(d => {
        return fs.statSync(path.join(agentsPath, d)).isDirectory();
    });
    
    res.json(dirs.map(name => {
        const skillPath = path.join(agentsPath, name, 'SKILL.md');
        let description = '';
        if (fs.existsSync(skillPath)) {
            const content = fs.readFileSync(skillPath, 'utf-8');
            const match = content.match(/description:\s*(.+)/);
            if (match) description = match[1];
        }
        return { name, description };
    }));
});

app.post('/api/event', (req, res) => {
    const event: AgentEvent = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: req.body.type || 'message',
        userId: req.body.userId,
        username: req.body.username,
        content: req.body.content,
        agent: req.body.agent,
        timestamp: Date.now()
    };
    
    events.unshift(event);
    if (events.length > MAX_EVENTS) {
        events.pop();
    }
    
    io.emit('new_event', event);
    res.json({ success: true, event });
});

io.on('connection', (socket) => {
    console.log('[Dashboard] Client connected');
    
    socket.on('disconnect', () => {
        console.log('[Dashboard] Client disconnected');
    });
});

const PORT = process.env.DASHBOARD_PORT || 3001;

export function startDashboard(): Promise<void> {
    return new Promise((resolve, reject) => {
        server.listen(PORT, () => {
            console.log(`[Dashboard] Server running on http://localhost:${PORT}`);
            resolve();
        });
        server.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                console.log('[Dashboard] Server already running');
                resolve();
            } else {
                reject(err);
            }
        });
    });
}

export { app, io, events };