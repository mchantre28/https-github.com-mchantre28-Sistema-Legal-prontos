# Google Play Store — Sistema Legal (Android)

Guia prático para assinar, gerar o AAB e publicar a app **Sistema Legal** (`com.sistemalegal.app`).

---

## 1. Pré-requisitos

- Conta [Google Play Console](https://play.google.com/console) (taxa única de registo)
- Android Studio instalado (JDK incluído em `jbr`)
- Keystore de release criada **uma única vez** — guarde passwords num local seguro

---

## 2. Ícone da app

O ícone usa a logo oficial (`assets/logo-solicitadora.png`, 1024×1024).

**Regenerar ícones Android** (após alterar a logo):

```powershell
cd C:\experiencia\projetos\sistema-legal
# Atualize resources\icon-only.png se necessário (cópia da logo 1024×1024)
npm run icons:android
npm run cap:sync
```

Reinstale a app no dispositivo/emulador para ver o novo ícone (desinstalar + Run no Android Studio, ou `adb install -r`).

---

## 3. Criar keystore de release

Execute **uma vez** (substitua dados conforme necessário):

```powershell
cd C:\experiencia\projetos\sistema-legal\android
New-Item -ItemType Directory -Force -Path keystore | Out-Null

keytool -genkeypair -v `
  -keystore keystore\sistema-legal-release.keystore `
  -alias sistema-legal `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -storetype PKCS12
```

Guarde:

| Campo | Exemplo |
|-------|---------|
| Keystore | `android/keystore/sistema-legal-release.keystore` |
| Alias | `sistema-legal` |
| Passwords | (as que definiu no keytool) |

> **Importante:** Se perder a keystore ou as passwords, não poderá actualizar a app na Play Store com o mesmo `applicationId`.

---

## 4. Configurar assinatura (sem commit de segredos)

```powershell
copy android\release-signing.properties.example android\release-signing.properties
```

Edite `android/release-signing.properties`:

```properties
storeFile=keystore/sistema-legal-release.keystore
storePassword=SUA_PASSWORD_DA_KEYSTORE
keyAlias=sistema-legal
keyPassword=SUA_PASSWORD_DA_CHAVE
```

Estes ficheiros **não** devem ir para o Git (já estão no `.gitignore`).

---

## 5. Versão da app

Em `android/app/build.gradle`:

| Campo | Valor actual | Regra |
|-------|--------------|-------|
| `versionCode` | `1` | Inteiro — **incrementar** a cada upload na Play Store |
| `versionName` | `1.0.0` | Texto visível ao utilizador (ex.: `1.0.1`) |

---

## 6. Gerar AAB (Android App Bundle)

### Opção A — Script automático

```powershell
cd C:\experiencia\projetos\sistema-legal
.\scripts\build-release.ps1
```

Saída: `android\app\build\outputs\bundle\release\app-release.aab`

### Opção B — Manual

```powershell
cd C:\experiencia\projetos\sistema-legal
npm run cap:sync

$env:JAVA_HOME = "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
cd android
.\gradlew.bat bundleRelease
```

---

## 7. Checklist Play Console

### Conta e app

- [ ] Criar app na Play Console (nome: **Sistema Legal**)
- [ ] `applicationId`: `com.sistemalegal.app` (deve coincidir com `build.gradle`)
- [ ] Categoria sugerida: **Produtividade** ou **Empresas**
- [ ] Upload do `.aab` em **Produção** ou **Teste interno**

### Listagem da loja

- [ ] Título (máx. 30 caracteres): Sistema Legal
- [ ] Descrição curta e completa (PT)
- [ ] Ícone 512×512 (exportar de `resources/icon-only.png` ou logo original)
- [ ] Capturas de ecrã (telefone, mín. 2)
- [ ] Gráfico de funcionalidades 1024×500 (opcional mas recomendado)

### Conformidade

- [ ] **Política de privacidade** — URL pública obrigatória se a app recolhe dados (login Firebase, dados de clientes). Publique uma página (ex.: no site GitHub Pages / Netlify) e indique o URL na Play Console.
- [ ] Questionário de segurança de dados (tipo de dados recolhidos, encriptação, etc.)
- [ ] Classificação de conteúdo (questionário IARC)
- [ ] Público-alvo e conformidade com políticas para crianças (se aplicável)

### Técnico

- [ ] Target API level conforme exigência actual da Google (projecto: API 36)
- [ ] Testar login e fluxos principais num dispositivo real antes de produção
- [ ] Incrementar `versionCode` em cada novo upload

---

## 8. Notas sobre privacidade

A app utiliza autenticação e armazenamento de dados jurídicos. Na Play Console, declare:

- Dados de conta (e-mail / credenciais)
- Dados de clientes/processos inseridos pelo utilizador
- Ligação a backend/API (se aplicável)

Prepare uma **Política de Privacidade** em português que explique: que dados são recolhidos, finalidade, retenção, contacto do responsável (solicitadoria) e direitos do titular (RGPD).

---

## 9. Comandos rápidos (resumo)

```powershell
# Novo ícone + sync + reinstalar
npm run icons:android
npm run cap:sync
# Android Studio: Run no dispositivo

# AAB assinado para Play Store
.\scripts\build-release.ps1
```

---

## 10. Ficheiros relevantes

| Ficheiro | Função |
|----------|--------|
| `resources/icon-only.png` | Fonte do ícone (1024×1024) |
| `android/app/build.gradle` | versionCode, versionName, signing |
| `android/release-signing.properties` | Credenciais locais (não commitar) |
| `scripts/build-release.ps1` | Build automatizado do AAB |
