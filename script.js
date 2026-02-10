// Aguardar carregamento completo da página
document.addEventListener('DOMContentLoaded', function() {
    // Carregar imagem de perfil com fallback
    const profileImage = document.getElementById('profileImage');
    
    if (profileImage) {
        // Verificar se a imagem existe
        const img = new Image();
        img.onload = function() {
            profileImage.classList.add('loaded');
        };
        img.onerror = function() {
            // Se a imagem não existir, usar placeholder ou ocultar
            profileImage.style.display = 'none';
            console.log('Imagem de perfil não encontrada. Adicione uma imagem em assets/images/ana-paula-profile.jpg');
        };
        img.src = profileImage.src;
    }
    
    // Animação suave ao scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar elementos para animação
    const animateElements = document.querySelectorAll('.service-card, .about-content, .contact-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Adicionar efeito de hover nos cards de serviços
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
    
    // Validação de formulário (se houver formulário de contacto no futuro)
    const contactForms = document.querySelectorAll('form');
    contactForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Adicionar lógica de envio aqui
            console.log('Formulário submetido');
        });
    });
    
    // Adicionar comportamento ao botão WhatsApp
    const whatsappButton = document.querySelector('.whatsapp-button');
    if (whatsappButton) {
        whatsappButton.addEventListener('click', function(e) {
            // Tracking opcional (Google Analytics, etc.)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'whatsapp_click', {
                    'event_category': 'engagement',
                    'event_label': 'WhatsApp Button'
                });
            }
        });
    }
    
    // Smooth scroll para links internos
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Adicionar classe para modo escuro/claro (opcional)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Lazy loading para imagens
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    } else {
        // Fallback para navegadores que não suportam lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }
    
    console.log('Site da Solicitadora Ana Paula carregado com sucesso!');
});

// Função para atualizar número do WhatsApp (caso necessário)
function updateWhatsAppNumber(number) {
    const whatsappButton = document.querySelector('.whatsapp-button');
    if (whatsappButton) {
        const cleanNumber = number.replace(/\D/g, '');
        whatsappButton.href = `https://wa.me/${cleanNumber}?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20os%20seus%20serviços`;
    }
}

// Função para atualizar email de contacto
function updateContactEmail(email) {
    const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
    emailLinks.forEach(link => {
        link.href = `mailto:${email}`;
        link.textContent = email;
    });
}

// Função para atualizar telefone de contacto
function updateContactPhone(phone) {
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.href = `tel:${phone}`;
        link.textContent = phone;
    });
}

