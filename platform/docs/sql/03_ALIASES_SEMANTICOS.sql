-- ================================================================
-- ALIASES SEMÂNTICOS — EVIS AI
-- Gerado automaticamente por scratch/run_aliases.mjs
-- Data: 2026-04-14
-- Execute no Supabase SQL Editor na ordem abaixo.
-- ================================================================

-- ── PASSO 1: DDL ────────────────────────────────────────────────
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';
ALTER TABLE public.equipes_cadastro ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';

-- ── PASSO 2: SERVIÇOS ────────────────────────────────────────────

-- Administração
UPDATE public.servicos SET aliases = ARRAY['vistoria', 'aprovação', 'entrega', 'entrega de obra'] WHERE id = '9025af86-71f9-4b3a-99e7-93e9f7b4e473'; -- Vistoria Final
UPDATE public.servicos SET aliases = ARRAY['vistoria', 'aprovação', 'entrega', 'vistoria final', 'entrega de obra'] WHERE id = '1b3d62d0-5cd8-410d-ac49-7d60d92aae9b'; -- Aprovação Final — Shopping Barigui

-- Ar-condicionado
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'infra do ar', 'tubulação do ar', 'infra ac', 'drenos ac'] WHERE id = '3ec31b9b-32d4-45ca-b170-0adc3a0e34e6'; -- Infraestrutura de Drenos — AC — Salão 2
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'desmontar duto', 'duto', 'desmontagem'] WHERE id = '66bfcbbf-07dd-4c10-a088-b9b296c9e0c8'; -- Desmontagem de Duto — AC — Salão 1
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'instalação do ar', 'cassete', 'fancoil', 'equipamento ac', 'colocar ar'] WHERE id = '9bead7c1-74b5-4018-b4bb-a6c79ca6524e'; -- Instalação de Equipamento AC (cassete) — Salão 2
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'infra do ar', 'tubulação do ar', 'infra ac', 'drenos ac', 'câmara fria', 'rede frigorífica', 'frigorifico', 'frigorífica'] WHERE id = '8ece4ce0-c683-4b78-8539-94631dcf143a'; -- Infraestrutura da Rede Frigorífica — Salão 1
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'instalação do ar', 'cassete', 'fancoil', 'equipamento ac', 'colocar ar'] WHERE id = 'c668457f-ee4d-43a2-bc66-5a18a572deee'; -- Instalação de Equipamento AC — Salão 3
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'infra do ar', 'tubulação do ar', 'infra ac', 'drenos ac'] WHERE id = 'a056ff90-b178-4392-8281-9dd173c881f1'; -- Infraestrutura de Drenos — AC — Salão 1
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'infra do ar', 'tubulação do ar', 'infra ac', 'drenos ac'] WHERE id = 'e6771065-fdab-4c3d-8dcc-a75ad3fedd1c'; -- Infraestrutura AC — Salão 3
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'acabamento do ar', 'acabamentos ac'] WHERE id = 'ffd78431-7973-48ba-8c36-0f2a8d6b86b7'; -- Acabamentos AC — Salão 1
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'acabamento do ar', 'acabamentos ac'] WHERE id = '5fc39539-be55-4a14-94a6-23aa84c9ed3c'; -- Acabamentos AC — Salão 2
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'instalação do ar', 'cassete', 'fancoil', 'equipamento ac', 'colocar ar'] WHERE id = '4b789589-a8f4-4264-8f6b-cb909685186f'; -- Instalação de Equipamento AC (cassete) — Salão 1
UPDATE public.servicos SET aliases = ARRAY['ar condicionado', 'ac', 'climatização', 'desmontar duto', 'duto', 'desmontagem'] WHERE id = 'd1982464-0c82-404f-8c94-fa8d0f3ec274'; -- Desmontagem de Duto — AC — Salão 2

-- Demolições
UPDATE public.servicos SET aliases = ARRAY['demolição', 'quebra', 'retirada', 'quebrar parede', 'abrir parede'] WHERE id = '54a4d365-f726-4389-99a5-8747e187dfe3'; -- Retirada de Elementos de Parede — Salão 1
UPDATE public.servicos SET aliases = ARRAY['demolição', 'quebra', 'retirada', 'quebrar teto', 'abrir teto'] WHERE id = '6a6f309f-4782-4bc5-9c8f-144814ca0548'; -- Retirada de Elementos de Teto — Salão 1
UPDATE public.servicos SET aliases = ARRAY['demolição', 'quebra', 'retirada', 'tirar piso', 'retirar cerâmica', 'piso da cozinha', 'revestimento da cozinha'] WHERE id = 'ea746332-cb92-4021-8db6-b2f1bde3d656'; -- Retirada de Revestimentos — Cozinha

-- Drywall / Forro
UPDATE public.servicos SET aliases = ARRAY['forro', 'teto', 'placas do forro', 'forro de gesso acartonado', 'drywall', 'fechamento do forro'] WHERE id = 'eb164c81-c9df-4b9b-a981-5ecb9b5866bb'; -- Fechamento de Forro (placas) — Salão 1
UPDATE public.servicos SET aliases = ARRAY['forro', 'teto', 'tarugamento', 'tarugo', 'estrutura do forro', 'aramação do forro'] WHERE id = '1450d1bc-38e2-4b6c-9ac8-eb6c95fed841'; -- Tarugamento de Forro — Salão 1
UPDATE public.servicos SET aliases = ARRAY['forro', 'teto', 'tarugamento', 'tarugo', 'estrutura do forro', 'aramação do forro'] WHERE id = '97c67293-84f6-48b8-b3ca-9103ebb4ecb6'; -- Tarugamento de Forro — Salão 2
UPDATE public.servicos SET aliases = ARRAY['forro', 'teto', 'placas do forro', 'forro de gesso acartonado', 'drywall', 'fechamento do forro'] WHERE id = 'bb34abcd-0795-43d8-8cc4-79d034f78dc3'; -- Fechamento de Forro (placas) — Salão 2

-- Elétrica
UPDATE public.servicos SET aliases = ARRAY['elétrica', 'instalação elétrica', 'infra elétrica', 'tubulação elétrica', 'eletrocalha', 'eletroduto', 'fiação'] WHERE id = 'e2b5edc0-70d6-4daa-93ba-a22e2c2fc26c'; -- Infraestrutura Elétrica — Salão 2
UPDATE public.servicos SET aliases = ARRAY['elétrica', 'instalação elétrica', 'infra elétrica', 'tubulação elétrica', 'eletrocalha', 'eletroduto', 'fiação'] WHERE id = '74cf2aeb-23ad-4a26-a0be-7351f0423f59'; -- Infraestrutura Elétrica — Salão 1
UPDATE public.servicos SET aliases = ARRAY['elétrica', 'instalação elétrica', 'acabamento elétrico', 'tomadas', 'interruptores', 'luminárias', 'pontos elétricos'] WHERE id = '9d00b270-a8cd-4f71-acaa-61806fc8df1d'; -- Acabamentos Elétrica — Salão 2
UPDATE public.servicos SET aliases = ARRAY['elétrica', 'instalação elétrica', 'acabamento elétrico', 'tomadas', 'interruptores', 'luminárias', 'pontos elétricos'] WHERE id = 'bcc82e14-2656-485a-a74a-06e76ed7aa54'; -- Acabamentos Elétrica — Salão 1
UPDATE public.servicos SET aliases = ARRAY['elétrica', 'instalação elétrica', 'quadro elétrico', 'qd', 'disjuntor', 'quadro de distribuição'] WHERE id = 'b2fbc488-f2fd-4438-a8ba-759d1ff2d570'; -- Quadro Elétrico — Cozinha

-- Limpeza
UPDATE public.servicos SET aliases = ARRAY['limpeza', 'limpeza final', 'limpeza pós-obra', 'limpeza de entrega'] WHERE id = '8125eb91-4be5-418d-adec-0ced5a91dd53'; -- Limpeza Pós-obra — Salão 1
UPDATE public.servicos SET aliases = ARRAY['limpeza', 'limpeza final', 'limpeza pós-obra', 'limpeza de entrega'] WHERE id = '53fcc330-32b9-4937-9400-11de7e5ef515'; -- Limpeza Pós-obra — Salão 2

-- Marcenaria
UPDATE public.servicos SET aliases = ARRAY['forro', 'teto', 'forro de madeira', 'lambri', 'madeira no teto', 'marcenaria', 'revestimento de madeira'] WHERE id = 'bf1979b7-b0de-412d-879e-e8d58779d3c7'; -- Forro de Madeira — Salão 3
UPDATE public.servicos SET aliases = ARRAY['marcenaria', 'móveis', 'mobiliário planejado', 'mobiliário', 'armários', 'prateleiras', 'marceneiro'] WHERE id = '8ce66562-b954-4817-94f2-5a291b9a9953'; -- Mobiliário Planejado — Salão 1
UPDATE public.servicos SET aliases = ARRAY['marcenaria', 'móveis', 'mobiliário planejado', 'mobiliário', 'armários', 'prateleiras', 'marceneiro'] WHERE id = '246ec951-813c-4984-b8f9-f7d560ca9dd9'; -- Mobiliário Planejado — Salão 2

-- Pintura
UPDATE public.servicos SET aliases = ARRAY['pintura', 'tinta', 'massa corrida', 'lixamento', 'preparo da parede', 'emassamento', 'preparação para pintura'] WHERE id = 'ab90e6f1-ccd4-4917-a18a-5cc1e9de1fe6'; -- Emassamento / Lixamento / Preparação — Salão 2
UPDATE public.servicos SET aliases = ARRAY['pintura', 'tinta', 'pintura final', 'última mão', 'acabamento de pintura'] WHERE id = 'b9a225a9-99d2-4691-84b5-23be38fbac8a'; -- Pintura Final — Salão 2
UPDATE public.servicos SET aliases = ARRAY['pintura', 'tinta', 'primeira mão', '1ª mão', 'primera demão'] WHERE id = '4adaa2ea-1c00-49b9-9ae0-24534cd92ca5'; -- 1ª Demão de Pintura — Salão 2
UPDATE public.servicos SET aliases = ARRAY['pintura', 'tinta', 'pintura final', 'última mão', 'acabamento de pintura'] WHERE id = 'db105299-e85a-4f68-b7f3-a81fadcd0f68'; -- Pintura Final — Salão 1
UPDATE public.servicos SET aliases = ARRAY['pintura', 'tinta', 'primeira mão', '1ª mão', 'primera demão'] WHERE id = '16e0ea40-a94d-4440-bcca-c66c27581dd3'; -- 1ª Demão de Pintura — Salão 1
UPDATE public.servicos SET aliases = ARRAY['pintura', 'tinta', 'massa corrida', 'lixamento', 'preparo da parede', 'emassamento', 'preparação para pintura'] WHERE id = '494df53f-5f6a-4d0f-a75b-fc5be5d82f27'; -- Emassamento / Lixamento / Preparação — Salão 1

-- PPCI / Incêndio
UPDATE public.servicos SET aliases = ARRAY['ppci', 'incêndio', 'combate a incêndio', 'sprinkler', 'hidrante', 'estrutura ppci', 'estalonamento', 'suporte ppci'] WHERE id = 'e3fe57c8-81a3-46ad-b066-aec34410fdc8'; -- PPCI — Estalonamento e Estrutura de Incêndio — Salão 2
UPDATE public.servicos SET aliases = ARRAY['ppci', 'incêndio', 'combate a incêndio', 'sprinkler', 'hidrante', 'pontos de incêndio', 'instalação ppci', 'detector de fumaça', 'chuveiro'] WHERE id = 'f6857781-b03f-494d-b60a-8b51c775a330'; -- PPCI — Instalação de Pontos + Regulagem — Salão 1
UPDATE public.servicos SET aliases = ARRAY['ppci', 'incêndio', 'combate a incêndio', 'sprinkler', 'hidrante', 'pontos de incêndio', 'instalação ppci', 'detector de fumaça', 'chuveiro'] WHERE id = '87ce9593-ace3-4e3b-8a68-1b3e580b1f9e'; -- PPCI — Instalação de Pontos + Regulagem — Salão 2
UPDATE public.servicos SET aliases = ARRAY['ppci', 'incêndio', 'combate a incêndio', 'sprinkler', 'hidrante', 'estrutura ppci', 'estalonamento', 'suporte ppci'] WHERE id = '90ec9ef3-dd78-4b3d-9355-11ea1ac71c3d'; -- PPCI — Estalonamento e Estrutura de Incêndio — Salão 1

-- Preliminares
UPDATE public.servicos SET aliases = ARRAY['mobilização', 'montagem do canteiro', 'início', 'canteiro de obras', 'andaimes'] WHERE id = '4c094f12-8599-49af-9169-55f176837490'; -- Mobilização de Canteiro — Salão 2
UPDATE public.servicos SET aliases = ARRAY['proteção', 'isolamento de obra', 'tapume', 'proteção de piso'] WHERE id = '5d3e0bc5-4493-4006-af93-49962c611ddf'; -- Proteção de Piso e Esquadrias — Salão 1
UPDATE public.servicos SET aliases = ARRAY['isolamento', 'proteção', 'tapume'] WHERE id = '46780af4-cf06-43c9-ad8e-30c85ae6fd81'; -- Isolamento de Obra
UPDATE public.servicos SET aliases = ARRAY['isolamento', 'proteção', 'tapume'] WHERE id = 'aefbc1ab-d8b3-4ffb-97fc-bad42b9de856'; -- Isolamento — Salão 2
UPDATE public.servicos SET aliases = ARRAY['mobilização de mobiliário', 'colocar móveis', 'entrada de móveis', 'mobilização'] WHERE id = '6999b85e-4a7f-4651-aae5-5ed0845f01a5'; -- Mobilização de Mobiliário — Salão 1
UPDATE public.servicos SET aliases = ARRAY['desmobilização', 'retirada de móveis', 'saída', 'tirar móveis'] WHERE id = '374bd158-1839-47db-a17c-6a3901b83664'; -- Desmobilização de Mobiliário — Salão 2
UPDATE public.servicos SET aliases = ARRAY['desmobilização', 'retirada de móveis', 'saída', 'tirar móveis'] WHERE id = '34fb9922-7fe3-4de6-9841-445698058385'; -- Desmobilização de Mobiliário — Salão 1
UPDATE public.servicos SET aliases = ARRAY['mobilização de mobiliário', 'colocar móveis', 'entrada de móveis', 'mobilização'] WHERE id = 'aed1a0e0-5cc8-482a-8e77-1f3cc96a2006'; -- Mobilização de Mobiliário — Salão 2
UPDATE public.servicos SET aliases = ARRAY['mobilização', 'montagem do canteiro', 'início', 'canteiro de obras', 'andaimes'] WHERE id = '2cb4db3d-7d26-4687-ba9a-204d04c8f7e7'; -- Mobilização de Canteiro (andaimes) — Salão 1
UPDATE public.servicos SET aliases = ARRAY['proteção de piso', 'proteção', 'tapume', 'isolamento'] WHERE id = '26da5f89-4af5-4fcd-be4a-f81d6742a4a2'; -- Proteção de Piso — Salão 2

-- Revestimento
UPDATE public.servicos SET aliases = ARRAY['piso', 'revestimento', 'porcelanato', 'colocar porcelanato', 'assentamento porcelanato', 'piso da cozinha', 'revestimento da cozinha'] WHERE id = '624dea52-b7c0-4751-aa16-0ff3aade5123'; -- Revestimento de Porcelanato — Cozinha

-- ── PASSO 3: EQUIPES ─────────────────────────────────────────────

UPDATE public.equipes_cadastro SET aliases = ARRAY['ademarcos', 'ar condicionado', 'ac', 'climatização', 'refrigeração', 'equipe do ar', 'pessoal do ar'] WHERE id = 'a2f6f098-e096-46ab-b064-9583c98846a5'; -- Ademarcos AC
UPDATE public.equipes_cadastro SET aliases = ARRAY['domínio', 'refrigeração', 'ar condicionado', 'ac', 'climatização', 'equipe do ar', 'pessoal do ar', 'câmara fria', 'rede frigorífica', 'frigorífico'] WHERE id = '0d265e5f-c025-4b52-a365-98f53d41a204'; -- Domínio Refrigeração
UPDATE public.equipes_cadastro SET aliases = ARRAY['valdeci', 'empreiteiro', 'pedreiros', 'civil', 'estrutural', 'equipe civil', 'pessoal da obra', 'empreiteiro civil'] WHERE id = '5c36bdf9-60f4-4839-87f1-7c64f62928de'; -- Valdeci José Empreiteiro
UPDATE public.equipes_cadastro SET aliases = ARRAY['lumitech', 'lumi', 'elétrica', 'eletricistas', 'pessoal da elétrica', 'equipe elétrica', 'os da elétrica', 'time da elétrica'] WHERE id = '0c1196e3-140c-43ee-8f68-192c2712232d'; -- Lumitech
UPDATE public.equipes_cadastro SET aliases = ARRAY['pablo', 'ppci', 'incêndio', 'combate a incêndio', 'pessoal do ppci', 'equipe ppci', 'sprinkler', 'hidrante'] WHERE id = '84c75545-31fc-4114-8158-532d441a033a'; -- Pablo PPCI
UPDATE public.equipes_cadastro SET aliases = ARRAY['limpeza', 'equipe de limpeza', 'pessoal da limpeza', 'faxina', 'limpadores'] WHERE id = '8e614dc1-a0ac-40c5-aad1-cf468af87a80'; -- [Limpeza]
UPDATE public.equipes_cadastro SET aliases = ARRAY['marcenaria', 'marceneiros', 'móveis', 'pessoal da marcenaria', 'equipe de marcenaria', 'os da marcenaria', 'time de marcenaria', 'mobiliário'] WHERE id = 'db26c937-bffd-4189-952e-11a030c58dbe'; -- Marcenaria
UPDATE public.equipes_cadastro SET aliases = ARRAY['roberto', 'som', 'sonorização', 'equipe de som', 'pessoal do som', 'caixas de som', 'áudio'] WHERE id = '21ee55f3-92a1-4ade-bfeb-490f3e8fd688'; -- Roberto Som

-- ── VERIFICAÇÃO ──────────────────────────────────────────────────
SELECT id, nome, aliases FROM public.servicos WHERE aliases != '{}' ORDER BY nome;
SELECT id, nome, funcao, aliases FROM public.equipes_cadastro WHERE aliases != '{}' ORDER BY nome;
