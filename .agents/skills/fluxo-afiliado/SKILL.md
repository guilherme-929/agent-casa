---
name: fluxo-afiliado
description: >
  Fluxo completo de automação de afiliados: recebe mensagem com produto,
  extrai dados, busca na Shopee, gera link de afiliado e envia para grupo.
  Use quando precisar automatizar todo o processo de-afiliação de produtos.
---

# Fluxo Afiliado — Automação Completa

Este é o fluxo automatizado completo para transformação de produtos em links de afiliado.

## Fluxo

```
Mensagem Original
     ↓
[produto-extractor] → Extrai dados do produto
     ↓
[pesquisa-produto] → Valida preço no mercado (opcional)
     ↓
[shopee-afiliados] → Gera link de afiliado
     ↓
[conteudo-shopee] → Cria postagem promocional
     ↓
[telegram-sender] → Envia para grupo de destino
```

## Entrada

1. Mensagem bruta do Telegram (ou texto com info do produto)
2. Grupo de origem (onde recebeu)
3.Grupo de destino (para onde enviar)

## CONFIGURAÇÃO

No `.env`, configure:

```
# Shopee
SHOPEE_AFFILIATE_ID=seu_id

# Telegram
TELEGRAM_BOT_TOKEN=seu_token
TELEGRAM_GRUPO_ORIGEM=ID_origem
TELEGRAM_GRUPO_DESTINO=ID_destino
```

## Como executar

### Passo 1: Receber mensagem
Quando uma nova mensagem de produto chegar:
1. Copie a mensagem original
2. Chame produto-extractor

### Passo 2: Extrair dados
```
→produto-extractor
Mensagem: [cole a mensagem aqui]
```

### Passo 3: Gerar link Shopee
```
→shopee-afiliados
Produto: [nome extraído]
Preço: [preço extraído]
```

### Passo 4: Criar conteúdo
```
→conteudo-shopee
Produto: [nome]
Link: [link de afiliado]
```

### Passo 5: Enviar para grupo
```
→telegram-sender
Mensagem: [conteúdo criado]
Grupo: [TELEGRAM_GRUPO_DESTINO]
```

## Controle de Duplicados

Para evitar duplicação:
- Mantenha um registro dos produtos já enviados
- Antes de enviar, verifique se o produto já foi processado
- Use o timestamp para controle temporal

## Estrutura de Log

Guarde um log de execução:

```json
{
  "produto": "nome",
  "data_recebimento": "2024-01-01T10:00:00Z",
  "data_envio": "2024-01-01T10:05:00Z",
  "link_afiliado": "https://...",
  "enviado": true
}
```

## Delegação

Execute cada etapa sequencialmente, usando a delegação ao final de cada skill.
Depois de tudo: [fim] — Fluxo concluído