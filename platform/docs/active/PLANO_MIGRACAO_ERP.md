# 🚀 Plano de Migração — EVIS AI para ERP Full

Este documento detalha a visão de longo prazo para a unificação dos Cockpits individuais em um sistema de gestão centralizado (ERP).

## 1. Arquitetura de Micro-Frontends
Os Cockpits atuais (Diário, Financeiro, Cronograma) foram construídos de forma modular. A migração deve:
- Transformar cada projeto em um submódulo de uma casca principal (Shell App).
- Compartilhar o `AppContext` via um barramento de eventos ou cache global (TanStack Query).

## 2. Unificação de Banco de Dados (Supabase)
Atualmente, as obras são isoladas por `obra_id`. O ERP deve introduzir:
- **Tabela de Empresas**: Para gerenciar múltiplas construtoras no mesmo banco.
- **Hierarquia de Usuários**: Implementar permissões (Admin, Engenheiro, Mestre, Cliente) via Supabase Auth + Custom Claims.

## 3. Integração de Módulos (O Próximo Salto)
- **Financeiro ↔ SINAPI**: Automatizar orçamentos baseados no avanço do cronograma.
- **IA Generativa ↔ Documentação**: Criar um Agente que lê todos os diários de obra e gera um relatório mensal consolidado de performance da empresa.

## 4. Roadmap de Engenharia
- [ ] Centralização dos tokens de IA em um Proxy seguro (Backend).
- [ ] Implementação de Testes de Integração entre obras.
- [ ] Criação de Dashboard executivo (Multi-obra Realtime).

---
*Documento final do ciclo de desenvolvimento autônomo do Evis AI Cockpit.*
