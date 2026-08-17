# Instalar o Sistema Legal no PC (Windows)

Este guia permite abrir o **Sistema Legal** como uma aplicação no Ambiente de Trabalho ou no Menu Iniciar — sem precisar de abrir o browser manualmente nem digitar `localhost`.

## Requisitos

- Windows 10 ou 11
- **Node.js** instalado ([nodejs.org](https://nodejs.org))
- Microsoft Edge ou Google Chrome (para janela tipo aplicação)

## Instalação (uma vez)

1. Abra a pasta do projeto:
   `C:\Users\paula\Documents\Sistema-Legal\projetos\sistema-legal`
2. Faça **duplo clique** em **`INSTALAR-DESKTOP.bat`**
3. Aguarde a instalação das dependências (só demora mais na primeira vez)
4. Quando terminar, aparecem dois atalhos **"Sistema Legal"**:
   - no **Ambiente de Trabalho**
   - no **Menu Iniciar** (Programs)

## Como abrir a aplicação

1. Clique no atalho **Sistema Legal** (Ambiente de Trabalho ou Menu Iniciar)
2. Aguarde alguns segundos — abre uma janela do sistema (sem barra de endereços)
3. **Mantenha aberta** a janela preta intitulada "Sistema Legal" enquanto estiver a trabalhar
4. Se o backend arrancar pela primeira vez, pode aparecer também uma janela "Sistema Legal - Backend" — deixe-a aberta

## Como fechar

1. Feche a janela da aplicação (browser)
2. Feche a janela preta "Sistema Legal"
3. Feche a janela "Sistema Legal - Backend" (se estiver aberta)

## Desinstalar (remover atalhos)

1. Faça duplo clique em **`DESINSTALAR-DESKTOP.bat`**
2. Os atalhos são removidos; **os seus dados e ficheiros do projeto não são apagados**

## Resolução de problemas

| Problema | Solução |
|----------|---------|
| "Node não reconhecido" | Instale Node.js e reinicie o PC |
| Página em branco | Aguarde 10–15 s e abra o atalho outra vez |
| Erro no backend | Abra `backend` num terminal e execute `npm install` e `npm start` |
| Quero abrir no browser normal | Use `ABRIR-SISTEMA.bat` em vez do atalho |

## Ficheiros relacionados

- `SISTEMA-LEGAL-APP.bat` — arranque usado pelo atalho (backend + frontend + janela app)
- `START-SISTEMA.bat` — arranque completo no browser normal
- `ABRIR-SISTEMA.bat` — atalho rápido para o arranque completo
