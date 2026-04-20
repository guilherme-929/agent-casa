const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3001';

interface DashboardEvent {
    type: 'message' | 'agent_selected' | 'response';
    userId: string;
    username: string;
    content: string;
    agent?: string;
}

export async function sendEvent(event: DashboardEvent): Promise<void> {
    try {
        await (globalThis as any).fetch(`${DASHBOARD_URL}/api/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
    } catch (e) {
    }
}

export async function logMessage(userId: string, username: string, content: string): Promise<void> {
    await sendEvent({ type: 'message', userId, username, content });
}

export async function logAgentSelected(userId: string, username: string, content: string, agent: string): Promise<void> {
    await sendEvent({ type: 'agent_selected', userId, username, content, agent });
}

export async function logResponse(userId: string, username: string, content: string, agent: string): Promise<void> {
    await sendEvent({ type: 'response', userId, username, content, agent });
}