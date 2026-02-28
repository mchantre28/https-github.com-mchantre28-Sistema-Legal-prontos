/**
 * Módulo de branding — única fonte da logo e estilos para todos os documentos.
 * Coloque a nova logo em: assets/logo-solicitadora.png (ou .svg).
 */
(function() {
  'use strict';

  var BRANDING = {
    logoPath: 'assets/logo-solicitadora.png',
    logoPathPng: 'assets/logo-solicitadora.png',
    logoPathFallback: '../../assets/logo-solicitadora.png',
    logoWidth: 220,
    logoWidthMin: 200,
    logoWidthMax: 240,
    logoMarginBottom: 14,
    headerHeight: 110,
    headerHeightMin: 100,
    headerHeightMax: 120,
    marginMm: 25,
    lineHeight: 1.35,
    lineHeightMax: 1.5,
    fontFamily: "'Inter', 'Lato', 'Roboto', 'Segoe UI', Arial, sans-serif",
    firmName: 'ANA PAULA MEDINA',
    firmTitle: 'SOLICITADORA'
  };

  function setLogoEmpty() {
    window.LOGO_DATA_URI = '';
  }

  function getBaseUrl() {
    var base = (document.querySelector('base') && document.querySelector('base').href) || (window.location.origin + window.location.pathname);
    return base.charAt(base.length - 1) === '/' ? base : base + '/';
  }

  function blobToDataUrl(blob) {
    return new Promise(function(resolve, reject) {
      var r = new FileReader();
      r.onload = function() { resolve(r.result); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  function loadLogoFromAsset() {
    var base = getBaseUrl();
    // ana.png existe em sistema-legal/assets/; tentar primeiro para evitar 404 no GitHub Pages
    var paths = ['assets/ana.png', BRANDING.logoPathPng, 'assets/ana.svg', 'assets/logo-solicitadora.svg'];
    if (BRANDING.logoPathFallback) paths.push(BRANDING.logoPathFallback);
    var idx = 0;
    function tryNext() {
      if (idx >= paths.length) {
        // Não sobrescrever: logo-data.js pode já ter definido LOGO_DATA_URI (evita texto no .bat)
        return Promise.resolve(false);
      }
      var url = base + paths[idx] + '?v=' + (typeof Date.now === 'function' ? Date.now() : 1);
      idx += 1;
      return fetch(url, { cache: 'no-store' })
        .then(function(r) { return r.ok ? r.blob() : Promise.reject(new Error('404')); })
        .then(function(blob) { return blobToDataUrl(blob); })
        .then(function(dataUrl) {
          window.LOGO_DATA_URI = dataUrl;
          return true;
        })
        .catch(tryNext);
    }
    return tryNext();
  }

  setLogoEmpty();
  if (typeof window.location !== 'undefined' && window.location.protocol === 'file:') {
    // Abrir por file://: fetch dá CORS. A logo vem do logo-data.js (carregado a seguir).
  } else {
    loadLogoFromAsset().then(function(ok) {
      if (!ok && (!window.LOGO_DATA_URI || !window.LOGO_DATA_URI.length) && typeof console !== 'undefined' && console.warn) {
        console.warn('Branding: coloque a logo em assets/ana.png ou assets/logo-solicitadora.png');
      }
    });
  }

  window.BRANDING = BRANDING;

  /** Estilos base para todos os documentos: margens 25mm, fontes profissionais, sem sombras/bordas decorativas. */
  BRANDING.documentStyles = [
    'html,body{font-family:' + BRANDING.fontFamily + ';font-size:11px;color:#1a1a1a;margin:0;padding:25mm;background:#fff;line-height:' + BRANDING.lineHeight + '}',
    '.doc-container{max-width:210mm;margin:0 auto;background:#fff}',
    '.branding-header{height:' + BRANDING.headerHeight + 'px;min-height:' + BRANDING.headerHeight + 'px;display:flex;align-items:flex-end;padding-bottom:10px;margin-bottom:20px;border-bottom:2px solid #1a1a1a;box-sizing:border-box}',
    '.branding-header-left{flex-shrink:0}',
    '.branding-logo{width:' + BRANDING.logoWidth + 'px;height:auto;max-width:' + BRANDING.logoWidth + 'px;min-width:' + BRANDING.logoWidth + 'px;flex-shrink:0;display:block;object-fit:contain;image-rendering:-webkit-optimize-contrast;image-rendering:crisp-edges;margin-bottom:' + BRANDING.logoMarginBottom + 'px}',
    '.branding-logo-placeholder{width:' + BRANDING.logoWidth + 'px;min-height:60px;display:flex;align-items:center;justify-content:flex-start;font-size:18px;font-weight:700;color:#1a1a1a;line-height:1.3}',
    '.branding-logo-placeholder span{font-size:11px;font-weight:500;letter-spacing:.15em;color:#444}'
  ].join('\n');

  /** Retorna apenas o fragmento da logo (img ou placeholder) para inserir em .header-left. */
  window.getBrandedLogoHTML = function(logoDataUri) {
    var uri = logoDataUri || window.LOGO_DATA_URI;
    var name = BRANDING.firmName;
    var title = BRANDING.firmTitle;
    var placeholder = '<div class="branding-logo-placeholder">' + name + '<br/><span>' + title + '</span></div>';
    return uri
      ? '<img src="' + uri.replace(/"/g, '&quot;') + '" class="branding-logo" alt="' + name + ' - ' + title + '" loading="eager" decoding="sync" style="width:220px;height:auto;display:block;object-fit:contain;image-rendering:-webkit-optimize-contrast;image-rendering:crisp-edges"/>'
      : placeholder;
  };

  /**
   * Retorna o HTML do header com logo para injetar em documentos.
   * Única forma permitida de exibir a logo em documentos — nenhum template deve conter logo embutida.
   */
  window.getBrandedHeaderHTML = function(logoDataUri) {
    var img = window.getBrandedLogoHTML ? window.getBrandedLogoHTML(logoDataUri) : '';
    return '<div class="branding-header"><div class="branding-header-left">' + img + '</div></div>';
  };

  /** Garante que o documento usa apenas o branding do módulo: remove logos embutidas em HTML e injeta o header oficial. */
  window.applyBrandingToDocument = function(html, injectHeaderAfter) {
    if (!html || typeof html !== 'string') return html;
    var openBody = injectHeaderAfter || '<body';
    var idx = html.indexOf(openBody);
    if (idx === -1) return html;
    var header = window.getBrandedHeaderHTML();
    var before = html.substring(0, idx + openBody.length);
    var after = html.substring(idx + openBody.length);
    var bodyContentStart = after.indexOf('>') + 1;
    var inserted = after.substring(0, bodyContentStart) + header + after.substring(bodyContentStart);
    return before + inserted;
  };
})();
