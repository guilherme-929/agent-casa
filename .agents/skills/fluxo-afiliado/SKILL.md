---
name: fluxo-afiliado
description: >
  Fluxo completo de afiliado: recebe produto, busca na Shopee via n8n MCP,
  gera link de afiliado e envia para grupo Telegram. Use para automatizar
  divulgação de produtos Shopee em grupos.
---

# Fluxo Afiliado Shopee

Automatiza: buscar produto → link afiliado → postagem → Telegram

## 📥 ENTRADA

Forneça:
- Nome do produto OU
- Link da Shopee OU  
- Palavras-chave para buscar

## 🔄 FLUXO

```
1. Receber produto
2. Buscar na Shopee (via n8n MCP ou HTTP)
3. Gerar link de afiliado
4. Criar postagem
5. Enviar para grupo Telegram
```

## 🔧 MCP n8n Tools

### Buscar na Shopee via n8n

```
search_nodes({query: "shopee"})
```

Ou usar HTTP Request node configurado na sua instância n8n.

### Gerar Link Afiliado

Para gerar link de afiliadoShopee:
- Adicione seu ID de afiliado: `?p=SEU_AFFILIATE_ID`
- Formato: `[URL_PRODUTO]?p=[SEU_ID]`

Se tiver credencial de API da Shopee, use:
```
n8n-nodes-base.httpRequest
```

## 📤 POSTAGEM

```
📦 [NOME DO PRODUTO]

✅ [Benefício 1]
✅ [Benefício 2]  
✅ [Benefício 3]

💰 De: R$ [preço]
🔥 Por: R$ [promocional]

🛒 Compre aqui 👇
[LINK AFILIADO]

#shopee #[categoria] #ofertadodia
```

## ⚙️ CONFIGURAÇÃO

No `.env`:
```
SHOPEE_AFFILIATE_ID=seu_id
TELEGRAM_GRUPO_DESTINO=-2831072465
TELEGRAM_BOT_TOKEN=seu_token
```

## 📤 DELEGAÇÃO

Se precisar de automação n8n:
```
→infra-n8n
Cria um workflow que: busca produto na Shopee e envia pro Telegram
```

Se precisar criar conteúdo:
```
→skill-creator
Cria uma skill para postar produtos
```

[fim] — Concluído