# 🌐 Site Solicitadora Ana Paula

Site institucional profissional para a Solicitadora Ana Paula Medina.

## 📁 Estrutura de Arquivos

```
site-solicitadora/
├── index.html              # Página principal
├── styles.css              # Estilos do site
├── script.js               # JavaScript e interatividade
├── README.md               # Este arquivo
└── assets/
    └── images/
        └── ana-paula-profile.jpg  # Foto de perfil (adicionar)
```

## 🚀 Como Usar

### 1. Preparação

1. **Adicionar imagem de perfil:**
   - Coloque uma foto profissional em `assets/images/ana-paula-profile.jpg`
   - Formato recomendado: JPG ou PNG
   - Tamanho recomendado: 300x300px (será exibida como círculo)
   - Se não adicionar a imagem, ela será ocultada automaticamente

### 2. Personalização

#### Atualizar Informações de Contacto

Edite o arquivo `index.html` e atualize:

- **Email:** Procure por `contacto@anapaulamedinasolicitadora.pt` e substitua
- **Telefone:** Procure por `+351 912 345 678` e substitua
- **WhatsApp:** Atualize o número no link do botão WhatsApp

Ou use as funções JavaScript em `script.js`:
```javascript
updateWhatsAppNumber('+351912345678');
updateContactEmail('seu-email@exemplo.pt');
updateContactPhone('+351912345678');
```

#### Personalizar Cores

Edite as variáveis CSS em `styles.css`:
```css
:root {
    --primary-dark: #1a1a1a;      /* Cor de fundo escura */
    --accent-green: #25D366;      /* Cor verde (WhatsApp) */
    --text-light: #e5e5e5;        /* Cor do texto claro */
}
```

### 3. Testar Localmente

1. Abra o arquivo `index.html` no navegador
2. Ou use um servidor local:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js (com http-server)
   npx http-server
   ```

### 4. Publicar

#### Opção 1: GitHub Pages
1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Ative GitHub Pages nas configurações do repositório
4. Seu site estará disponível em `https://seu-usuario.github.io/repositorio/`

#### Opção 2: Netlify
1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta `site-solicitadora` para a área de deploy
3. Seu site estará online em segundos

#### Opção 3: Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Configure o diretório como `site-solicitadora`
4. Deploy automático

## 📱 Recursos Incluídos

- ✅ Design responsivo (mobile, tablet, desktop)
- ✅ Seção Hero com logo
- ✅ Seção "Sobre Mim"
- ✅ Seção de Serviços
- ✅ Seção de Contacto
- ✅ Botão flutuante do WhatsApp
- ✅ Animações suaves
- ✅ Otimizado para SEO
- ✅ Acessibilidade

## 🎨 Personalização Avançada

### Adicionar Mais Seções

1. Adicione o HTML em `index.html`
2. Adicione os estilos em `styles.css`
3. Adicione interatividade em `script.js` (se necessário)

### Adicionar Formulário de Contacto

1. Crie um serviço de backend (ex: Formspree, Netlify Forms)
2. Adicione o formulário HTML na seção de contacto
3. Configure o endpoint de envio

### Adicionar Google Analytics

Adicione antes do `</head>` em `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 📝 Checklist Antes de Publicar

- [ ] Adicionar imagem de perfil em `assets/images/ana-paula-profile.jpg`
- [ ] Atualizar email de contacto
- [ ] Atualizar número de telefone
- [ ] Atualizar número do WhatsApp
- [ ] Revisar textos e informações
- [ ] Testar em diferentes navegadores
- [ ] Testar em dispositivos móveis
- [ ] Verificar links e botões
- [ ] Otimizar imagens (se houver)
- [ ] Configurar domínio personalizado (opcional)

## 🐛 Solução de Problemas

### Imagem não aparece
- Verifique se o arquivo está em `assets/images/ana-paula-profile.jpg`
- Verifique o nome do arquivo (case-sensitive)
- Verifique a extensão do arquivo (.jpg ou .png)

### Botão WhatsApp não funciona
- Verifique se o número está no formato correto (sem espaços, com código do país)
- Exemplo: `+351912345678` (não `+351 912 345 678`)

### Estilos não carregam
- Verifique se o arquivo `styles.css` está na mesma pasta que `index.html`
- Verifique o caminho no `<link>` do HTML

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Console do navegador (F12) para erros
2. Este README
3. Código comentado nos arquivos

## 📄 Licença

Este projeto foi criado para uso da Solicitadora Ana Paula Medina.

---

**Desenvolvido com ❤️ para serviços jurídicos de excelência**

