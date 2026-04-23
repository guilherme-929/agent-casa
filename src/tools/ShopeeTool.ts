import { BaseTool } from './BaseTool';
import { ToolDefinition } from '../types';
import dotenv from 'dotenv';

dotenv.config();

export class ShopeeTool extends BaseTool {
    private affiliateId: string;

    public definition: ToolDefinition = {
        name: 'shopee_search',
        description: 'Search products on Shopee and generate affiliate links.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Product name to search' },
                limit: { type: 'number', description: 'Max results (default 10)' }
            },
            required: ['query']
        }
    };

    public definitionResolve: ToolDefinition = {
        name: 'shopee_resolve',
        description: 'Resolve shortened Shopee link and get product info.',
        parameters: {
            type: 'object',
            properties: {
                shortUrl: { type: 'string', description: 'Shortened Shopee URL (s.shopee.com.br/...)' }
            },
            required: ['shortUrl']
        }
    };

    constructor() {
        super();
        this.affiliateId = process.env.SHOPEE_AFFILIATE_ID || '';
    }

    public async execute(args: { query: string; limit?: number }): Promise<string> {
        try {
            const searchUrl = `https://shopee.com.br/api/v4/search_product_variant/search_item/v2?keyword=${encodeURIComponent(args.query)}&limit=${args.limit || 10}`;
            
            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                return `Error: HTTP ${response.status}`;
            }

            const data: any = await response.json();
            const products = data.data?.items || [];

            if (products.length === 0) {
                return `No products found for: "${args.query}"`;
            }

            let output = `## 🔍 Results: "${args.query}"\n\n`;
            output += '| # | Product | Price | Link |\n';
            output += '|---|--------|-------|------|\n';

            products.slice(0, args.limit || 10).forEach((p: any, i: number) => {
                const name = p.name || 'Unknown';
                const price = p.price ? `R$ ${(p.price / 100000).toFixed(2)}` : 'N/A';
                const link = `https://shopee.com.br/${p.link}`;
                const affiliateLink = this.affiliateId ? `${link}?p=${this.affiliateId}` : link;
                output += `| ${i + 1} | ${name.substring(40)} | ${price} | [Link](${affiliateLink}) |\n`;
            });

            return output;
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }

    public generateAffiliateLink(productUrl: string): string {
        if (!this.affiliateId) return productUrl;
        const separator = productUrl.includes('?') ? '&' : '?';
        return `${productUrl}${separator}p=${this.affiliateId}`;
    }

    public async resolveShortLink(shortUrl: string): Promise<string> {
        try {
            const response = await fetch(shortUrl, {
                method: 'GET',
                redirect: 'manual'
            });

            const location = response.headers.get('location');
            if (!location) {
                return 'Error: Could not resolve short link';
            }

            const itemMatch = location.match(/item\/(\d+)/);
            const shopMatch = location.match(/shop\/(\d+)/);

            if (!itemMatch) {
                return `Resolved URL: ${location}`;
            }

            const itemId = itemMatch[1];
            const shopId = shopMatch ? shopMatch[1] : '0';

            const infoUrl = `https://shopee.com.br/api/v4/product/get_product_info?itemid=${itemId}&shopid=${shopId}`;
            const infoResponse = await fetch(infoUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const data: any = await infoResponse.json();
            const product = data.data;

            if (!product) {
                return `Link resolved: ${location}`;
            }

            const name = product.name || 'Unknown';
            const price = product.price ? `R$ ${(product.price / 100000000).toFixed(2)}` : 'N/A';
            const originalPrice = product.original_price ? `R$ ${(product.original_price / 100000000).toFixed(2)}` : null;
            const image = product.image ? `https://cf.shopee.com/${product.image}` : null;
            const description = product.description || '';

            const productLink = `https://shopee.com.br/product-${shopId}-${itemId}`;
            const affiliateLink = this.generateAffiliateLink(productLink);

            return `## 📦 ${name}\n\n` +
                `**Preço**: ${price}` +
                (originalPrice ? ` ~~${originalPrice}~~` : '') + '\n' +
                `\n**Link**: ${affiliateLink}` +
                (image ? `\n**Imagem**: ${image}` : '') +
                `\n\n${description.substring(0, 500)}...`;
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }
}

export class TelegramTool extends BaseTool {
    private botToken: string;
    private chatId: string;

    public definition: ToolDefinition = {
        name: 'telegram_send',
        description: 'Send a message to a Telegram group.',
        parameters: {
            type: 'object',
            properties: {
                message: { type: 'string', description: 'Message text (Markdown)' },
                chatId: { type: 'string', description: 'Chat ID (use TELEGRAM_GRUPO_DESTINO)' }
            },
            required: ['message']
        }
    };

    constructor() {
        super();
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.chatId = process.env.TELEGRAM_GRUPO_DESTINO || '';
    }

    public async execute(args: { message: string; chatId?: string }): Promise<string> {
        if (!this.botToken) {
            return 'Error: TELEGRAM_BOT_TOKEN not configured';
        }

        const targetChat = args.chatId || this.chatId;
        if (!targetChat) {
            return 'Error: TELEGRAM_GRUPO_DESTINO not configured';
        }

        try {
            const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: targetChat,
                    text: args.message,
                    parse_mode: 'Markdown'
                })
            });

            if (!response.ok) {
                const errorData = await response.json() as { description?: string };
                return `Error: ${errorData.description || response.status}`;
            }

            return `✅ Message sent to ${targetChat}`;
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }
}