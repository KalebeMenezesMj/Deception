# Especificação dos ícones SVG das cartas

Cada carta terá um ícone SVG desenhado à mão (line-art) representando o item.
Os arquivos ficam em `lib/icons/chunk-N.js` (um por bloco) e são consumidos
pelo gerador `tools/generate-icons.js`.

## Formato do arquivo

```js
'use strict';
module.exports = {
  'm001': `<svg content...>`,
  'm002': `<svg content...>`,
};
```

A chave é o **id da carta** (`m001`–`m090` para armas, `c001`–`c200` para pistas).
O valor é o **conteúdo interno do ícone** (elementos SVG, SEM a tag `<svg>`).

## Estilo obrigatório (consistência)

- **ViewBox do ícone:** `0 0 100 100` (o gerador centraliza e escala).
- **Traço:** `stroke="#1c2331"` (quase preto), `stroke-width="5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- **Preenchimento:** `fill="none"` por padrão. Uso de preenchimento leve é permitido
  para dar destaque (ex.: `fill="#f2b134"` dourado, `fill="#c8cfdb"` cinza claro).
- **Estilo:** line-art minimalista, reconhecível à primeira vista, desenho do objeto
  em si (sem texto, sem moldura, sem fundo).
- **Símbolos:** `stroke-linecap="round"` e `stroke-linejoin="round"` em TODOS os elementos
  de traço (use o atributo no `<g>` raiz para simplificar).

## Exemplo (ícone de faca)

```js
'm005': `<g fill="none" stroke="#1c2331" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M50 15 L50 55"/>
  <path d="M50 15 C50 30 62 38 62 55 L38 55 C38 38 50 30 50 15"/>
  <path d="M38 55 L62 55 L56 85 L44 85 Z" fill="#c8cfdb"/>
</g>`,
```

## Regras

1. Desenhe o **objeto real** que a carta representa (arme/pista), não um símbolo abstrato.
2. Use formas simples e poucos elementos (1–6 `<path>`/`<circle>`/`<rect>` por ícone).
3. O desenho deve caber confortavelmente no quadrado 100×100 (margem ~10px).
4. Não use texto, emojis, imagens ou `<style>`.
5. Garanta que o arquivo termina a lista de exatamente N ids (conte-os antes de terminar).
6. Valide que todo valor é string SVG válida (começa com `<` e termina com `>`).