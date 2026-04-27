#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Carregar .env do root do projeto
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import { sinapiSearch, sinapiGetByCodigo, sinapiGetMultiple } from './tools/sinapi.js';
import { cotacaoWeb } from './tools/webSearch.js';
import {
  orcamentoCriar,
  orcamentoAdicionarServico,
  orcamentoBuscar,
  orcamentoListarServicos,
  orcamentoAtualizarBdi,
  orcamentoExportar,
} from './tools/orcamentos.js';

const server = new Server(
  { name: 'evis-orcamentos', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// =============================================================
// DEFINIÇÃO DAS TOOLS
// =============================================================
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // --- REFERÊNCIAS DE CUSTO ---
    {
      name: 'referencia_buscar',
      description: 'Busca referências de custo por termo. Consulta primeiro o catálogo residencial EVIS e depois o SINAPI oficial como fallback. Use para encontrar serviço, código e valor de referência (ex: "demolição piso", "reboco", "ponto elétrico").',
      inputSchema: {
        type: 'object',
        properties: {
          termo: {
            type: 'string',
            description: 'Termo de busca em português (ex: "demolição piso", "reboco", "ponto hidráulico", "forro drywall")',
          },
          limite: {
            type: 'number',
            description: 'Número máximo de resultados (padrão: 8)',
          },
        },
        required: ['termo'],
      },
    },
    {
      name: 'sinapi_buscar',
      description: 'Alias compatível da busca de referências de custo. Consulta primeiro o catálogo residencial EVIS e depois o SINAPI oficial como fallback.',
      inputSchema: {
        type: 'object',
        properties: {
          termo: {
            type: 'string',
            description: 'Termo de busca em português (ex: "demolição piso", "pintura látex", "alvenaria vedação")',
          },
          limite: {
            type: 'number',
            description: 'Número máximo de resultados (padrão: 8)',
          },
        },
        required: ['termo'],
      },
    },
    {
      name: 'sinapi_codigo',
      description: 'Busca composição SINAPI específica pelo código numérico. Use quando o código oficial já é conhecido.',
      inputSchema: {
        type: 'object',
        properties: {
          codigo: {
            type: 'string',
            description: 'Código SINAPI numérico (ex: "97631", "87492", "88486")',
          },
        },
        required: ['codigo'],
      },
    },
    {
      name: 'sinapi_multiplos',
      description: 'Busca múltiplos códigos SINAPI oficiais de uma vez.',
      inputSchema: {
        type: 'object',
        properties: {
          codigos: {
            type: 'array',
            items: { type: 'string' },
            description: 'Lista de códigos SINAPI (ex: ["97631", "87492", "88486"])',
          },
        },
        required: ['codigos'],
      },
    },

    // --- ORÇAMENTOS ---
    {
      name: 'orcamento_criar',
      description: 'Cria um novo orçamento/obra no EVIS. Usar somente após HITL validar os dados básicos da obra.',
      inputSchema: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome da obra/projeto' },
          cliente: { type: 'string', description: 'Nome do cliente' },
          endereco: { type: 'string', description: 'Endereço completo' },
          tipo_obra: {
            type: 'string',
            enum: ['Reforma', 'Construção Nova', 'Ampliação'],
            description: 'Tipo de obra',
          },
          area_total: { type: 'number', description: 'Área total em m²' },
          observacoes: { type: 'string', description: 'Observações gerais' },
        },
        required: ['nome', 'cliente', 'tipo_obra'],
      },
    },
    {
      name: 'orcamento_servico_adicionar',
      description: 'Adiciona um serviço validado ao orçamento. Usar somente após HITL aprovar o serviço.',
      inputSchema: {
        type: 'object',
        properties: {
          obra_id: { type: 'string', description: 'ID da obra (UUID)' },
          codigo_servico: { type: 'string', description: 'Código do serviço no formato N.M (ex: "1.1", "2.3")' },
          categoria: { type: 'string', description: 'Categoria (ex: "Demolição", "Alvenaria", "Elétrica")' },
          descricao: { type: 'string', description: 'Descrição clara do serviço' },
          unidade: { type: 'string', description: 'Unidade de medida (m², m³, un, m, kg)' },
          quantidade: { type: 'number', description: 'Quantidade' },
          valor_unitario_direto: { type: 'number', description: 'Valor unitário sem BDI (em R$)' },
          sinapi_codigo: { type: 'string', description: 'Código SINAPI de referência (opcional)' },
          observacoes: { type: 'string', description: 'Observações sobre o serviço' },
        },
        required: ['obra_id', 'codigo_servico', 'categoria', 'descricao', 'unidade', 'quantidade', 'valor_unitario_direto'],
      },
    },
    {
      name: 'orcamento_buscar',
      description: 'Busca um orçamento existente pelo nome ou ID.',
      inputSchema: {
        type: 'object',
        properties: {
          identificador: {
            type: 'string',
            description: 'Nome parcial ou ID UUID da obra',
          },
        },
        required: ['identificador'],
      },
    },
    {
      name: 'orcamento_listar_servicos',
      description: 'Lista todos os serviços de um orçamento com subtotal.',
      inputSchema: {
        type: 'object',
        properties: {
          obra_id: { type: 'string', description: 'ID da obra (UUID)' },
        },
        required: ['obra_id'],
      },
    },
    {
      name: 'orcamento_atualizar_bdi',
      description: 'Atualiza o BDI do orçamento após o usuário definir os percentuais. NUNCA chamar sem aprovação explícita do usuário.',
      inputSchema: {
        type: 'object',
        properties: {
          obra_id: { type: 'string', description: 'ID da obra' },
          bdi_percentual: { type: 'number', description: 'BDI total em % (ex: 20.77)' },
          regime_tributario: {
            type: 'string',
            enum: ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'],
          },
          bdi_detalhamento: {
            type: 'object',
            properties: {
              administracao: { type: 'number' },
              seguro: { type: 'number' },
              risco: { type: 'number' },
              despesas_financeiras: { type: 'number' },
              lucro: { type: 'number' },
              impostos: { type: 'number' },
            },
            required: ['administracao', 'seguro', 'risco', 'despesas_financeiras', 'lucro', 'impostos'],
          },
        },
        required: ['obra_id', 'bdi_percentual', 'regime_tributario', 'bdi_detalhamento'],
      },
    },
    {
      name: 'orcamento_exportar',
      description: 'Exporta o orçamento completo em JSON (schema EVIS v2.0) pronto para importação.',
      inputSchema: {
        type: 'object',
        properties: {
          obra_id: { type: 'string', description: 'ID da obra' },
        },
        required: ['obra_id'],
      },
    },

    // --- PESQUISA WEB ---
    {
      name: 'cotacao_web',
      description: 'Pesquisa preços de mercado para itens que NÃO estejam bem cobertos pelas referências EVIS/SINAPI: materiais com marca, esquadrias, equipamentos e itens comerciais. Use quando referencia_buscar ou sinapi_buscar retornar vazio, genérico demais ou incompatível com o item solicitado.',
      inputSchema: {
        type: 'object',
        properties: {
          item: {
            type: 'string',
            description: 'Nome do item a pesquisar (ex: "Porcelanato Munari Marfim 60x60", "Coifa Electrolux 90cm", "Piso laminado QuickStep 8mm")',
          },
          contexto: {
            type: 'string',
            description: 'Contexto adicional para refinar a busca (padrão: "construção civil Brasil preço")',
          },
        },
        required: ['item'],
      },
    },
  ],
}));

// =============================================================
// EXECUÇÃO DAS TOOLS
// =============================================================
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result: any;

    switch (name) {
      // REFERÊNCIAS DE CUSTO
      case 'referencia_buscar':
      case 'sinapi_buscar':
        result = await sinapiSearch(args['termo'] as string, (args['limite'] as number) || 8);
        break;

      case 'sinapi_codigo':
        result = await sinapiGetByCodigo(args['codigo'] as string);
        break;

      case 'sinapi_multiplos':
        result = await sinapiGetMultiple(args['codigos'] as string[]);
        break;

      // ORÇAMENTOS
      case 'orcamento_criar':
        result = await orcamentoCriar(args as any);
        break;

      case 'orcamento_servico_adicionar':
        result = await orcamentoAdicionarServico(args as any);
        break;

      case 'orcamento_buscar':
        result = await orcamentoBuscar(args['identificador'] as string);
        break;

      case 'orcamento_listar_servicos':
        result = await orcamentoListarServicos(args['obra_id'] as string);
        break;

      case 'orcamento_atualizar_bdi':
        result = await orcamentoAtualizarBdi(args as any);
        break;

      case 'orcamento_exportar':
        result = await orcamentoExportar(args['obra_id'] as string);
        break;

      case 'cotacao_web':
        result = await cotacaoWeb(args['item'] as string, args['contexto'] as string | undefined);
        break;

      default:
        result = { success: false, error: `Tool "${name}" não encontrada` };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          }),
        },
      ],
      isError: true,
    };
  }
});

// =============================================================
// START
// =============================================================
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('✅ EVIS Orçamentos MCP Server rodando...');
