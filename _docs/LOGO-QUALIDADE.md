# Melhorar a qualidade do logo

## 1. Ficheiro de origem (o mais importante)

A qualidade no ecrã e em PDF depende do **ficheiro que coloca em `assets/`**.

| Formato | Vantagem | Recomendação |
|---------|----------|--------------|
| **SVG** | Escala sem perder nitidez (vetorial) | **Melhor opção** — use `logo-solicitadora.svg` ou `ana.svg` em `assets/` |
| **PNG** | Boa qualidade se for grande | Mínimo **440×440 px** (ou 220 px de altura) para exibir a 220 px sem ficar pixelado |
| **PNG pequeno** | — | Evitar: ex.: 100×100 px a 220 px fica desfocado |

**Resumo:**  
- Se tiver o logo em **vetor (AI, PDF, SVG)** → exporte como **SVG** e coloque em `assets/logo-solicitadora.svg` ou `assets/ana.svg`.  
- Se só tiver **PNG** → use uma versão **em alta resolução** (pelo menos o dobro do tamanho de exibição: ex. 440 px de largura para mostrar a 220 px).

---

## 2. Onde colocar os ficheiros

- **Raiz do projeto:** `c:\experiencia\assets\`
  - `ana.png` ou `ana.svg` (fatura)
  - `logo-solicitadora.png` ou `logo-solicitadora.svg`
- **Sistema Legal (browser):** o script `build-logo-data.cjs` lê de `assets/` e gera `projetos/sistema-legal/logo-data.js`.  
  Depois de trocar o ficheiro, execute na pasta do sistema-legal:
  ```bash
  node build-logo-data.cjs
  ```

---

## 3. Ordem de preferência no projeto

O código usa a primeira opção que existir:

1. `assets/ana.png` ou `assets/ana.svg`
2. `assets/logo-solicitadora.png`
3. `assets/logo-solicitadora.svg`

**SVG tem prioridade** se existir (ex.: `ana.svg` + `ana.png` → usa `ana.svg`).

---

## 4. Checklist para logo nítido

- [ ] Ficheiro em **SVG** ou PNG com **pelo menos 440 px de largura** (ou altura equivalente)
- [ ] Ficheiro colocado em `assets/` (e, se usar sistema-legal, `node build-logo-data.cjs` executado)
- [ ] Em PDF/impressão: o mesmo ficheiro de alta resolução é usado; evite reduzir demais a resolução ao exportar

---

## 5. Se não tiver logo em vetor

- Peça ao designer o **SVG** ou um **PNG “2x” ou “3x”** (ex.: 660 px de largura).
- Se usar Canva/Figma: exporte em **PNG** com tamanho **2×** ou **3×** o tamanho de exibição (220 px → exportar 440 px ou 660 px).

Com o ficheiro correto em `assets/`, a qualidade do logo melhora em todo o projeto (fatura, PDF, Sistema Legal).
