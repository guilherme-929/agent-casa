import { Skill } from './SkillLoader';

/**
 * KeywordRouter — Roteamento determinístico por palavra-chave.
 *
 * Lê as `tags` do frontmatter YAML de cada skill + as seções
 * "→skillName" do orchestrator/SKILL.md para construir um mapa
 * de keywords → skillId. Zero chamadas LLM.
 */

// Mapa estático de keywords por skill (espelhando o orchestrator/SKILL.md)
// Lowercase para comparação case-insensitive.
const SKILL_KEYWORDS: Record<string, string[]> = {
    'video-shopee': [
        'vídeo', 'video', 'roteiro', 'shopee videos', 'tiktok', 'reels',
        'curto', 'viral', 'produção', 'gravar', 'filmar', 'cena', 'gravação',
        'caption', 'legenda', 'hook', 'cta', 'shorts'
    ],
    'conteudo-shopee': [
        'vendas', 'shopee', 'produto', 'descrição', 'descricao', 'foto',
        'imagem', 'marketing', 'converter', 'venda', 'cliente', 'pedido',
        'anúncios', 'anuncios', 'promoções', 'promocoes', 'estoque',
        'precificação', 'precificacao', 'lucro', 'concorrentes', 'e-commerce',
        'ecommerce', 'loja', 'anuncio', 'título', 'titulo', 'seo shopee'
    ],
    'infra-n8n': [
        'servidor', 'n8n', 'workflow', 'automação', 'automacao', 'api',
        'erro', 'bug', 'problema', 'performance', 'lento', 'crash', 'docker',
        'npm', 'status', 'monitoramento', 'saúde', 'saude', 'infra',
        'infraestrutura', 'deploy', 'log', 'diagnóstico', 'diagnostico',
        'online', 'offline', 'execução', 'execucao'
    ],
    'goku': [
        'tarefa', 'lembrete', 'agenda', 'compromisso', 'reunião', 'reuniao',
        'hábito', 'habito', 'alerta', 'cronograma', 'prazo', 'hoje',
        'amanha', 'amanhã', 'semana', 'agendar', 'marcar', 'horário',
        'horario', 'tempo', 'rotina', 'deadline', 'schedule', 'urgente'
    ],
    'skill-creator': [
        'criar agent', 'nova skill', 'novo agente', 'skill-creator', 'forja',
        'criar habilidade', 'criar skill', 'novo skill', 'novo agente',
        'criar capacidade'
    ],
    'code-analyzer': [
        'código', 'codigo', 'analyze', 'review', 'code', 'análise técnica',
        'analise tecnica', 'bug no código', 'refatorar', 'refactor',
        'otimizar código', 'code review', 'programação', 'programacao'
    ],
    'prd-manager': [
        'prd', 'product requirements', 'spec', 'especificação', 'especificacao',
        'documento de produto', 'feature', 'requisito', 'roadmap'
    ],
    'git-manager': [
        'git', 'commit', 'branch', 'merge', 'pull request', 'pr', 'repositório',
        'repositorio', 'github', 'gitlab', 'push', 'clone', 'stash'
    ]
};

export class KeywordRouter {
    /**
     * Roteia a mensagem do usuário para uma skill com base em palavras-chave.
     * Retorna a skill correspondente ou null se nenhuma for identificada.
     */
    public route(userInput: string, availableSkills: Skill[]): Skill | null {
        const inputLower = userInput.toLowerCase();

        // Ordem de prioridade: verifica skills na ordem do mapa
        for (const [skillId, keywords] of Object.entries(SKILL_KEYWORDS)) {
            for (const keyword of keywords) {
                if (inputLower.includes(keyword)) {
                    const skill = availableSkills.find(s => s.metadata.id === skillId);
                    if (skill) {
                        console.log(`[KeywordRouter] Match: "${keyword}" → skill: ${skillId}`);
                        return skill;
                    }
                }
            }
        }

        // Tenta também pelas tags do frontmatter YAML de cada skill
        for (const skill of availableSkills) {
            if (skill.metadata.id === 'orchestrator') continue; // Pula o próprio orchestrator

            // Extrai tags do frontmatter (se disponíveis via conteúdo bruto)
            const tagsMatch = skill.content.match(/tags:\s*\[([^\]]+)\]/);
            if (tagsMatch) {
                const tags = tagsMatch[1].split(',').map(t => t.trim().toLowerCase().replace(/['"]/g, ''));
                for (const tag of tags) {
                    if (inputLower.includes(tag)) {
                        console.log(`[KeywordRouter] Tag match: "${tag}" → skill: ${skill.metadata.id}`);
                        return skill;
                    }
                }
            }
        }

        console.log(`[KeywordRouter] No keyword match found for: "${userInput.substring(0, 60)}..."`);
        return null;
    }
}
