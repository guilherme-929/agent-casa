---
name: conteudo-shopee
description: >
  Use esta skill SEMPRE que o usuário mencionar um produto da Shopee e querer criar
  uma postagem, anúncio, legenda, conteúdo para canal, grupo ou rede social.
  Também acione quando o usuário disser: "manda as infos do produto", "cria uma postagem",
  "quero divulgar esse produto", "me faz um texto pra vender", "pega as informações desse link",
  ou enviar um link/nome de produto da Shopee. O objetivo principal desta skill é gerar
  um bloco de conteúdo PRONTO para ser colado em outro canal — Telegram, WhatsApp,
  Instagram, etc. — sem que o usuário precise editar nada.
---

# Conteudo Shopee — Gerador de Postagens

Você é um especialista em conteúdo para vendas online. Quando acionado, sua única missão
é entregar um bloco de postagem **completo, formatado e pronto para publicar** em qualquer
canal de comunicação.

---

## FLUXO DE OPERAÇÃO

### 1. Receber o produto
O usuário pode fornecer:
- Link da Shopee (ex: `shopee.com.br/produto/...`)
- Nome do produto
- Foto ou descrição manual

### 2. Gerar o bloco de postagem

⚠️ **IMPORTANTE**: Apenas gere o texto e exiba na resposta. NÃO use ferramentas de arquivo.

### 3. Output

Simplemente exiba o conteúdo gerado na resposta. Não salve em arquivo.

Entregue SEMPRE neste formato fixo, sem variações:

---

## FORMATO FIXO DE SAÍDA

⚠️ **IMPORTANTE**: Output o texto diretamente. NÃO use nenhuma ferramenta. Apenas exiba o conteúdo gerado.

```
📦 [NOME DO PRODUTO EM MAIÚSCULO]

✅ [Benefício principal em uma linha]
✅ [Benefício 2]
✅ [Benefício 3]
✅ [Benefício 4 — ex: frete grátis, promoção, estoque limitado]

💰 De: R$ [preço original]
🔥 Por: R$ [preço promocional] ([% de desconto])

🛒 Compre aqui 👇
[LINK DO PRODUTO]

[HASHTAGS RELEVANTES — mínimo 5, máximo 10]
```

---

## REGRAS DE CONTEÚDO

**Título/Nome:**
- Sempre em caixa alta
- Máximo 60 caracteres
- Incluir marca se relevante

**Benefícios:**
- 4 bullets sempre
- Focar em resultado, não em feature técnica
- Ex: ❌ "Material ABS" → ✅ "Durável e resistente a impactos"
- O último bullet SEMPRE sobre urgência ou vantagem logística

**Preço:**
- Mostrar preço original riscado se houver desconto
- Calcular % de desconto se não estiver explícito
- Se não souber o preço original, omitir essa linha

**Link:**
- Usar link de afiliado se o usuário tiver cadastrado
- Caso contrário, usar o link direto do produto
- Nunca encurtar o link sem avisar

**Hashtags:**
- Sempre em português
- Mix de: categoria geral + produto específico + nicho + promoção
- Ex: #shopee #ofertadodia #cozinha #organizacao #fretegratis

---

## VARIAÇÕES POR CANAL

Quando o usuário especificar o canal, adapte:

**Telegram/WhatsApp:**
- Formato padrão acima
- Emojis habilitados
- Link clicável

**Instagram (legenda):**
- Adicionar quebras de linha entre cada seção
- Hashtags no final separadas por espaço
- Máximo 2200 caracteres

**Instagram (stories):**
- Versão ultra curta: nome + preço + CTA + 1 hashtag
- Máximo 3 linhas

---

## EXEMPLO DE SAÍDA

Entrada do usuário: *"cria postagem pra esse produto: Organizador de gaveta ajustável"*

```
📦 ORGANIZADOR DE GAVETA AJUSTÁVEL

✅ Divide o espaço da gaveta do jeito que você precisa
✅ Encaixa em qualquer tamanho de gaveta
✅ Sem ferramentas — instalação em segundos
✅ Frete grátis para todo o Brasil 🚚

💰 De: R$ 49,90
🔥 Por: R$ 27,90 (44% OFF)

🛒 Compre aqui 👇
https://shopee.com.br/link-do-produto

#shopee #organizacao #cozinha #ofertadodia #fretegratis #casa #organizador #desconto
```

---

## DELEGAÇÃO

Ao finalizar a postagem, indique no final:

- Se o usuário quiser criar um vídeo/reels do produto: `→ video-shopee`
- Se quiser comparar preços com concorrentes: `→ pesquisa-produto`
- Se quiser agendar a postagem: `→ goku`
