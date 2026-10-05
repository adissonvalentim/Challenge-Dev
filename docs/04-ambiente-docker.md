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
com `{ "error": "mensagem legível" }`. Os demais endpoints do contrato ainda serão
implementados.

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
