# Checkpoint 06 — Ícones SVG das cartas

**Status:** ✅ concluído e testado

## Objetivo
Cada carta (200 pistas + 90 armas = 290) agora tem um **ícone SVG próprio** com o
desenho da carta e o desenho do item (arma ou prova) no centro.

## O que foi feito

1. **Especificação de estilo** (`lib/icons/README.md`): line-art minimalista,
   viewBox 100×100, traço `#1c2331` espessura 5, cantos redondos, sem texto.
2. **6 blocos de ícones** desenhados à mão por subagentes em paralelo
   (`lib/icons/chunk-1.js` … `chunk-6.js`):
   - chunk-1: armas m001–m045 (45)
   - chunk-2: armas m046–m090 (45)
   - chunk-3: pistas c001–c050 (50)
   - chunk-4: pistas c051–c100 (50)
   - chunk-5: pistas c101–c150 (50)
   - chunk-6: pistas c151–c200 (50)
3. **Gerador** (`tools/generate-icons.js`): monta o SVG final de cada carta —
   moldura (vermelha para pistas, azul para armas), faixa superior colorida,
   contorno tracejado interno, ícone centralizado e **nome em português**.
4. **Frontend** (`public/js/common.js`): as cartas agora exibem o SVG
   (`<img src="/icons/{id}.svg">`) com fallback para emoji se o SVG não carregar.
5. **Saída**: `public/icons/{id}.svg` — 290 arquivos.

## Testes

- `test/test-icons.js` (novo): 3 verificações — todos os 290 SVGs existem, são bem
  formados (moldura + nome + cor) e nomes com `&` escapados. ✅
- Suíte completa: **54/54 verificações** (26 + 6 + 9 + 10 + 3). ✅
- SVGs servidos corretamente (`/icons/m005.svg` → 200).

## Como regenerar

```bash
node tools/generate-icons.js
```

Requer que todos os `lib/icons/chunk-*.js` existam (290 ícones).