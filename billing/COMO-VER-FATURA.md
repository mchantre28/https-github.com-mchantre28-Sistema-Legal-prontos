# Como ver a fatura em PDF

## Passo a passo

### 1. Abrir a pasta do projeto

No Cursor, Explorer ou Explorador de Ficheiros, vai a:
```
c:\experiencia
```

### 2. Instalar dependências (só na primeira vez)

No terminal, escreve e carrega Enter:
```
npm install
```
Espera terminar. Isto instala tudo o que é preciso (tsx, puppeteer, etc.).

### 3. Abrir o Terminal

- No Cursor: menu **Terminal** → **Novo Terminal**
- Ou: `Ctrl + ù` (Ctrl + backtick)

### 4. Correr o comando

Escreve e carrega Enter:
```
npm run billing:example
```

**Nota:** Na primeira vez pode demorar mais (o Puppeteer descarrega o Chrome). Espera até aparecer "Fatura gerada".

### 5. Onde está o PDF?

Depois de correr, o ficheiro PDF fica em:
```
c:\experiencia\billing\exemplo-fatura.pdf
```

Abre esse ficheiro com duplo clique (abre no leitor de PDFs).

---

## Alternativa: ficheiro .bat

Podes também fazer duplo clique em:
```
c:\experiencia\billing\GERAR-FATURA-EXEMPLO.bat
```

Isso corre o exemplo e gera o PDF na mesma pasta.

---

## Se der erro

**"Cannot find module 'handlebars'"** ou **"npm error canceled"**
- Certifica-te que estás na pasta `c:\experiencia`
- Corre primeiro: `npm install`
- Depois: `npm run billing:example`

**Na primeira execução** o Puppeteer pode descarregar o Chrome (~150 MB). Espera até terminar.
