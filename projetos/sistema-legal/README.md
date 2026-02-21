# 🏛️ Sistema Legal

Sistema jurídico completo com gestão de clientes, processos, contratos e documentos.

## 📄 Documentação para apresentação

- **APRESENTACAO-PROJETO.md** — Visão geral detalhada para apresentar o projeto
- **DEMO-PASSO-A-PASSO.md** — Roteiro de demonstração ao vivo (15–20 min)

## ⭐ Ficheiros principais
- **index.html** — estrutura e marcação
- **styles.css** — estilos (tema, sidebar, modais, tabelas)
- **script.js** — lógica, login, Firebase e configuração

## 📋 Configuração
- **CONFIGURACAO.md** — onde configurar Firebase, alterar senha, exportar/importar e convidados (sem expor chaves no documento). Inclui **Como testar localmente** (servidor HTTP).

## 🗂️ Estrutura atual
```
projetos/sistema-legal/
├── index.html
├── styles.css
├── script.js
├── CONFIGURACAO.md
├── GUIA-TESTES-PASSO-A-PASSO.md
├── abrir-para-testar.ps1
├── verificar-funcionalidade.ps1
├── trabalhar-aqui.ps1
├── _arquivados/
│   └── versoes-html/        # versões antigas
├── _docs/                   # guias e documentos
└── _outros-projetos/        # projetos paralelos
```

## ✅ Regras básicas
- Trabalhar apenas em `projetos/sistema-legal/`
- Manter **index.html**, **styles.css** e **script.js** como ficheiros principais

## 🧪 Testar localmente
Na pasta do projeto:
```powershell
cd projetos\sistema-legal
.\abrir-para-testar.ps1
```
O script inicia o servidor (Python) e abre http://localhost:8000 no browser. Ou execute manualmente `python -m http.server 8000` e abra esse endereço. Ver **CONFIGURACAO.md** → "Como testar localmente".

## 🧪 Testes automatizados (Playwright E2E)


```powershell
cd projetos\sistema-legal
npm run test:install   # primeira vez: instalar Chromium
npm test              # executar 5 testes (página, login, pesquisa, navegação)
```

**CI:** Os testes correm automaticamente no GitHub Actions em cada push/PR em `projetos/sistema-legal/`. Em caso de falha, o relatório Playwright fica disponível nos Artifacts.

## 📝 Comandos úteis
```powershell
cd projetos\sistema-legal
code index.html
.\verificar-funcionalidade.ps1   # verificar funções em script.js
```

## 🌐 Link oficial (GitHub Pages)
- `https://mchantre28.github.io/https-github.com-mchantre28-Sistema-Legal-prontos/`



