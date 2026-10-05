# Ambiente de desenvolvimento

O projeto usará PostgreSQL, API .NET com Dapper e frontend React com TypeScript,
executados em containers Docker. Não será necessário instalar o SDK .NET ou Node
na máquina para executar a aplicação.

## Banco de dados

Pré-requisito: Docker com o plugin Docker Compose.

Na raiz do repositório:

```sh
cp .env.example .env
docker compose up -d db
docker compose ps
```

O PostgreSQL fica disponível em `localhost:5432`, com banco e usuário `mini_cx`.
A senha vem do arquivo `.env`.

Para acessar o banco pelo terminal:

```sh
docker compose exec db psql -U mini_cx -d mini_cx
```

Dentro do psql, `\dt` lista as tabelas e `\q` sai.

O Docker executa `backend/Database/schema.sql` automaticamente apenas na primeira
inicialização de um volume vazio. Alterar o arquivo depois não atualiza um banco
existente; futuras mudanças precisarão de scripts de migração.

Os dados persistem no volume `postgres_data`, inclusive após `docker compose down`.
O schema cria a estrutura; a API importa o seed com Dapper na primeira execução.

## API e importação do seed

Para subir o banco e compilar a API, na raiz do repositório:

```sh
docker compose up -d --build api
docker compose logs api
curl --fail http://localhost:8080/health
```

A rota operacional `/health` retorna `{"status":"ok"}` após a inicialização.
A listagem de contatos já está disponível:

```sh
curl --fail 'http://localhost:8080/api/contacts?search=ana&page=1&pageSize=20'
```

A busca considera nome ou e-mail sem diferenciar maiúsculas. `page` tem default 1,
e `pageSize` tem default 20, limitado a 1–100. Parâmetros inválidos retornam HTTP 400
com `{ "error": "mensagem legível" }`.

Para consultar um contato específico:

```sh
curl --fail http://localhost:8080/api/contacts/1
```

`GET /api/contacts/{id}` retorna HTTP 200 com `id`, `name`, `email` e `segment`,
ou HTTP 404 quando o contato não existe ou foi excluído logicamente. Os demais
endpoints do contrato ainda serão implementados, exceto o cadastro abaixo.

Para criar um contato:

```sh
curl -i http://localhost:8080/api/contacts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Aluno de exemplo","email":"aluno@example.com","segment":null}'
```

`POST /api/contacts` retorna 201 com o contato criado e header `Location`.
Nome vazio, e-mail inválido ou corpo JSON inválido retornam 400; e-mail já usado
por contato ativo retorna 409, ignorando maiúsculas. Os erros têm corpo
`{ "error": "mensagem legível" }`.

O Dockerfile usa o SDK .NET 8 para compilar e uma imagem do runtime ASP.NET 8
para executar, com usuário sem privilégios de root. Dapper executa o SQL e
Npgsql conecta ao PostgreSQL. Dentro da rede Docker, a API acessa o banco pelo
nome `db`; `localhost` dentro do container apontaria para o próprio container.

O Compose aguarda o PostgreSQL ficar saudável antes de iniciar a API e monta
`data/seed.json` como arquivo somente para leitura.

A carga cria 1 empresa, 3 pesquisas, 320 contatos e 1.284 respostas, preservando
as 38 respostas excluídas. Os inserts e o registro de importação são feitos na
mesma transação. A tabela `seed_imports` impede repetir a carga nos reinícios,
preservando futuras edições e exclusões. As sequences são ajustadas para que os
próximos IDs gerados não colidam com os IDs do seed.

Para parar os serviços mantendo os dados:

```sh
docker compose down
```

O frontend ainda será adicionado ao Compose com sua implementação.

## Edição de contatos

`PUT /api/contacts/{id}` recebe os mesmos campos do POST e retorna 200 com o
contato atualizado. Aplica as mesmas validações (400) e regra de duplicidade
(409), permitindo manter o próprio e-mail. Contato inexistente ou excluído
retorna 404.

## Exclusão de contatos

`DELETE /api/contacts/{id}` marca `deleted_at` e retorna 204 sem corpo.
Contato inexistente ou já excluído retorna 404. A linha permanece no banco,
não aparece nas leituras e seu e-mail fica disponível para novos cadastros.

## Histórico de respostas

```sh
curl --fail http://localhost:8080/api/contacts/1/responses
```

`GET /api/contacts/{id}/responses` retorna 200 com as respostas válidas, nome
e tipo da pesquisa, nota, comentário, canal e data UTC. Ordenação: mais recente
primeiro. Contato ativo sem respostas retorna `[]`; inexistente/excluído retorna
404. O CRUD, histórico e resumo estão implementados; o frontend ainda está pendente.

## Resumo de satisfação

```sh
curl --fail http://localhost:8080/api/analytics/summary
```

Uma consulta SQL agrega as respostas de contatos ativos, excluindo respostas
com `deleted_at` preenchido. O NPS usa somente pesquisas NPS; a média CSAT
usa somente CSAT. `responsesCount` inclui os dois tipos. Com o seed intacto:
NPS 24, 978 respostas NPS, promotores/neutros/detratores 477/256/245, percentuais
48,8/26,2/25,1, total 1.246 e CSAT 3,91.

Excluir um contato também retira suas respostas do resumo, pois contatos
excluídos somem das leituras. Sem respostas NPS, score e classes retornam zero;
sem respostas CSAT, `csatAvg` retorna null. O arredondamento é feito somente
na apresentação: NPS inteiro, percentuais com uma casa e CSAT com duas. Empates
exatos de arredondamento usam AwayFromZero, decisão adotada porque o contrato
não especifica o tratamento de empates. Filtros opcionais não foram implementados.

## Frontend React

```sh
docker compose up -d --build frontend
```

Abra http://localhost:3000. O frontend React 18 com TypeScript é compilado pelo
Vite dentro de uma imagem Node e servido pelo Nginx. O Nginx encaminha `/api` ao
backend; não é necessário configurar CORS porque o navegador usa a mesma origem.

Nesta etapa: resumo, distribuição NPS, listagem de contatos, busca e paginação
com estados de carregamento, erro e vazio. Formulários, exclusão e histórico na
interface ainda serão adicionados. React Query gerencia cache e requisições;
a busca aplica debounce de 300 ms. A interface usa os valores do endpoint de
resumo; a faixa representa a distribuição, sem recalcular o NPS.
