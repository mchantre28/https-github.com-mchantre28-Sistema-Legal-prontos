# Como publicar alterações no GitHub Pages

Quando faz alterações localmente, o website no GitHub não atualiza automaticamente. É preciso **enviar (push)** as alterações para o GitHub.

---

## Método rápido (terminal no Cursor)

1. Abra o **Terminal** no Cursor: **Ctrl+`** (ou Terminal → Novo Terminal)
2. Execute os comandos:

```powershell
cd c:\experiencia
git add projetos/sistema-legal/
git status
git commit -m "Atualizar Sistema Legal"
git push origin main
```

3. Aguarde 1–3 minutos para o GitHub Pages atualizar
4. Atualize a página no browser (Ctrl+F5 para forçar recarregar sem cache)

---

## Método com ficheiro .bat

1. Dê duplo clique em **`PUBLICAR-NO-GITHUB.bat`** (na pasta sistema-legal)
2. Se aparecer erro "prontos-temp não existe", use o **Método rápido** acima

---

## Onde está o website

- **GitHub Pages:** `https://mchantre28.github.io/https-github.com-mchantre28-Sistema-Legal-prontos/`
- Se o GitHub Pages estiver configurado noutro repositório, o push deve ser feito nesse repositório

---

## Resumo

| Situação | O que fazer |
|----------|-------------|
| Alterações em `script.js`, `index.html`, etc. | `git add` → `git commit` → `git push` |
| GitHub Pages não atualiza | Aguardar 2–3 min; fazer Ctrl+F5 no browser |
| Erro ao fazer push | Verificar login no GitHub; ver se tem permissão no repositório |
