# Regras de front-end — Koala Supermercados

- HTML semântico; um único `<h1>` por página.
- Cores, espaços e raios só via `var(--...)` de `css/tokens.css`.
- Nunca cor hexadecimal fora de `css/tokens.css`.
- Reuse `.botao`, `.card` e `.campo`; não crie variações.
- Sem bibliotecas novas sem pedir.
- Teste em 360px, 768px e 1280px.

## Proibições explícitas
- Não usar `style="color: #..."` nem `background: #...` em HTML, JS ou outros CSS.
- Não usar valores soltos de `border-radius`; use `var(--raio)`.
- Não usar emoji como ícone nem ilustração infantil; imagens de produto são fotos reais em `img/fotos/` (créditos em `img/fotos/CREDITOS.md`).
- Não copiar logo, marca ou foto do Guanabara; a referência é só de layout.
- Não validar componente em página de produção: use `loja-koala/catalogo.html`.

## Marca e geometria
- A marca é **Koala** (com K). Logo em `img/logo.svg`.
- Geometria própria: bordas arredondadas (raio 12px), escala de espaço 4px, escala tipográfica 1.25.
- Tema claro e escuro: trocar só variáveis em `tokens.css` (`[data-tema="escuro"]`).

## Estrutura
- `css/tokens.css`: fonte única de design.
- `css/estilos.css`: componentes e layout.
- `js/data.js`: categorias, produtos, dicas, modelos de lista.
- `js/app.js`: tema, lista de compras (localStorage), menus do cabeçalho e acessibilidade.
- `js/formularios.js`: máscaras e confirmação dos formulários (a validação é a nativa do HTML5).
- `index.html` na raiz; as demais páginas em `loja-koala/`.
- Cabeçalho, menu e rodapé ficam escritos no HTML de cada página (iguais em todas).
- `loja-koala/catalogo.html`: todos os componentes em todos os estados.
