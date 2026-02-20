# 🛡️ Guia de Trabalho Seguro - Sistema Legal

## ⚠️ IMPORTANTE: Como NÃO Misturar Projetos

### ✅ FAÇA:
1. **SEMPRE trabalhar dentro de `projetos/sistema-legal/`**
2. **Usar o script `trabalhar-aqui.ps1`** antes de começar
3. **Fazer commits específicos** apenas deste projeto
4. **Verificar antes de fazer commit** se não editou outros projetos

### ❌ NÃO FAÇA:
1. **NUNCA editar arquivos na raiz** (`C:\experiencia\`)
2. **NÃO fazer `git add .` sem verificar** o que está adicionando
3. **NÃO misturar commits** de diferentes projetos
4. **NÃO trabalhar em múltiplos projetos** ao mesmo tempo

## 📋 Checklist Diário

### Antes de Começar:
- [ ] Execute `.\trabalhar-aqui.ps1`
- [ ] Verifique que está na pasta correta
- [ ] Verifique `git status` para ver o que mudou

### Durante o Trabalho:
- [ ] Todos os arquivos editados estão em `projetos/sistema-legal/`
- [ ] Não modifiquei arquivos de outros projetos

### Antes de Fazer Commit:
- [ ] `git status` mostra apenas arquivos do sistema-legal
- [ ] Testei as mudanças localmente
- [ ] Mensagem de commit menciona "Sistema Legal"

## 🔧 Comandos Seguros

### Verificar o que será commitado:
```powershell
git status
git diff projetos/sistema-legal/
```

### Fazer commit apenas deste projeto:
```powershell
# Adicionar apenas arquivos do sistema-legal
git add projetos/sistema-legal/

# Fazer commit com mensagem descritiva
git commit -m "Sistema Legal: [descrição da mudança]"
```

### Ver histórico de commits do sistema-legal:
```powershell
git log --oneline -- projetos/sistema-legal/
```

## 🚨 Se Acidentalmente Misturar

### Situação: Commitou arquivos de outros projetos

1. **Desfazer o último commit** (mantendo mudanças):
   ```powershell
   git reset --soft HEAD~1
   ```

2. **Remover arquivos de outros projetos**:
   ```powershell
   git reset HEAD projetos/loja-variada/
   git reset HEAD projetos/solicitadora/
   ```

3. **Adicionar apenas sistema-legal**:
   ```powershell
   git add projetos/sistema-legal/
   ```

4. **Fazer commit novamente**:
   ```powershell
   git commit -m "Sistema Legal: [descrição]"
   ```

## 📁 Estrutura de Trabalho Recomendada

```
projetos/
└── sistema-legal/          ← TRABALHE AQUI
    ├── index_clean.html    ← Arquivo principal
    ├── README.md
    ├── GUIA-TRABALHO-SEGURO.md
    └── trabalhar-aqui.ps1
```

## 🎯 Exemplo de Fluxo de Trabalho Seguro

```powershell
# 1. Iniciar trabalho
cd projetos\sistema-legal
.\trabalhar-aqui.ps1

# 2. Abrir arquivo
code index_clean.html

# 3. Fazer alterações...

# 4. Verificar mudanças
git status

# 5. Ver diferenças
git diff index_clean.html

# 6. Fazer commit seguro
git add index_clean.html
git commit -m "Sistema Legal: Corrigido fecharModalRobusto()"

# 7. Verificar commit
git log -1
```

## 🔍 Verificação Final

Antes de fazer push, verifique:
```powershell
# Ver todos os commits que serão enviados
git log origin/main..HEAD --oneline

# Ver arquivos que serão enviados
git diff --name-only origin/main..HEAD
```

