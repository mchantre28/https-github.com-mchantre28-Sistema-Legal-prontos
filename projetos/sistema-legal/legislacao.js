/**
 * Legislação — módulo isolado.
 * Fontes oficiais e alertas locais. Não altera coleções Firestore.
 */
(function (global) {
    'use strict';

    var CHAVE_ALERTAS = 'legislacaoAlertasLocais';
    var CHAVE_AREA = 'legislacaoAreaFiltro';
    var CHAVE_VERIFICACAO = 'legislacaoUltimaVerificacaoLocal';
    var CHAVE_AVISADOS = 'legislacaoAlertasAvisados';
    var JSON_MONITORIZACAO = 'legislacao-atualizacoes.json';

    var AREAS = [
        { id: 'todas', nome: 'Todas' },
        { id: 'nacionalidade', nome: 'Nacionalidade' },
        { id: 'herancas', nome: 'Heranças' },
        { id: 'registos', nome: 'Registos' },
        { id: 'migracao', nome: 'Migração' },
        { id: 'justica', nome: 'Justiça' },
        { id: 'profissional', nome: 'Estatuto profissional' }
    ];

    var FONTES = [
        { nome: 'Diário da República', desc: 'Texto oficial dos atos publicados', url: 'https://diariodarepublica.pt/dr/home' },
        { nome: 'Pesquisa DRE', desc: 'Pesquisa por diploma, número ou palavra', url: 'https://diariodarepublica.pt/dr/pesquisa' },
        { nome: 'Legislação consolidada', desc: 'Leitura atualizada (sem valor legal)', url: 'https://diariodarepublica.pt/dr/legislacao-consolidada' },
        { nome: 'PGE', desc: 'Texto articulado para consulta', url: 'https://www.pgdlisboa.pt/' },
        { nome: 'IRN', desc: 'Nacionalidade, heranças e conservatórias', url: 'https://irn.justica.gov.pt/' },
        { nome: 'AIMA', desc: 'Migração, asilo e estrangeiros', url: 'https://aima.gov.pt/' },
        { nome: 'ePortugal', desc: 'Serviços públicos e procedimentos', url: 'https://eportugal.gov.pt/' },
        { nome: 'OSAE', desc: 'Ordem dos Solicitadores e Agentes de Execução', url: 'https://www.osae.pt/' }
    ];

    var DIPLOMAS = [
        { area: 'nacionalidade', diploma: 'Lei n.º 37/81', titulo: 'Lei da Nacionalidade', pesquisa: 'Lei 37/81 nacionalidade' },
        { area: 'nacionalidade', diploma: 'Decreto-Lei n.º 237-A/2006', titulo: 'Regulamento da Nacionalidade Portuguesa', pesquisa: 'Decreto-Lei 237-A/2006 nacionalidade' },
        { area: 'herancas', diploma: 'Código Civil', titulo: 'Direito das Sucessões (Livro V)', pesquisa: 'Código Civil sucessões' },
        { area: 'herancas', diploma: 'IRN — Balcão de Heranças', titulo: 'Procedimentos de habilitação e partilha', pesquisa: 'Balcão das Heranças IRN', url: 'https://irn.justica.gov.pt/' },
        { area: 'registos', diploma: 'Decreto-Lei n.º 131/95', titulo: 'Código do Registo Civil', pesquisa: 'Código do Registo Civil Decreto-Lei 131/95' },
        { area: 'registos', diploma: 'Decreto-Lei n.º 224/84', titulo: 'Código do Registo Predial', pesquisa: 'Código do Registo Predial Decreto-Lei 224/84' },
        { area: 'registos', diploma: 'Decreto-Lei n.º 403/86', titulo: 'Código do Registo Comercial', pesquisa: 'Código do Registo Comercial Decreto-Lei 403/86' },
        { area: 'registos', diploma: 'Lei n.º 89/2017', titulo: 'RCBE — Beneficiário Efetivo', pesquisa: 'Lei 89/2017 RCBE' },
        { area: 'registos', diploma: 'Código do Notariado', titulo: 'Atos notariais e procurações', pesquisa: 'Código do Notariado' },
        { area: 'migracao', diploma: 'Lei n.º 23/2007', titulo: 'Entrada, permanência, saída e afastamento de estrangeiros', pesquisa: 'Lei 23/2007 estrangeiros' },
        { area: 'migracao', diploma: 'AIMA', titulo: 'Procedimentos de migração e asilo', pesquisa: 'AIMA migração', url: 'https://aima.gov.pt/' },
        { area: 'justica', diploma: 'Código de Processo Civil', titulo: 'Processo executivo', pesquisa: 'Código de Processo Civil execução' },
        { area: 'profissional', diploma: 'Estatuto da OSAE', titulo: 'Solicitadores e agentes de execução', pesquisa: 'Estatuto Ordem dos Solicitadores', url: 'https://www.osae.pt/' },
        { area: 'profissional', diploma: 'Lei n.º 58/2019', titulo: 'Proteção de dados pessoais', pesquisa: 'Lei 58/2019 proteção de dados' }
    ];

    function drePesquisa(query) {
        return 'https://diariodarepublica.pt/dr/pesquisa?query=' + encodeURIComponent(query || '');
    }

    function areaNome(id) {
        var area = AREAS.find(function (a) { return a.id === id; });
        return area ? area.nome : id;
    }

    function armazenamento() {
        if (typeof appStorage !== 'undefined' && appStorage) return appStorage;
        try { return global.localStorage; } catch (e) { return null; }
    }

    function obterAreaFiltro() {
        try {
            var store = armazenamento();
            return (store && store.getItem(CHAVE_AREA)) || 'todas';
        } catch (e) {
            return 'todas';
        }
    }

    function obterAlertasLocais() {
        try {
            var store = armazenamento();
            var raw = store ? store.getItem(CHAVE_ALERTAS) : null;
            var lista = raw ? JSON.parse(raw) : [];
            return Array.isArray(lista) ? lista : [];
        } catch (e) {
            return [];
        }
    }

    function guardarAlertasLocais(lista) {
        var store = armazenamento();
        if (store) store.setItem(CHAVE_ALERTAS, JSON.stringify(lista));
    }

    function formatarDataIso(iso) {
        if (!iso) return 'Ainda não registada';
        var d = new Date(iso);
        if (Number.isNaN(d.getTime())) return 'Ainda não registada';
        return d.toLocaleString('pt-PT');
    }

    function linkExterno(url, texto) {
        var href = escaparHtml(url);
        var label = escaparHtml(texto || 'Abrir fonte');
        return '<a href="' + href + '" target="_blank" rel="noopener noreferrer" class="sl-leg-link">' + label + '</a>';
    }

    function chipArea(area) {
        var atual = obterAreaFiltro();
        var ativo = atual === area.id ? ' is-active' : '';
        return '<button type="button" class="sl-leg-chip' + ativo + '" data-area="' + escaparHtml(area.id) + '" onclick="filtrarLegislacaoArea(\'' + area.id + '\')">' + escaparHtml(area.nome) + '</button>';
    }

    function diplomasFiltrados() {
        var area = obterAreaFiltro();
        if (area === 'todas') return DIPLOMAS;
        return DIPLOMAS.filter(function (d) { return d.area === area; });
    }

    function renderDiploma(item) {
        var url = item.url || drePesquisa(item.pesquisa);
        return (
            '<article class="sl-leg-diploma">' +
                '<p class="sl-leg-kicker">' + escaparHtml(areaNome(item.area)) + '</p>' +
                '<h4>' + escaparHtml(item.titulo) + '</h4>' +
                '<p class="sl-leg-meta">' + escaparHtml(item.diploma) + '</p>' +
                '<p class="mt-3">' + linkExterno(url, 'Consultar fonte oficial') + '</p>' +
            '</article>'
        );
    }

    function renderFonte(fonte) {
        return (
            '<article class="sl-leg-fonte">' +
                '<h4>' + escaparHtml(fonte.nome) + '</h4>' +
                '<p>' + escaparHtml(fonte.desc) + '</p>' +
                '<p class="mt-3">' + linkExterno(fonte.url, 'Abrir') + '</p>' +
            '</article>'
        );
    }

    function renderAlerta(item, origem) {
        var remover = origem === 'local'
            ? '<button type="button" class="btn btn-secondary sl-leg-btn-rem" onclick="removerAlertaLegislacao(\'' + escaparHtml(item.id) + '\')">Remover</button>'
            : '';
        return (
            '<article class="sl-leg-alerta">' +
                '<div class="sl-leg-alerta-topo">' +
                    '<p class="sl-leg-kicker">' + escaparHtml(areaNome(item.area) || 'Geral') + '</p>' +
                    (item.dataPublicacao ? '<time>' + escaparHtml(item.dataPublicacao) + '</time>' : '') +
                '</div>' +
                '<h4>' + escaparHtml(item.titulo || 'Atualização') + '</h4>' +
                (item.diploma ? '<p class="sl-leg-meta">' + escaparHtml(item.diploma) + '</p>' : '') +
                (item.resumo || item.nota ? '<p>' + escaparHtml(item.resumo || item.nota) + '</p>' : '') +
                (item.impacto ? '<p class="sl-leg-meta">' + escaparHtml(item.impacto) + '</p>' : '') +
                '<div class="sl-leg-alerta-acoes">' +
                    (item.url ? linkExterno(item.url, 'Fonte oficial') : '') +
                    remover +
                '</div>' +
            '</article>'
        );
    }

    function obterMonitorizacaoCache() {
        return global.__legislacaoMonitorizacao || { atualizacoes: [], ultimaVerificacao: null };
    }

    function gerarLegislacao() {
        var area = obterAreaFiltro();
        var locais = obterAlertasLocais();
        if (area !== 'todas') {
            locais = locais.filter(function (a) { return a.area === area; });
        }
        var monitor = obterMonitorizacaoCache();
        var remotas = Array.isArray(monitor.atualizacoes) ? monitor.atualizacoes : [];
        if (area !== 'todas') {
            remotas = remotas.filter(function (a) { return a.area === area; });
        }
        var verificacaoJson = monitor.ultimaVerificacao;
        var verificacaoLocal = null;
        try {
            var storeVer = armazenamento();
            verificacaoLocal = storeVer ? storeVer.getItem(CHAVE_VERIFICACAO) : null;
        } catch (e) {}
        var ultima = verificacaoJson || verificacaoLocal;

        var htmlAlertas = remotas.length || locais.length
            ? remotas.map(function (a) { return renderAlerta(a, 'json'); }).join('') +
              locais.map(function (a) { return renderAlerta(a, 'local'); }).join('')
            : '<p class="text-sm text-gray-600">Sem atos relevantes nesta área desde a última verificação automática. Quando o DRE publicar legislação da solicitadoria, aparece aqui.</p>';

        return (
            '<div class="space-y-6 sl-leg">' +
                '<div class="card p-6">' +
                    '<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">' +
                        '<div>' +
                            '<h3 class="text-lg font-semibold text-gray-900">Acompanhamento legislativo</h3>' +
                            '<p class="text-sm text-gray-600 mt-1">A verificação do Diário da República é automática. Não é necessário qualquer passo manual. O texto vigente confirma-se na fonte oficial.</p>' +
                            '<p class="text-sm text-gray-500 mt-2">Última verificação automática: <strong>' + escaparHtml(formatarDataIso(ultima)) + '</strong></p>' +
                        '</div>' +
                        '<div class="flex flex-wrap gap-2">' +
                            '<a class="btn btn-primary" href="https://diariodarepublica.pt/dr/home" target="_blank" rel="noopener noreferrer">DRE de hoje</a>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="card p-6">' +
                    '<h3 class="text-lg font-semibold mb-4">Fontes oficiais</h3>' +
                    '<div class="sl-leg-grid">' + FONTES.map(renderFonte).join('') + '</div>' +
                '</div>' +
                '<div class="card p-6">' +
                    '<h3 class="text-lg font-semibold mb-4">Áreas da solicitadoria</h3>' +
                    '<div class="sl-leg-chips" role="tablist" aria-label="Filtrar por área">' + AREAS.map(chipArea).join('') + '</div>' +
                    '<div class="sl-leg-grid mt-6">' + diplomasFiltrados().map(renderDiploma).join('') + '</div>' +
                '</div>' +
                '<div class="card p-6">' +
                    '<h3 class="text-lg font-semibold mb-2">Alertas de atualização</h3>' +
                    '<p class="text-sm text-gray-600 mb-4">Atualizações detetadas automaticamente no Diário da República. Opcionalmente pode acrescentar uma nota local neste computador.</p>' +
                    '<div id="legislacaoAlertasLista" class="space-y-3">' + htmlAlertas + '</div>' +
                '</div>' +
                '<div class="card p-6">' +
                    '<h3 class="text-lg font-semibold mb-4">Registar nota local</h3>' +
                    '<form id="formAlertaLegislacao" class="space-y-4" onsubmit="guardarAlertaLegislacao(event)">' +
                        '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
                            '<label class="block text-sm font-medium text-gray-700">Área' +
                                '<select id="alertaLegArea" class="form-control mt-1" required>' +
                                    AREAS.filter(function (a) { return a.id !== 'todas'; }).map(function (a) {
                                        return '<option value="' + a.id + '">' + escaparHtml(a.nome) + '</option>';
                                    }).join('') +
                                '</select>' +
                            '</label>' +
                            '<label class="block text-sm font-medium text-gray-700">Diploma' +
                                '<input id="alertaLegDiploma" class="form-control mt-1" maxlength="160" placeholder="Ex.: Lei n.º 37/81">' +
                            '</label>' +
                        '</div>' +
                        '<label class="block text-sm font-medium text-gray-700">Título' +
                            '<input id="alertaLegTitulo" class="form-control mt-1" required maxlength="180" placeholder="Ex.: Alteração ao Regulamento da Nacionalidade">' +
                        '</label>' +
                        '<label class="block text-sm font-medium text-gray-700">URL oficial (opcional)' +
                            '<input id="alertaLegUrl" class="form-control mt-1" type="url" maxlength="500" placeholder="https://diariodarepublica.pt/...">' +
                        '</label>' +
                        '<label class="block text-sm font-medium text-gray-700">Nota' +
                            '<textarea id="alertaLegNota" class="form-control mt-1" rows="3" maxlength="800" placeholder="Impacto no processo ou no documento."></textarea>' +
                        '</label>' +
                        '<button type="submit" class="btn btn-primary">Guardar nota</button>' +
                    '</form>' +
                '</div>' +
            '</div>'
        );
    }

    function filtrarLegislacaoArea(area) {
        var store = armazenamento();
        if (store) store.setItem(CHAVE_AREA, area || 'todas');
        if (typeof carregarSecao === 'function') carregarSecao('legislacao');
    }

    function guardarAlertaLegislacao(event) {
        if (event) event.preventDefault();
        var titulo = (document.getElementById('alertaLegTitulo') || {}).value || '';
        titulo = titulo.trim();
        if (!titulo) {
            if (typeof mostrarNotificacao === 'function') mostrarNotificacao('Indique o título da nota.', 'warning');
            return false;
        }
        var lista = obterAlertasLocais();
        lista.unshift({
            id: 'leg-' + Date.now(),
            area: (document.getElementById('alertaLegArea') || {}).value || 'nacionalidade',
            diploma: ((document.getElementById('alertaLegDiploma') || {}).value || '').trim(),
            titulo: titulo,
            url: ((document.getElementById('alertaLegUrl') || {}).value || '').trim(),
            nota: ((document.getElementById('alertaLegNota') || {}).value || '').trim(),
            dataPublicacao: new Date().toISOString().slice(0, 10)
        });
        guardarAlertasLocais(lista);
        if (typeof mostrarNotificacao === 'function') mostrarNotificacao('Nota legislativa registada.', 'success');
        if (typeof carregarSecao === 'function') carregarSecao('legislacao');
        return false;
    }

    function removerAlertaLegislacao(id) {
        var lista = obterAlertasLocais().filter(function (a) { return a.id !== id; });
        guardarAlertasLocais(lista);
        if (typeof carregarSecao === 'function') carregarSecao('legislacao');
    }

    function marcarVerificacaoLegislacao() {
        var iso = new Date().toISOString();
        var store = armazenamento();
        if (store) store.setItem(CHAVE_VERIFICACAO, iso);
        if (typeof mostrarNotificacao === 'function') mostrarNotificacao('Verificação registada.', 'success');
        if (typeof carregarSecao === 'function') carregarSecao('legislacao');
    }

    function idsMonitorizacao(dados) {
        return ((dados && dados.atualizacoes) || []).map(function (a) { return a.id || a.url; }).filter(Boolean);
    }

    function obterListaChave(chave) {
        try {
            var store = armazenamento();
            var raw = store ? store.getItem(chave) : null;
            var lista = raw ? JSON.parse(raw) : [];
            return Array.isArray(lista) ? lista : [];
        } catch (e) {
            return [];
        }
    }

    function guardarListaChave(chave, lista) {
        var store = armazenamento();
        if (store) store.setItem(chave, JSON.stringify(lista.slice(0, 200)));
    }

    function obterVistos() {
        return obterListaChave(CHAVE_VISTOS);
    }

    function guardarVistos(lista) {
        guardarListaChave(CHAVE_VISTOS, lista);
    }

    function atualizarBadgeLegislacao(dados) {
        var fonte = dados || obterMonitorizacaoCache();
        var ids = idsMonitorizacao(fonte);
        var vistos = obterVistos();
        var novos = ids.filter(function (id) { return vistos.indexOf(id) === -1; }).length;
        var badge = document.getElementById('badgeLegislacao');
        if (!badge) return novos;
        if (novos > 0) {
            badge.textContent = String(novos);
            badge.classList.remove('hidden');
        } else {
            badge.textContent = '0';
            badge.classList.add('hidden');
        }
        return novos;
    }

    function avisarNovosAtos(dados) {
        var ids = idsMonitorizacao(dados);
        var avisados = obterListaChave(CHAVE_AVISADOS);
        var novos = ids.filter(function (id) { return avisados.indexOf(id) === -1; });
        if (!novos.length) return;
        if (typeof mostrarNotificacao === 'function') {
            var n = novos.length;
            mostrarNotificacao(
                n === 1
                    ? 'Foi publicado um ato relevante no Diário da República.'
                    : 'Foram publicados ' + n + ' atos relevantes no Diário da República.',
                'info'
            );
        }
        guardarListaChave(CHAVE_AVISADOS, avisados.concat(novos));
    }

    function comTimeout(promessa, ms) {
        return Promise.race([
            promessa,
            new Promise(function (_, reject) {
                setTimeout(function () { reject(new Error('timeout')); }, ms);
            })
        ]);
    }

    function carregarLegislacaoMonitorizacao() {
        var api = global.SistemaLegalAPI;
        var viaApi = (api && typeof api.getLegislacaoAtualizacoes === 'function')
            ? comTimeout(api.getLegislacaoAtualizacoes(), 2500)
            : Promise.reject();
        return viaApi
            .catch(function () {
                return fetch(JSON_MONITORIZACAO + '?t=' + Date.now(), { cache: 'no-store' })
                    .then(function (res) { return res.ok ? res.json() : { atualizacoes: [] }; });
            })
            .then(function (dados) {
                global.__legislacaoMonitorizacao = dados && typeof dados === 'object' ? dados : { atualizacoes: [] };
                atualizarBadgeLegislacao(global.__legislacaoMonitorizacao);
                avisarNovosAtos(global.__legislacaoMonitorizacao);
                return global.__legislacaoMonitorizacao;
            })
            .catch(function () {
                global.__legislacaoMonitorizacao = { atualizacoes: [] };
                atualizarBadgeLegislacao(global.__legislacaoMonitorizacao);
                return global.__legislacaoMonitorizacao;
            });
    }

    function inicializarLegislacao() {
        carregarLegislacaoMonitorizacao().then(function (dados) {
            guardarVistos(idsMonitorizacao(dados));
            atualizarBadgeLegislacao(dados);
            var el = document.getElementById('conteudoDinamico');
            if (!el || typeof secaoAtiva !== 'string' || secaoAtiva !== 'legislacao') return;
            el.innerHTML = gerarLegislacao();
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        });
    }

    global.gerarLegislacao = gerarLegislacao;
    global.filtrarLegislacaoArea = filtrarLegislacaoArea;
    global.guardarAlertaLegislacao = guardarAlertaLegislacao;
    global.removerAlertaLegislacao = removerAlertaLegislacao;
    global.marcarVerificacaoLegislacao = marcarVerificacaoLegislacao;
    global.carregarLegislacaoMonitorizacao = carregarLegislacaoMonitorizacao;
    global.inicializarLegislacao = inicializarLegislacao;
    global.atualizarBadgeLegislacao = atualizarBadgeLegislacao;
})(typeof window !== 'undefined' ? window : globalThis);
