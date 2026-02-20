# Guia: Deploy Firestore (Regras + Índices)

Este guia explica como publicar as regras e índices do Firestore no projeto **anapaulamedinasolicitadora**.

---

## Opção A: Usar a linha de comandos (recomendado)

### Passo 1 – Instalar Firebase CLI

No PowerShell:

```powershell
npm install -g firebase-tools
```

### Passo 2 – Fazer login

```powershell
firebase login
```

Abre o browser; inicia sessão na conta Google que gere o projeto Firebase.

### Passo 3 – Executar o script de deploy

Na pasta do projeto:

```powershell
cd c:\experiencia\projetos\sistema-legal
.\DEPLOY-FIREBASE.ps1
```

O script envia **regras** e **índices** para o Firestore.

---

## Opção B: Fazer tudo manualmente

### Deploy via CLI (comandos um a um)

```powershell
cd c:\experiencia\projetos\sistema-legal
firebase use anapaulamedinasolicitadora
firebase deploy --only firestore
```

---

## Opção C: Pela consola do Firebase (só se preferir não usar CLI)

### Regras

1. Abra: https://console.firebase.google.com
2. Selecione o projeto **anapaulamedinasolicitadora**
3. Menu lateral: **Firestore Database** → **Regras**
4. Copie o conteúdo de `firestore.rules` e cole no editor
5. Clique em **Publicar**

### Índices

1. Em **Firestore Database** → **Índices** → **Índices compostos**
2. Clique em **Criar índice**
3. Para cada índice em `firestore.indexes.json`, crie um índice com:
   - Coleção
   - Campos e ordem (ASC/DESC)
   - Âmbito da recolha (coleção)

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| `firebase: command not found` | Execute `npm install -g firebase-tools` |
| "Permission denied" | Execute `firebase login` |
| "Project not found" | Confirme que tem acesso ao projeto na consola Firebase |
| "Index already exists" | Normal; o Firebase ignora índices duplicados |

---

## Ficheiros criados

- `firebase.json` – configuração do Firebase CLI
- `firestore.rules` – regras de segurança do Firestore
- `firestore.indexes.json` – índices compostos
- `DEPLOY-FIREBASE.ps1` – script de deploy
