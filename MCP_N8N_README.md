# n8n MCP Server

## Configuração

O MCP está configurado com as credenciais do seu n8n:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-mcp@latest"],
      "env": {
        "N8N_API_URL": "https://n8n.alemnet.net.br",
        "N8N_API_KEY": "eyJ..."
      }
    }
  }
}
```

## Como Usar

### 1. Iniciar o MCP Server

```bash
# Com as variáveis do .env
npx -y n8n-mcp@latest

# Ou manualmente
N8N_API_URL=https://n8n.alemnet.net.br \
N8N_API_KEY=eyJ... \
npx -y n8n-mcp@latest
```

### 2. Ferramentas Disponíveis

**Core (7 tools)**:
- `search_nodes` - Buscar nodes n8n
- `get_node` - Info de node
- `validate_node` - Validar configuração
- `validate_workflow` - Validar workflow
- `search_templates` - Buscar templates
- `get_template` - Baixar template
- `tools_documentation` - Documentação

**Management (13 tools)**:
- `n8n_create_workflow` - Criar
- `n8n_get_workflow` - Buscar
- `n8n_update_partial_workflow` - Atualizar
- `n8n_list_workflows` - Listar
- `n8n_delete_workflow` - Deletar
- `n8n_validate_workflow` - Validar
- `n8n_test_workflow` - Testar
- `n8n_executions` - Execuções
- `n8n_manage_credentials` - Credenciais
- etc.

## Executar

```bash
# Development
npm run mcp

# Ou direto
npx -y n8n-mcp@latest
```

## Documentation

Veja: https://github.com/czlonkowski/n8n-mcp