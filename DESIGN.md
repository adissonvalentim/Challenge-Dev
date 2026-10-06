---
name: Mini CX — Vita Bem-Estar
description: Interface clara com cores vibrantes para consultas de satisfação e contatos.
colors:
  brand: "#123e32"
  action: "#b8f36d"
  ink: "#19392f"
  muted: "#52675c"
  ground: "#f3f7f4"
  surface: "#ffffff"
  line: "#dce5df"
  promoters: "#297c3e"
  neutrals: "#315ac3"
  detractors: "#bd4033"
typography:
  heading:
    fontFamily: "Nunito Sans, Segoe UI, sans-serif"
    fontSize: "clamp(1.7rem, 3vw, 2.25rem)"
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Segoe UI, Roboto, Helvetica, Arial, sans-serif"
  button:
    fontSize: "0.9rem"
    fontWeight: 600
rounded:
  control: "8px"
  surface: "14px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.brand}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  navigation-active:
    backgroundColor: "{colors.action}"
    textColor: "{colors.brand}"
  surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
---

# Sistema visual — Mini CX

## Overview

Interface clara com cores vibrantes, conforme direção confirmada pelo usuário.
O modo é operacional: navegação, dados e estados permanecem legíveis. Esta
documentação descreve o resumo, a listagem, os formulários de criação e edição,
a confirmação de exclusão e o histórico de respostas implementados.
Fonte de verdade: `frontend/src/styles.css`.

## Colors

Verde profundo no shell, verde vibrante na navegação ativa, superfícies brancas
e fundo verde muito claro. Verde, azul e coral distinguem as classes NPS, sempre
acompanhados por nomes, quantidades e percentuais.

## Typography

Títulos e marca usam Nunito Sans local, nos pesos 700 e 800 distribuídos pelo
Fontsource. A interface usa a pilha de sistema do frontmatter. Números de métricas
e tabelas usam numerais tabulares. O título principal tem a escala fluida registrada.

## Layout

Desktop: lateral de 230px, barra superior de 76px, conteúdo com padding de 40px
e largura máxima de 1450px. Até 1050px: lateral de 190px e padding de 28px.
Até 700px: navegação no topo, métricas empilhadas e padding de 20px nas laterais.
A tabela tem largura mínima de 650px e rolagem horizontal dentro de seu container.

## Elevation & Depth

Superfícies planas, com limites por borda de 1px ou contraste de fundo. Não há
sombras no sistema implementado.

## Shapes

Controles com raio de 8px, superfícies de dados com raio de 14px e marcadores
circulares pequenos nas categorias. Sem imagens raster na interface.

## Components

Navegação com Lucide, rótulos e estado ativo. Botões secundários brancos com
borda; hover verde claro, foco azul de 3px e disabled com opacidade reduzida.
Busca com rótulo acessível e debounce. Feedback distingue erro, carregamento
e vazio; erros oferecem retry. Cards mostram valores da API e a distribuição
usa counts para desenhar proporções estáticas, sem animação de largura.

A exclusão pede confirmação em uma superfície inline acima da listagem, com
nome do contato, explicação do efeito e ações de confirmar ou cancelar. A ação
destrutiva usa vermelho escuro sobre fundo coral claro; durante a exclusão,
as ações ficam desabilitadas e o botão informa o andamento. Erros permanecem
na confirmação e o sucesso aparece como aviso de status.

Os detalhes do contato abrem em uma área própria com nome e e-mail no topo,
formulário à esquerda e satisfação/histórico à direita; até 1050px ficam
empilhados. A linha da tabela abre os detalhes; Ver contato oferece a mesma
navegação por teclado. Excluir abre apenas a confirmação. Voltar foca o título
da listagem. O formulário recebe foco inicial sem disputa com o histórico.

O painel individual apresenta total de respostas, classificação NPS mais recente
e contagens por classe recebidas da API. Cada resposta do histórico tem divisória,
pesquisa/data UTC/canal agrupados, nota destacada com escala NPS /10 ou CSAT /5
e comentário identificado. Comentários preservam quebras de linha e textos
longos quebram sem ultrapassar o container. Carregamento, erro com retry,
histórico vazio e ausência de comentário têm mensagens próprias.

## Do's and Don'ts

- Manter rótulos textuais junto às categorias coloridas.
- Preservar foco visível e navegação por teclado.
- Apresentar as métricas recebidas, sem recalcular NPS no navegador.
- Manter e-mails legíveis usando rolagem local no celular.
- Não inventar números, capacidades ou afirmações comerciais.
