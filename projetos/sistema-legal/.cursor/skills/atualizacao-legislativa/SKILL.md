---
name: atualizacao-legislativa
description: Consulta fontes oficiais portuguesas (DRE, PGE, IRN, AIMA, OSAE) e aplica a lei vigente às minutas e procedimentos da solicitadoria. Use when generating legal documents, citing statutes, checking law updates, Diário da República, nacionalidade, heranças, registos, migração, or legislative changes.
---

# Atualização legislativa (Portugal)

## Regra

O texto vigente confirma-se em fonte oficial. A memória do modelo não substitui o DRE.

## Fontes (por ordem)

1. **DRE** — valor oficial: [diariodarepublica.pt](https://diariodarepublica.pt/dr/home)
   - Pesquisa: https://diariodarepublica.pt/dr/pesquisa
   - Consolidada (sem valor legal): https://diariodarepublica.pt/dr/legislacao-consolidada
   - Monitorização automática: 1.ª e 2.ª série
2. **PGE** — leitura articulada: https://www.pgdlisboa.pt/
3. **IRN** — nacionalidade, heranças, conservatórias: https://irn.justica.gov.pt/
4. **AIMA** — migração e asilo: https://aima.gov.pt/
5. **OSAE** — estatuto profissional: https://www.osae.pt/

Mapa de diplomas e pesquisas: [fontes.md](fontes.md)

## Fluxo

1. Identificar área: nacionalidade | heranças | registos | migração | justiça | profissional.
2. Abrir o diploma no DRE (ou consolidada + aviso de que o oficial é o DRE).
3. Confirmar artigo, redação e data da última alteração.
4. Aplicar à minuta ou ao procedimento.
5. Citar: diploma, n.º, data, artigo, URL.
6. Se a verificação falhar, dizer o que não foi confirmado. Não inventar.

## Monitorização periódica

Palavras-chave no DRE (1.ª série, atos com eficácia geral):

`nacionalidade`, `registo civil`, `herança`, `sucessões`, `AIMA`, `estrangeiros`, `solicitador`, `registo predial`, `registo comercial`, `RCBE`

Registar o resultado no JSON de monitorização legislativa do Sistema Legal. A verificação corre automaticamente no servidor e no GitHub, em dias úteis.

## Saída

- Citações com URL oficial
- Impacto prático na solicitadoria (o que muda no processo)
- Sem jargão desnecessário; tom jurídico, formal e claro
