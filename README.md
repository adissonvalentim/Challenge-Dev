# Desafio Técnico PliQ — Mini CX 📋

## Implementação em andamento

O projeto usa PostgreSQL 16 e API .NET 8 com Dapper, executados em Docker.
O frontend React 18 com TypeScript já apresenta resumo e listagem com busca e
paginação, além de criação e edição. Exclusão e histórico na interface ainda
estão pendentes.

Para executar banco e API, com Docker e Docker Compose instalados:

```sh
cp .env.example .env
docker compose up -d --build frontend
curl --fail http://localhost:8080/health
```

Abra http://localhost:3000 para acessar a interface.

Se já tiver um `.env`, mantenha suas configurações. A importação do
`data/seed.json` acontece automaticamente na primeira inicialização da API,
em uma transação, e não se repete nos reinícios. Todos os campos são preservados,
incluindo `deletedAt`. Veja os detalhes em
[Ambiente Docker](docs/04-ambiente-docker.md).

Escolhemos PostgreSQL para usar um banco relacional com chaves estrangeiras,
datas com fuso e índice único parcial para e-mails de contatos ativos. Docker
padroniza o ambiente, mas exige a instalação do Docker, enquanto SQLite seria
mais simples de configurar. Com mais tempo, usaríamos migrações versionadas:
o schema atual cria as tabelas, mas não atualiza estruturas já existentes.

### Uso de IA

Codex foi usado como apoio na leitura dos requisitos, criação do schema,
configuração Docker, implementação do backend com Dapper e frontend React.
Impeccable foi usado para orientar a direção visual e a revisão da interface. As etapas estão
sendo revisadas e explicadas durante o desenvolvimento para permitir a defesa
das decisões e das consultas na entrevista técnica.

As instruções originais do desafio estão preservadas abaixo.

---

Bem-vindo(a)! Este desafio faz parte do nosso processo seletivo para desenvolvedores(as)
de nível **júnior a pleno**. Ele foi desenhado para você mostrar, num escopo pequeno e
realista, como trabalha com as três camadas do nosso dia a dia: **banco de dados
relacional com SQL escrito à mão (Dapper)**, **API REST em C#** e **frontend em React**.

---

## O cenário

A **Vita Bem-Estar**, rede de academias com 12 unidades, coleta respostas de três
pesquisas de satisfação com seus alunos:

| Pesquisa | Tipo | Escala |
|---|---|---|
| NPS Pós-Treino | NPS | 0–10 |
| NPS Relacionamento 2026 | NPS | 0–10 |
| CSAT Onboarding de Novos Alunos | CSAT | 1–5 |

O time de Customer Experience precisa de um sistema para **gerenciar o cadastro de
contatos** (os alunos), **consultar o histórico de respostas de cada um** e acompanhar
um **resumo geral** da satisfação.

Todos os dados estão em [`data/seed.json`](data/seed.json) — 3 pesquisas, 320 contatos
e ~1.280 respostas do primeiro semestre de 2026. **Importar esse arquivo para o seu
banco de dados faz parte do desafio.**

## O que você vai construir

```
┌──────────────┐   SQL (Dapper)   ┌──────────────┐    REST/JSON    ┌──────────────┐
│    Banco     │ ◄──────────────► │   API C#     │ ◄─────────────► │  React SPA   │
│  (você       │                  │  (.NET 8+)   │                 │  (TS)        │
│   modela)    │                  │              │                 │              │
└──────────────┘                  └──────────────┘                 └──────────────┘
```

### 1. Banco de dados (você modela)

- **Qualquer banco relacional**: SQLite (recomendado — zero setup), PostgreSQL,
  MySQL ou SQL Server. Se usar um banco com servidor, inclua instruções simples de
  subida (docker-compose conta muito).
- **Você desenha o schema**: tabelas, tipos e chaves para pesquisas, contatos e
  respostas. Preserve todos os campos do seed (inclusive `deletedAt`!).
- **Importação do seed**: um caminho reproduzível de carga do `data/seed.json`
  (no startup da API, via script ou comando à parte — documente no README).

### 2. Backend (C# / .NET 8+ / Dapper)

Uma API REST enxuta (contrato completo em [`docs/02-contrato-api.md`](docs/02-contrato-api.md)):

- **Cadastro de contatos** — CRUD completo: listar com **busca e paginação**, detalhar,
  criar, editar e excluir, com validações e status codes corretos.
- **Histórico do contato** — as respostas de um contato, com o nome da pesquisa
  (JOIN respostas × pesquisas).
- **Resumo de satisfação** — um endpoint com o NPS geral, a distribuição
  promotores/neutros/detratores, o total de respostas e a média CSAT — tudo
  calculado **em SQL**.

**Regras do jogo no acesso a dados:**

- Acesso ao banco com **Dapper e SQL escrito por você**. ORMs completos (EF Core,
  NHibernate) não valem neste desafio — queremos ler o seu SQL.
- **Agregações acontecem no banco** (`GROUP BY`, `CASE`, `JOIN`), não em memória no
  C#. Carregar a tabela inteira e calcular com LINQ conta como não feito.
- **Parâmetros sempre nomeados** — SQL montado por concatenação/interpolação de
  entrada do usuário reprova o eixo de banco inteiro.

### 3. Frontend (React 18+ / TypeScript)

- **Tela de Contatos** — tabela com busca e paginação; criar, editar e excluir
  contato; ver o histórico de respostas de um contato (com nota, comentário e data).
- **Resumo de satisfação** — cards com os números do endpoint de resumo (NPS,
  distribuição, respostas, CSAT). **Não precisa de biblioteca de gráficos** — números
  bem apresentados bastam; gráficos são bônus.
- **Estados de carregamento, erro e vazio** — o app não pode "piscar em branco" nem
  quebrar quando a API falha.

Estilização é livre (CSS puro, Tailwind, styled-components...) — avaliamos clareza e
capricho, não framework.

## Regras de negócio

As fórmulas (classificação NPS, arredondamento, CSAT), as validações do cadastro e uma
regra **crítica** sobre registros excluídos estão em
[`docs/01-regras-de-negocio.md`](docs/01-regras-de-negocio.md). **Leia antes de
codar** — lá também há uma tabela de valores de conferência para você validar suas
consultas SQL.

## O que é obrigatório × o que é bônus

**Obrigatório** (o mínimo para avaliarmos):

- Banco relacional com schema próprio + importação reproduzível do seed;
- CRUD de contatos completo (com busca, paginação e validações) via Dapper;
- Respostas do contato (JOIN) e resumo de satisfação agregado em SQL, batendo com os
  valores de conferência;
- Frontend React + TypeScript com a tela de contatos e o resumo;
- README próprio com instruções de execução e decisões tomadas.

**Bônus** (nos ajudam a ver profundidade — escolha 1 ou 2, não tente todos):

- **Filtros no resumo** (`from`/`to`/`surveyId` via query params, validados);
- **NPS por mês** (`GROUP BY` temporal) com um gráfico de linha no front;
- **NPS por segmento de contato** (JOIN + GROUP BY);
- **Testes automatizados** (nas consultas SQL já contam muito; xUnit / Vitest);
- Exportação CSV das respostas; Docker Compose; CI simples.

## Entrega

- **Prazo**: 7 dias corridos a partir do recebimento.
- **Formato**: repositório Git **privado** (GitHub) com acesso de leitura para
  **tech@pliq.com.br**. Estruture como monorepo (`/backend` + `/frontend`) ou como
  preferir, desde que o README explique.
- **README do seu projeto** deve conter: como subir banco/API/front, decisões e
  trade-offs (por que esse banco, esse schema, o que faria diferente com mais tempo).
- **Commits**: trabalhe com commits pequenos e mensagens descritivas. O histórico
  faz parte da avaliação — não entregue um commit único "final".

### Sobre uso de IA

Pode usar (Copilot, Claude, ChatGPT etc.) — nós usamos. Mas duas condições:

1. Declare no README como usou;
2. **Você precisa defender cada linha** (em especial cada query): a fase seguinte é
   uma conversa técnica sobre o seu código, e "foi a IA que fez" não responde nenhuma
   pergunta.

## Como será avaliado

Os critérios completos e seus pesos estão públicos em
[`docs/03-criterios-avaliacao.md`](docs/03-criterios-avaliacao.md). Em resumo:
corretude das regras de negócio, modelagem e SQL, desenho da API REST, qualidade do
código nas duas pontas, experiência de uso e comunicação (README + commits).

---

**Dúvidas?** Escreva para tech@pliq.com.br. Perguntar não desconta ponto — em dúvida
entre duas interpretações, decida, documente no README e siga em frente. Boa sorte! 🚀
