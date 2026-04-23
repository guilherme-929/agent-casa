# MCP n8n Configuration

## Quick Setup

Para usar o n8n-MCP com este projeto:

### 1. Configure as variáveis no `.env`

```env
# URL do seu n8n (local ou cloud)
N8N_API_URL=http://localhost:5678
# API Key do n8n (Settings → API)
N8N_API_KEY=your_api_key_here
```

### 2. Execute o MCP

```bash
npx -y n8n-mcp@latest
```

## Ferramentas MCP Disponíveis

### Core Tools (7)
- `tools_documentation` - Documentação das ferramentas
- `search_nodes` - Buscar nodes n8n
- `get_node` - Info de node específico
- `validate_node` - Validar configuração
- `validate_workflow` - Validar workflow completo
- `search_templates` - Buscar templates
- `get_template` - Obter template específico

### Management Tools (13) - Requer API
- `n8n_create_workflow` - Criar workflow
- `n8n_get_workflow` - Buscar workflow
- `n8n_update_full_workflow` - Atualizar completo
- `n8n_update_partial_workflow` - Atualizar parcial
- `n8n_delete_workflow` - Deletar
- `n8n_list_workflows` - Listar
- `n8n_validate_workflow` - Validar
- `n8n_autofix_workflow` - Auto-corrigir
- `n8n_workflow_versions` - Versões
- `n8n_deploy_template` - Deploy template
- `n8n_test_workflow` - Testar
- `n8n_executions` - Execuções
- `n8n_manage_credentials` - Credenciais
- `n8n_audit_instance` - Auditoria
- `n8n_health_check` - Health check

## Exemplos de Uso

### Buscar node
```
search_nodes({query: "slack"})
```

### Obter info de node
```
get_node({nodeType: "n8n-nodes-base.httpRequest"})
```

### Validar node
```
validate_node({nodeType: "n8n-nodes-base.httpRequest", config: {...}})
```

### Validar workflow
```
validate_workflow({workflow: {...}})
```

### Buscar templates
```
search_templates({query: "webhook slack"})
```

## Documentation

See: https://github.com/czlonkowski/n8n-mcp