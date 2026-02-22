# Configurar App Check — Proteção do Firestore

O App Check protege os recursos do Firebase (Firestore) contra abusos, fraude de faturamento e phishing.

## Passos

### 1. Obter chave reCAPTCHA v3

1. Aceda a **https://www.google.com/recaptcha/admin**
2. Faça login na conta Google associada ao Firebase
3. Clique em **+** (Criar)
4. Preencha:
   - **Rótulo:** Sistema Legal (ou outro nome)
   - **Tipo:** reCAPTCHA v3
   - **Domínios:** 
     - `anapaulamedinasolicitadora.firebaseapp.com`
     - `mchantre28.github.io`
     - `localhost` (para testes locais)
5. Aceite os termos e clique em **Submeter**
6. Copie a **chave do site** (Site Key) — formato `6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
7. Guarde também a **chave secreta** (Secret Key) — vai precisar no Firebase

### 2. Registar no Firebase Console

1. Aceda a **https://console.firebase.google.com/**
2. Selecione o projeto **anapaulamedinasolicitadora**
3. Menu lateral: **App Check** (em “Criar” / Build)
4. Clique em **Registar** (ou **Get started**)
5. Na secção **Apps**, localize a app Web (`appId: 1:420983654368:web:...`)
6. Clique em **Registar** ao lado da app Web
7. Escolha **reCAPTCHA v3** como fornecedor
8. Cole a **chave secreta** (Secret Key) do reCAPTCHA
9. Guarde

### 3. Configurar a chave no código

No ficheiro **script.js**, localize:

```javascript
const APP_CHECK_SITE_KEY = ''; // Ex: '6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
```

Substitua `''` pela **chave do site** (Site Key) que copiou. Por exemplo:

```javascript
const APP_CHECK_SITE_KEY = '6LcAbCdEf1234567890AbCdEf1234567890';
```

### 4. Ativar a aplicação de regras no Firestore

Nas **Regras do Firestore**, ative a verificação com App Check (opcional mas recomendado):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null 
        || request.auth.token.firebase.sign_in_provider == 'anonymous'
        || true;  // manter true em desenvolvimento; em produção usar App Check
    }
  }
}
```

Para produção com App Check ativo, utilize condições que exijam um token App Check válido.

---

## Notas

- O reCAPTCHA v3 é invisível para o utilizador.
- Os tokens são renovados automaticamente.
- Sem a chave configurada, o App Check não é ativado e o sistema continua a funcionar normalmente.
