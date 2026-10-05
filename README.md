# Mini CX — Vita Bem-Estar

Sistema do desafio técnico PliQ para gerenciar contatos, consultar respostas e
acompanhar satisfação. Backend C#/.NET 8 com Dapper e SQL, PostgreSQL 16 e
frontend React 18 com TypeScript. Todos os serviços executam em Docker.

## Executar

Pré-requisitos: Docker em execução e plugin Docker Compose. As portas locais
3000 (interface), 8080 (API) e 5432 (PostgreSQL) precisam estar disponíveis.
Não é necessário instalar .NET, Node ou PostgreSQL na máquina.

Na raiz do repositório:

```sh
test -f .env || cp .env.example .env
docker compose up -d --build
```

Abra [http://localhost:3000](http://localhost:3000). A primeira execução compila
as imagens e importa o seed; aguarde a API iniciar. Para verificar:

```sh
docker compose ps
docker compose logs api
curl --fail http://localhost:8080/health
curl --fail http://localhost:8080/api/analytics/summary
```

Para parar, mantendo os dados:

```sh
docker compose down
```

O volume `postgres_data` preserva cadastros, edições e exclusões. A senha local
vem de `.env`, que não é versionado. Detalhes e exemplos de requisição estão em
[Ambiente Docker](docs/04-ambiente-docker.md).

## Funcionalidades

- Contatos: busca parcial por nome/e-mail sem diferenciar maiúsculas, paginação,
  criação, edição e exclusão com confirmação.
- Histórico: pesquisa, tipo, nota, comentário, canal e data UTC, mais recentes primeiro.
- Resumo: NPS, distribuição de promotores/neutros/detratores, total de respostas
  e média CSAT, calculados a partir de agregações SQL.
- Estados de carregamento, erro com nova tentativa e vazio; atualizações sem
  recarregar a página.

A exclusão é lógica: contatos excluídos somem das leituras e seus e-mails ficam
livres. As respostas desses contatos e respostas excluídas ficam fora dos indicadores.
Com o seed intacto, o resumo retorna NPS **24**, **978** respostas NPS,
classes **477/256/245**, percentuais **48,8/26,2/25,1**, **1.246** respostas totais
e CSAT **3,91**. Alterações nos contatos podem mudar esses números.

## Testes de integração

Os testes usam Node nativo, sem dependências adicionais, e exercitam a API real
com Dapper e PostgreSQL. Executam em um projeto Compose separado, sem portas
publicadas e com banco descartável em memória. Não alteram seus dados locais.

```sh
docker compose -f compose.test.yaml -p mini-cx-tests down
docker compose -f compose.test.yaml -p mini-cx-tests up --build --abort-on-container-exit --exit-code-from tests
docker compose -f compose.test.yaml -p mini-cx-tests down
```

O comando `up` termina com código zero quando todos os testes passam. A suíte
confere os valores exatos do resumo, paginação, busca, validações, CRUD,
duplicidade, reutilização de e-mail, todos os históricos do seed e indicadores
sem contatos ativos. Os testes excluem contatos **somente no banco descartável**.

## Organização e decisões

| Caminho | Responsabilidade |
|---|---|
| `backend/Contacts` | Endpoints, validação e SQL do cadastro/histórico |
| `backend/Analytics` | Consulta agregada e apresentação do resumo |
| `backend/Database` | Schema e importação do seed |
| `frontend/src/api` | Tipos do contrato e cliente HTTP |
| `frontend/src/features` | Resumo, contatos, formulário e histórico |
| `tests` | Testes de integração do contrato |
| `docs` | Enunciado, regras, contrato e instruções |

Escolhi PostgreSQL por suas chaves estrangeiras, datas com fuso e índice único
parcial: `lower(email)` é único apenas quando `deleted_at IS NULL`. Docker
padroniza o ambiente, mas exige Docker instalado; SQLite teria setup mais simples.
As tabelas preservam todos os campos do seed, inclusive empresa e respostas excluídas.
`TIMESTAMPTZ` preserva os instantes; as datas da API e do histórico usam UTC.
Um índice de respostas ativas por contato/data atende o histórico.

Dapper executa SQL escrito à mão com parâmetros nomeados. Busca e paginação
ocorrem no banco. A lista e seu total usam o mesmo snapshot em uma transação
`RepeatableRead`. O resumo usa `COUNT`, `CASE`, `AVG` e `JOIN`; o C# apenas calcula
percentuais a partir dos agregados e arredonda na apresentação. Empates de
arredondamento usam `AwayFromZero`, decisão adotada porque o contrato não define
esse caso. Sem NPS, o resumo retorna zeros; sem CSAT, média `null`.

O seed é importado automaticamente no startup, em uma transação com lock e
registro em `seed_imports`. Reiniciar não repete a carga nem desfaz suas alterações.
As sequences são ajustadas após os IDs explícitos do seed.

React Query organiza o estado de servidor e invalida os dados após alterações.
A busca tem debounce de 300 ms. Após criar/editar, a busca usa o e-mail salvo para
mostrar o resultado. Nginx serve o frontend e encaminha `/api` ao backend,
mantendo a mesma origem e dispensando CORS. CSS puro mantém a interface pequena;
fontes são servidas localmente. A faixa NPS desenha proporções das contagens da
API, sem recalcular o indicador.

Bônus escolhidos: **Docker Compose e testes automatizados**. Filtros de analytics,
agrupamentos, exportação CSV e gráficos não fazem parte desta entrega.

Com mais tempo, adicionaria migrações versionadas: `CREATE TABLE IF NOT EXISTS`
cria o schema, mas não atualiza estruturas existentes. Também ampliaria os testes
automatizados de interface, hoje verificada em navegador desktop e celular.

## Uso de IA

Usei Codex como apoio na leitura dos requisitos, modelagem, configuração Docker,
implementação e testes. Usei Impeccable para orientar e revisar a interface.
As decisões e consultas foram explicadas durante o desenvolvimento para estudo
e defesa na entrevista. O uso de IA não substitui minha responsabilidade de
compreender e revisar o código.

## Referências e entrega

[Enunciado original](docs/00-enunciado.md), [regras de negócio](docs/01-regras-de-negocio.md),
[contrato da API](docs/02-contrato-api.md) e [critérios](docs/03-criterios-avaliacao.md).

O trabalho está na branch `feat/mini-cx`, em commits por funcionalidade. Para a
entrega, o repositório deve ser privado e os avaliadores devem ter acesso de
leitura conforme o enunciado. O PR reúne a branch do projeto; cada commit não
precisa de um merge separado.
