# Módulo de Branding Obrigatório

Toda a identidade visual dos documentos gerados (minutas, contratos, requerimentos, notificações, relatórios, faturas) é aplicada **exclusivamente** por este módulo.

## Ficheiro central da logo

- **Logo oficial:** `assets/logo-solicitadora.png` (ou `.svg`)
- Coloque aqui a nova logo; PNG ou SVG.
- Largura fixa 160–180 px (recomendado 170 px), altura automática.

## Pipeline de geração de documentos

1. Carregar template base (sem logo embutida).
2. Preencher dados dinâmicos.
3. Aplicar módulo de branding:
   - Injetar logo SVG no header via `getBrandedLogoHTML()` ou `getBrandedHeaderHTML()`.
   - Dimensões e container estável (header 100–120 px) vêm de `window.BRANDING`.
4. Aplicar estilos de consistência (margens 25 mm, fontes Inter/Lato/Roboto, line-height 1.35–1.5).
5. Exportar (PDF/DOCX) sem compressão na logo.

## Regras

- Nenhum template pode conter logos embutidas.
- Toda a aplicação de branding é feita pelo módulo central.
- Atualizar apenas `assets/logo-solicitadora.png` (ou .svg) para refletir em todos os documentos.

## API (window)

- `LOGO_DATA_URI` — data URI da logo (carregada de `assets/logo-solicitadora.png` ou .svg).
- `BRANDING` — objeto com `logoWidth`, `headerHeight`, `marginMm`, `fontFamily`, `lineHeight`, `firmName`, `firmTitle`, `documentStyles`.
- `getBrandedLogoHTML(logoDataUri?)` — fragmento HTML da logo para inserir em `.header-left`.
- `getBrandedHeaderHTML(logoDataUri?)` — header completo com logo.
- `applyBrandingToDocument(html, injectHeaderAfter?)` — injeta header oficial em HTML e remove logos embutidas.
