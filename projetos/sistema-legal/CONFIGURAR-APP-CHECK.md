# Configurar App Check — Proteção Firebase

O App Check protege o Firestore de abusos (bots, fraude, phishing). Está **preparado no código**; falta só obter a chave e ativar.

---

## Passo 1 — Criar chave reCAPTCHA v3

1. Aceda a: **https://www.google.com/recaptcha/admin/create**
2. Faça login com a conta Google do Firebase
3. Preencha:
   - **Label:** Sistema Legal (ou outro nome)
   - **Tipo reCAPTCHA:** reCAPTCHA v3
   - **Domínios:** 
     - `localhost` (testes)
     - `mchantre28.github.io` (produção)
     - O seu domínio se usar outro
4. Aceite os termos e clique em **Enviar**
5. Copie a **Chave do site** (Site Key) — algo como `6Lc...`

---

## Passo 2 — Associar no Firebase

1. Abra: **https://console.firebase.google.com/**
2. Projeto: **anapaulamedinasolicitadora**
3. Menu lateral: **App Check**
4. Clique em **Iniciar**
5. Em **Web**, clique em **Registar**
6. Escolha **reCAPTCHA v3**
7. Cole a **Chave do site** e a **Chave secreta** do passo 1
8. Guarde

---

## Passo 3 — Inserir no projeto

No ficheiro `script.js`, localize:

```javascript
const APP_CHECK_SITE_KEY = ''; // Ex: '6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
```

Substitua pelas aspas a sua **Chave do site** (só a pública):

```javascript
const APP_CHECK_SITE_KEY = '6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
```

---

## Passo 4 — Ativar a aplicação (produção)

1. Na consola Firebase, em **App Check**
2. Em **Firestore**, clique nos 3 pontos → **Implementar**
3. Confirme para passar a exigir App Check em todas as requisições

---

## Resumo

| Passo | Descrição |
|-------|-----------|
| 1 | Criar reCAPTCHA v3 em google.com/recaptcha/admin |
| 2 | Ligar a chave ao Firebase em App Check |
| 3 | Colar Site Key em `script.js` → `APP_CHECK_SITE_KEY` |
| 4 | Em App Check, ativar “Implementar” para Firestore |

---

## Nota

- Enquanto `APP_CHECK_SITE_KEY` estiver vazio, o App Check **não** está ativo.
- O reCAPTCHA v3 é invisível para o utilizador.
- Em caso de erro, desative temporariamente “Implementar” na consola e verifique as chaves e domínios.
