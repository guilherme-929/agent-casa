# Setup Guide: SandecoClaw

Follow these steps to get your **SandecoClaw** agent up and running on your local machine.

## Prerequisites

- **Node.js**: Version 20 or higher is recommended.
- **npm**: Comes with Node.js.
- **Telegram Bot**: You'll need a bot token from [@BotFather](https://t.me/botfather).
- **LLM API Keys**: At least one API key from:
    - [Google AI Studio (Gemini)](https://aistudio.google.com/)
    - [Groq](https://console.groq.com/)
    - [DeepSeek](https://platform.deepseek.com/)

---

## 1. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-repo/agent-casa.git
cd agent-casa
npm install
```

---

## 2. Configuration

1. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your details:

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot Token. | `123456:ABC-DEF...` |
| `TELEGRAM_ALLOWED_USER_IDS` | Comma-separated list of Telegram User IDs allowed to use the bot. | `1234567,9876543` |
| `DEFAULT_PROVIDER` | The LLM provider to use by default. | `gemini`, `groq`, or `deepseek` |
| `GEMINI_API_KEY` | Your Google Gemini API Key. | `AIzaSy...` |
| `MAX_ITERATIONS` | Max steps the agent can take in one request. | `5` |
| `MEMORY_WINDOW_SIZE` | Number of messages to keep in context. | `20` |

> [!TIP]
> You can find your Telegram User ID by messaging [@userinfobot](https://t.me/userinfobot).

---

## 3. Running the Agent

### Development Mode (with Hot-Reload)
Runs the agent and restarts automatically when you change the source code or skills.
```bash
npm run dev
```

### Production Mode
Runs the agent normally.
```bash
npm start
```

---

## 4. Testing the Bot

1. Open Telegram and search for your bot.
2. Send a message like "Hi".
3. If your ID is in the whitelist, the bot should respond.
4. Try asking for a task, e.g., "Summarize this PDF" (attach a PDF).

---

## 5. Troubleshooting

- **401 Unauthorized**: Check your `TELEGRAM_BOT_TOKEN`.
- **403 Forbidden**: Your User ID is likely not in `TELEGRAM_ALLOWED_USER_IDS`.
- **API Errors**: Check your LLM API keys and quotas.
- **SQLite Errors**: Ensure the `data/` directory exists and is writable.
