# Mini CX

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 18+ com TypeScript, API .NET 8 com Dapper e PostgreSQL 16. Execução via Docker,
conforme decisão do usuário. O contrato REST é docs/02-contrato-api.md.

## Users

Equipe de Customer Experience da Vita Bem-Estar, rede de academias do cenário
do desafio. Gerencia contatos de alunos, consulta suas respostas e acompanha satisfação.

## Product Purpose

Permitir cadastro e manutenção de contatos, acesso ao histórico de respostas
e leitura de um resumo de satisfação calculado pelo banco.

## Operating Context

Desafio técnico com avaliação do código e apresentação pelo candidato. A interface
consome a API local via Docker. Usuário solicitou implementação por etapas explicadas
e commits pequenos em uma branch, com PR e merge ao final.

## Capabilities and Constraints

Contatos: busca, paginação, criação, edição, confirmação de exclusão e histórico.
Resumo: NPS, distribuição em três classes, total de respostas e média CSAT.
Exclusão lógica, métricas sem registros excluídos, SQL parametrizado e agregações
no banco. Interface precisa tratar carregamento, erro e vazio. Escopo obrigatório
definido pelo README e docs/01 a docs/03; bônus só após o obrigatório.

## Brand Commitments

Nome Vita Bem-Estar. Idioma português. Usuário escolheu interface clara com cores
mais vibrantes, orientada pelo Impeccable, construída diretamente em código.

## Evidence on Hand

data/seed.json: 3 pesquisas, 320 contatos, 1.284 respostas, incluindo 38 excluídas.
Backend obrigatório implementado e valores do resumo conferidos. Não há logo,
fotografias ou depoimentos fornecidos. Não criar afirmações comerciais fictícias.

## Product Principles

- Contrato e regras do desafio governam o comportamento.
- As métricas vêm da API, sem recalcular agregações no navegador.
- Erros devem explicar o problema e permitir recuperação.
- Cada etapa deve ser compreensível para apresentação técnica.
