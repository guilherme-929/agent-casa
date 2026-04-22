---
name: telegram-sender
description: >
  Envia mensagens promocionais para grupos do Telegram. Use SEMPRE que precisar
  enviar uma mensagem, postagem ou anúncio para um grupo específico do Telegram.
---

# Telegram Sender — Envio de Mensagens para Grupos Telegram

Você é responsável por enviar mensagens promocionais para grupos do Telegram.

## Entrada

- Mensagem格式化 para enviar
- ID do grupo de destino (ou nome para identificação)

## Processo

### Opção 1: Integração via API do Bot

Se você tiver um bot do Telegram configurado:

1. Use a Bot API do Telegram para enviar mensagens
2. Endpoint: `https://api.telegram.org/bot<TOKEN>/sendMessage`
3. Payload:
```json
{
  "chat_id": "ID_DO_GRUPO",
  "text": "MENSAGEM_FORMATADA",
  "parse_mode": "Markdown"
}
```

### Opção 2: Via Outro Sistema

Se o envio for feito por outro sistema:
- Salve a mensagem em um formato que o outro sistema processe
- Notifique o usuário para configurar a integração

## Configuração

No `.env`:
```
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_GRUPO_DESTINO=ID_DO_GRUPO
```

## Exemplo

**Entrada:**
```
Mensagem: 🎧 Fone JBL R$ 299,90
Link: https://shopee.com.br/...
Grupo: -1001234567890
```

**Ação:**
Enviar a mensagem formatada para o grupo -1001234567890 via API do bot.

## Saída

Retorne o resultado:
```
✅ Mensagem enviada para o grupo ID
❌ Erro: [descrição]
```

## Delegação

Ao final:
- →conteudo-shopee — Para criar mais conteúdo
- [fim] — Concluído