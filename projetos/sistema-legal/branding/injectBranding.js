/**
 * Módulo de branding — única fonte da logo e estilos para todos os documentos.
 * Coloque a nova logo em: assets/logo-solicitadora.png (ou .svg).
 */
(function() {
  'use strict';

  var BRANDING = {
    logoPath: 'assets/logo-solicitadora.png',
    logoPathPng: 'assets/logo-solicitadora.png',
    logoPathFallback: '../../assets/ana.png',
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
    firmTitle: 'SOLICITADORA',
    solicitadoraDefaults: {
      nome: 'Dra. Ana Paula Medina',
      nif: '288 132 335',
      phone: '938057340',
      email: 'anapaulamedina09738@osae.pt',
      iban: 'PT50 0193 0000 10514937886 86',
      morada: 'Av. Aquilino Ribeiro Machado, n.º 8, 1800-399 Lisboa'
    }
  };

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtNif(nif) {
    var n = String(nif || '').replace(/\s/g, '');
    return n.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }

  function setLogoEmpty() {
    window.LOGO_DATA_URI = '';
  }

  function getBaseUrl() {
    var base = (document.querySelector('base') && document.querySelector('base').href) || (window.location.origin + window.location.pathname);
    return base.charAt(base.length - 1) === '/' ? base : base + '/';
  }

  /** URL absoluta da logo — compatível com GitHub Pages e subpastas do repo. */
  window.obterUrlLogoGithubPages = function(nomeFicheiro) {
    return getBaseUrl() + (nomeFicheiro || BRANDING.logoPathPng || 'assets/logo-solicitadora.png');
  };

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
    var paths = [BRANDING.logoPathPng, 'assets/logo-solicitadora.png', 'assets/ana.png', 'assets/logo-solicitadora.svg', 'assets/ana.svg'];
    if (BRANDING.logoPathFallback) paths.push(BRANDING.logoPathFallback);
    var idx = 0;
    function tryNext() {
      if (idx >= paths.length) {
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

  /** Estilos base para todos os documentos: margens 25mm, fontes profissionais, cabeçalho logo esq. + texto dir. */
  BRANDING.documentStyles = [
    'html,body{font-family:' + BRANDING.fontFamily + ';font-size:11px;color:#1a1a1a;margin:0;padding:25mm;background:#fff;line-height:' + BRANDING.lineHeight + '}',
    '.doc-container{max-width:210mm;margin:0 auto;background:#fff}',
    '.branding-header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;min-height:' + BRANDING.headerHeight + 'px;padding-bottom:10px;margin-bottom:20px;border-bottom:2px solid #1a1a1a;box-sizing:border-box}',
    '.branding-header-left{flex-shrink:0;text-align:left}',
    '.branding-header-right{flex:1;text-align:right;font-size:11px;line-height:1.4;min-width:0;align-self:flex-start}',
    '.branding-firm-name{font-weight:700;font-size:12pt;margin:0 0 4px 0;letter-spacing:0.02em;color:#1a1a1a}',
    '.branding-header-right p{margin:2px 0;color:#1a1a1a}',
    '.branding-logo{width:' + BRANDING.logoWidth + 'px;height:auto;max-width:' + BRANDING.logoWidth + 'px;min-width:' + BRANDING.logoWidth + 'px;flex-shrink:0;display:block;object-fit:contain;image-rendering:-webkit-optimize-contrast;image-rendering:crisp-edges;margin-bottom:' + BRANDING.logoMarginBottom + 'px}',
    '.branding-logo-placeholder{width:' + BRANDING.logoWidth + 'px;min-height:60px;display:flex;align-items:center;justify-content:flex-start;font-size:18px;font-weight:700;color:#1a1a1a;line-height:1.3}',
    '.branding-logo-placeholder span{font-size:11px;font-weight:500;letter-spacing:.15em;color:#444}',
    '.doc-body{max-width:210mm;margin:0 auto;text-align:justify}',
    '.doc-body p,.doc-body li{text-align:justify;line-height:1.65;text-justify:inter-word;-webkit-hyphens:auto;hyphens:auto}',
    '.doc-body.minuta-doc,.doc-body .minuta-doc{text-align:justify}',
    '.minuta-titulo{font-family:"Times New Roman",Times,Georgia,serif;font-size:13pt;font-weight:700;text-align:center;margin:0 0 22pt 0;letter-spacing:0.08em;text-transform:uppercase;line-height:1.4}',
    '.minuta-paragrafo{font-family:"Times New Roman",Times,Georgia,serif;font-size:12pt;margin:0 0 14pt 0;text-align:justify;text-justify:inter-word;line-height:1.5;hyphens:auto;-webkit-hyphens:auto;word-spacing:normal;letter-spacing:0.01em}',
    '.minuta-paragrafo.minuta-texto-juridico{text-indent:0;margin-bottom:16pt}',
    '.minuta-paragrafo.minuta-corpo{text-indent:1.5cm}',
    '.minuta-paragrafo.minuta-identificacao,.minuta-paragrafo.minuta-fecho,.minuta-paragrafo.minuta-assinatura{text-indent:0}',
    '.minuta-paragrafo.minuta-fecho{margin-top:20pt;margin-bottom:8pt}',
    '.minuta-paragrafo.minuta-assinatura{margin-top:8pt}',
    '.minuta-campo-branco{letter-spacing:0.04em;white-space:nowrap}',
    '.minuta-linha-assinatura{margin-top:36pt;padding-top:8pt;border-top:1px solid #000;min-height:28pt;text-align:center;font-family:"Times New Roman",Times,Georgia,serif;font-size:12pt}',
    '.minuta-paragrafo:last-child{margin-bottom:0}',
    '.minuta-paragrafo strong{font-weight:700}',
    '.minuta-rodape{margin-top:18pt;font-size:10pt;line-height:1.5;text-align:left;color:#333}',
    '.doc-body h1:not(.minuta-titulo),.doc-body h2,.doc-body h3,.doc-body .doc-report-title,.doc-body .doc-meta,.doc-body table,.doc-body .doc-table,.doc-body pre,.doc-body .doc-report-body{text-align:left}',
    '.doc-body h1.minuta-titulo{text-align:center!important}',
    '.doc-body table,.doc-body .doc-table{width:100%;border-collapse:collapse}',
    '.doc-body .doc-table th,.doc-body .doc-table td{border:1px solid #e5e7eb;padding:6px 8px;font-size:12px}',
    '.doc-body .doc-table th{background:#f3f4f6}'
  ].join('\n');

  /** Dados da solicitadora para o cabeçalho (override > DADOS_SOLICITADORA > defaults). */
  window.getDadosCabecalhoSolicitadora = function(override) {
    var o = override || {};
    var d = (typeof window.DADOS_SOLICITADORA !== 'undefined') ? window.DADOS_SOLICITADORA : {};
    var defs = BRANDING.solicitadoraDefaults;
    var nome = o.nome || d.nome || defs.nome;
    if (nome && !/^Dra\.|^Dr\./i.test(nome) && (o.titulo || d.titulo || 'Solicitadora')) {
      var tit = o.titulo || d.titulo || 'Dra.';
      if (tit && nome.indexOf(tit) !== 0) nome = tit + ' ' + nome.replace(/^(Dra\.|Dr\.)\s*/i, '');
    }
    return {
      nome: nome,
      nif: fmtNif(o.nif || d.nif || defs.nif),
      phone: o.contacto || o.phone || d.contacto || defs.phone,
      email: o.email || d.email || defs.email,
      iban: o.iban || d.iban || defs.iban,
      morada: o.sede || o.morada || d.sede || d.morada || defs.morada
    };
  };

  /** Retorna apenas o fragmento da logo (img ou placeholder) para inserir em .branding-header-left. */
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
   * Cabeçalho oficial: logo à esquerda, dados da solicitadora alinhados à direita.
   * Usar em relatórios, procurações, declarações, faturas e PDFs HTML.
   */
  window.renderCabecalhoDocumentoSolicitadora = function(dadosSolicitadora, logoDataUri) {
    var d = window.getDadosCabecalhoSolicitadora(dadosSolicitadora);
    var logo = window.getBrandedLogoHTML(logoDataUri);
    return '<header class="branding-header">' +
      '<div class="branding-header-left">' + logo + '</div>' +
      '<div class="branding-header-right">' +
        '<p class="branding-firm-name">' + escHtml(d.nome) + '</p>' +
        '<p>NIF: ' + escHtml(d.nif) + '</p>' +
        '<p>Tlm.: ' + escHtml(d.phone) + '</p>' +
        '<p>Email: ' + escHtml(d.email) + '</p>' +
        '<p>IBAN: ' + escHtml(d.iban) + '</p>' +
        '<p>Sede: ' + escHtml(d.morada) + '</p>' +
      '</div>' +
    '</header>';
  };

  /**
   * Retorna o HTML do header com logo para injetar em documentos.
   * Única forma permitida de exibir a logo em documentos — nenhum template deve conter logo embutida.
   */
  window.getBrandedHeaderHTML = function(logoDataUri, dadosSolicitadora) {
    return window.renderCabecalhoDocumentoSolicitadora(dadosSolicitadora, logoDataUri);
  };

  /** Envolve conteúdo HTML num documento completo com cabeçalho e estilos de branding. */
  window.wrapDocumentWithBrandingHeader = function(title, bodyHtml, extraStyles) {
    var styles = BRANDING.documentStyles + (extraStyles ? '\n' + extraStyles : '');
    var header = window.renderCabecalhoDocumentoSolicitadora();
    return '<!DOCTYPE html><html lang="pt-PT"><head><meta charset="utf-8"><title>' + escHtml(title) + '</title><style>' + styles + '</style></head><body class="doc-container">' + header + '<div class="doc-body">' + (bodyHtml || '') + '</div></body></html>';
  };

  /** Garante que o documento usa apenas o branding do módulo: injeta o header oficial. */
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

  window.BRANDING = BRANDING;
})();
