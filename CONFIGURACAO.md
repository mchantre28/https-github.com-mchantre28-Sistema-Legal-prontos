# ⚙️ Guia de Configuração Rápida

## 🔧 Configurações Necessárias

### 1. Informações de Contacto

Edite o arquivo `index.html` e localize estas linhas:

#### Email (linha ~95):
```html
<p class="contact-text">Email: <a href="mailto:contacto@anapaulamedinasolicitadora.pt">contacto@anapaulamedinasolicitadora.pt</a></p>
```

#### Telefone (linha ~99):
```html
<p class="contact-text">Telefone: <a href="tel:+351912345678">+351 912 345 678</a></p>
```

#### WhatsApp (linha ~107):
```html
<a href="https://wa.me/351912345678?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20os%20seus%20serviços"
```

**Substitua:**
- `contacto@anapaulamedinasolicitadora.pt` pelo seu email real
- `+351 912 345 678` pelo seu telefone real
- `351912345678` no link do WhatsApp pelo seu número (sem espaços, com código do país)

### 2. Imagem de Perfil

1. Coloque uma foto profissional em: `assets/images/ana-paula-profile.jpg`
2. Formato: JPG ou PNG
3. Tamanho recomendado: 300x300px ou maior (quadrado)
4. A imagem será exibida como círculo automaticamente

### 3. Textos Personalizados

Edite o arquivo `index.html` para personalizar:

- **Título principal** (linha ~30): "SERVIÇOS JURÍDICOS COM ÉTICA, RIGOR E PROXIMIDADE"
- **Descrição** (linha ~31-33): Texto sobre os serviços
- **Sobre Mim** (linha ~45-53): Texto sobre a Ana Paula

### 4. Cores (Opcional)

Se quiser mudar as cores, edite `styles.css` (linhas 4-11):

```css
:root {
    --primary-dark: #1a1a1a;      /* Fundo escuro */
    --accent-green: #25D366;      /* Verde WhatsApp */
    --text-light: #e5e5e5;        /* Texto claro */
}
```

## ✅ Checklist Rápido

- [ ] Atualizar email
- [ ] Atualizar telefone
- [ ] Atualizar número WhatsApp
- [ ] Adicionar foto de perfil
- [ ] Revisar textos
- [ ] Testar no navegador

## 🚀 Pronto para Publicar!

Após completar as configurações acima, o site está pronto para ser publicado!

