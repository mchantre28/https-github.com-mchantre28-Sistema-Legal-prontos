# Como abrir o Sistema Legal e ver as alterações

## Problema: Ctrl+F5 ou Ctrl+Shift+R não atualiza

**Causa:** Está a abrir o sistema a partir de uma pasta diferente (ex.: `prontos-temp` ou raiz). O `script.js` dessa pasta é uma cópia antiga **sem as alterações**.

## Solução: Use o ABRIR-SISTEMA.bat

1. **Feche todas as janelas** do browser com o sistema aberto
2. Feche a janela do servidor (se estiver aberta)
3. Na pasta `c:\experiencia`, execute **ABRIR-SISTEMA.bat**
4. O sistema abre em **http://localhost:8000** a partir de `projetos/sistema-legal`

## Confirmar que está na versão certa

- Na barra de endereços deve aparecer: **http://localhost:8000**
- Se aparecer outro URL (ex.: `file://`, outro porto, ou `prontos-temp`), está na pasta errada.

## Se ainda não atualizar

1. **Limpar cache do browser:** F12 → clique direito no botão de atualizar → "Esvaziar cache e atualizar"
2. Ou: Definições do browser → Privacidade → Limpar dados de navegação → Cache
3. Depois, abra de novo com **ABRIR-SISTEMA.bat**

## Nota sobre prontos-temp

A pasta `prontos-temp` tem uma cópia antiga do sistema. As alterações estão em **projetos/sistema-legal**. Para ver as últimas alterações, use sempre o **ABRIR-SISTEMA.bat**.
