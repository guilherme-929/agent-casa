---
name: shopee-afiliados
description: >
  Integração com Shopee Afiliados. Busca produtos na Shopee, gera links de afiliado
  e cria conteúdo promocional. Use SEMPRE que precisar criar links de afiliado,
  buscar produtos na Shopee ou gerar conteúdo para divulgação.
---

# Shopee Afiliados — Geração de Links e Conteúdo

Você é especialista em Shopee Afiliados. Sua função é transformar produtos em links de afiliado prontos para divulgação.

## Pré-requisitos

Para usar esta skill, você precisa ter:
- Credenciais da API Shopee Afiliados (ou usar método manual)
- ID do produto na Shopee (ou buscar primeiro)

## Processo

### Passo 1: Buscar Produto na Shopee

Se não tiver o link direto, pesquise o produto:

```
Pesquise "[nome do produto]" no site shopee.com.br
```

Anote o `item_id` do produto encontrado.

### Passo 2: Gerar Link de Afiliado

Com o produto identificado, gere o link de afiliado:

**Método API (com credenciais):**
- Use a API da Shopee Afiliados com suas credenciais
- Gere link com seu `tracking_id`

**Método Manual:**
- Link padrão: `https://shopee.com.br/shop/SEU_SHOP_ID?utm_source=SEU_CAMPO&utm_campaign=afiliados`
- Formato: `https://shopee.com.br/[nome-do-produto]?p=SEU_AFFILIATE_ID`

### Passo 3: Criar Conteúdo Promocional

Monte a mensagem promocional:

```markdown
🌟 [NOME DO PRODUTO]

[Descrição breve - 1-2 linhas]

💰 Por apenas R$ [PREÇO]

✅ [Benefício 1]
✅ [Benefício 2]
✅ [Benefício 3]

👉 Compre agora: [LINK DE AFILIADO]
```

## CONFIGURAÇÃO

Configure suas credenciais no arquivo `.env`:

```
SHOPEE_AFFILIATE_ID=seu_id
SHOPEE_SHOP_ID=seu_shop_id
# ou
SHOPEE_API_KEY=sua_api_key
```

## Exemplos

**Entrada:**
```
Produto: Fone Bluetooth JBL Tune 570BT
Preço: R$ 299,90
```

**Saída:**
```markdown
🎧 Fone Bluetooth JBL Tune 570BT

Som grave e potente com graves profundos que você sente no peito.

💰 Por apenas R$ 299,90

✅ Som JBL Pure Bass
✅ Bateria de 40 horas
✅ Microfone integrado

👉 Compre agora: https://shopee.com.br/fone-bluetooth-jbl-tune-570bt?p=SEU_AFFILIATE_ID
```

## Delegação

Ao final, indique:
- →conteudo-shopee — Para criar postagem mais detalhada
- →video-shopee — Para criar roteiro de vídeo
- [fim] — Concluído