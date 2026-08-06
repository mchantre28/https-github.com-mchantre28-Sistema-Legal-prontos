/**
 * Sistema Legal — painel do cliente.
 */
(function () {
    'use strict';

    const ESTADO_LABELS = {
        em_tramitacao: 'Em tramitação',
        concluido: 'Concluído',
        pendente: 'Pendente',
        arquivado: 'Arquivado',
        aberto: 'Aberto'
    };

    function $(id) {
        return document.getElementById(id);
    }

    function formatarData(iso) {
        if (!iso) return '—';
        const partes = String(iso).slice(0, 10).split('-');
        if (partes.length !== 3) return iso;
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }

    function labelEstado(estado) {
        if (!estado) return '—';
        return ESTADO_LABELS[estado] || estado.replace(/_/g, ' ');
    }

    function classeEstado(estado) {
        const key = estado || 'aberto';
        return 'status-processo status-processo-' + key;
    }

    function mostrarMsgTipo(el, texto, tipo) {
        if (!el) return;
        el.textContent = texto || '';
        el.classList.remove('hidden', 'admin-msg-erro', 'admin-msg-sucesso');
        if (!texto) {
            el.classList.add('hidden');
            return;
        }
        el.classList.add(tipo === 'sucesso' ? 'admin-msg-sucesso' : 'admin-msg-erro');
    }

    function limparMsgsTrocarPassword() {
        ['trocarPasswordErro', 'trocarPasswordSucesso'].forEach(function (id) {
            const el = $(id);
            if (el) {
                el.textContent = '';
                el.classList.add('hidden');
            }
        });
    }

    function mostrarEcraTrocarPassword(user) {
        const secTrocar = $('secaoTrocarPassword');
        const secProcessos = $('secaoProcessos');
        if (secTrocar) secTrocar.classList.remove('hidden');
        if (secProcessos) secProcessos.classList.add('hidden');
        const welcome = $('welcome');
        if (welcome) {
            welcome.textContent = 'Olá, ' + (user.nome || user.email || 'Cliente') + ' — defina a sua password';
        }
    }

    function mostrarEcraProcessos(user) {
        const secTrocar = $('secaoTrocarPassword');
        const secProcessos = $('secaoProcessos');
        if (secTrocar) secTrocar.classList.add('hidden');
        if (secProcessos) secProcessos.classList.remove('hidden');
        const welcome = $('welcome');
        if (welcome) {
            welcome.textContent = 'Bem-vindo, ' + (user.nome || user.email || 'Cliente');
        }
    }

    async function submeterTrocarPassword(ev) {
        ev.preventDefault();
        limparMsgsTrocarPassword();

        const atual = $('passwordAtual').value;
        const nova = $('passwordNova').value;
        const confirmar = $('passwordConfirmar').value;

        if (!atual || !nova || !confirmar) {
            mostrarMsgTipo($('trocarPasswordErro'), 'Preencha todos os campos.', 'erro');
            return;
        }
        if (nova.length < 6) {
            mostrarMsgTipo($('trocarPasswordErro'), 'A nova password deve ter pelo menos 6 caracteres.', 'erro');
            return;
        }
        if (nova !== confirmar) {
            mostrarMsgTipo($('trocarPasswordErro'), 'A confirmação não coincide com a nova password.', 'erro');
            return;
        }

        const btn = $('btnTrocarPassword');
        if (btn) btn.disabled = true;

        try {
            const res = await SistemaLegalAPI.changePassword(atual, nova);
            const data = await res.json().catch(function () { return {}; });
            if (!res.ok) {
                throw new Error(data.erro || 'Não foi possível alterar a password.');
            }

            if (data.utilizador && SistemaLegalAPI.updateCurrentUser) {
                SistemaLegalAPI.updateCurrentUser(data.utilizador);
            } else if (SistemaLegalAPI.updateCurrentUser) {
                SistemaLegalAPI.updateCurrentUser({ must_change_password: false });
            }

            mostrarMsgTipo($('trocarPasswordSucesso'), 'Password alterada com sucesso.', 'sucesso');
            $('formTrocarPassword').reset();

            const user = SistemaLegalAPI.getCurrentUser();
            setTimeout(async function () {
                mostrarEcraProcessos(user || {});
                await carregarProcessos();
            }, 600);
        } catch (e) {
            mostrarMsgTipo($('trocarPasswordErro'), e.message || 'Erro ao alterar password.', 'erro');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function mostrarMsg(el, texto) {
        if (!el) return;
        el.textContent = texto || '';
        el.classList.toggle('hidden', !texto);
    }

    function initTema() {
        let savedTheme = null;
        try {
            savedTheme = sessionStorage.getItem('theme');
        } catch (e) { /* ignorar */ }

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        atualizarBotaoTema(dark);
    }

    function atualizarBotaoTema(isDark) {
        const btn = $('btnDarkMode');
        if (!btn) return;
        const label = btn.querySelector('span');
        const iconName = isDark ? 'sun' : 'moon';
        const texto = isDark ? 'Modo claro' : 'Modo escuro';
        if (label) {
            label.textContent = texto;
        } else {
            btn.textContent = texto;
        }
        const icon = btn.querySelector('[data-lucide]');
        if (icon) {
            icon.setAttribute('data-lucide', iconName);
        }
    }

    function toggleTema() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            try { sessionStorage.setItem('theme', 'light'); } catch (e) { /* ignorar */ }
            atualizarBotaoTema(false);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            try { sessionStorage.setItem('theme', 'dark'); } catch (e) { /* ignorar */ }
            atualizarBotaoTema(true);
        }
    }

    function ordenarTramitesPorData(tramites) {
        return (tramites || []).slice().sort(function (a, b) {
            const da = a.data_tramite || '';
            const db = b.data_tramite || '';
            if (da < db) return -1;
            if (da > db) return 1;
            return (a.id || 0) - (b.id || 0);
        });
    }

    function filtrarDocumentosVisiveis(documentos) {
        return (documentos || []).filter(function (d) {
            return d.visivel_cliente === 1 || d.visivel_cliente === true;
        });
    }

    function criarTimeline(tramites) {
        const ordenados = ordenarTramitesPorData(tramites);
        const sec = document.createElement('div');
        sec.className = 'cliente-secao';

        const titulo = document.createElement('h4');
        titulo.className = 'cliente-secao-titulo';
        const n = ordenados.length;
        if (n === 0) {
            titulo.textContent = 'Trâmites';
        } else if (n === 1) {
            titulo.textContent = 'Trâmites (1 registado)';
        } else {
            titulo.textContent = 'Trâmites (' + n + ' registados)';
        }
        sec.appendChild(titulo);

        if (!ordenados.length) {
            const vazio = document.createElement('p');
            vazio.className = 'admin-section-desc';
            vazio.style.margin = '0';
            vazio.textContent = 'Ainda não existem trâmites registados neste processo.';
            sec.appendChild(vazio);
            return sec;
        }

        const lista = document.createElement('ol');
        lista.className = 'cliente-timeline';
        lista.setAttribute('aria-label', 'Cronologia de trâmites');

        ordenados.forEach(function (t, idx) {
            const item = document.createElement('li');
            item.className = 'cliente-timeline-item';
            if (idx === ordenados.length - 1) {
                item.classList.add('cliente-timeline-item-ultimo');
            }

            const marcador = document.createElement('span');
            marcador.className = 'cliente-timeline-marcador';
            marcador.setAttribute('aria-hidden', 'true');

            const data = document.createElement('time');
            data.className = 'cliente-timeline-data';
            data.dateTime = t.data_tramite || '';
            data.textContent = formatarData(t.data_tramite);

            const conteudo = document.createElement('div');
            conteudo.className = 'cliente-timeline-conteudo';

            const tit = document.createElement('p');
            tit.className = 'cliente-timeline-titulo';
            tit.textContent = t.titulo || 'Trâmite';

            conteudo.appendChild(tit);

            if (t.descricao) {
                const desc = document.createElement('p');
                desc.className = 'cliente-timeline-desc';
                desc.textContent = t.descricao;
                conteudo.appendChild(desc);
            }

            item.appendChild(marcador);
            item.appendChild(data);
            item.appendChild(conteudo);
            lista.appendChild(item);
        });

        sec.appendChild(lista);
        return sec;
    }

    function criarListaDocumentos(documentos) {
        const visiveis = filtrarDocumentosVisiveis(documentos);
        const sec = document.createElement('div');
        sec.className = 'cliente-secao';

        const titulo = document.createElement('h4');
        titulo.className = 'cliente-secao-titulo';
        titulo.textContent = 'Documentos';
        sec.appendChild(titulo);

        if (!visiveis.length) {
            const vazio = document.createElement('p');
            vazio.className = 'admin-section-desc';
            vazio.style.margin = '0';
            vazio.textContent = 'Nenhum documento disponível.';
            sec.appendChild(vazio);
            return sec;
        }

        const lista = document.createElement('div');
        lista.className = 'cliente-docs-lista';

        visiveis.forEach(function (d) {
            const card = document.createElement('article');
            card.className = 'admin-doc-card cliente-doc-card';

            const url = SistemaLegalAPI.documentoUrl(d.url_ficheiro);
            if (url) {
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'cliente-doc-link';
                link.innerHTML = '<i data-lucide="file-text" class="w-4 h-4" aria-hidden="true"></i><span>' +
                    (d.nome_ficheiro || 'Documento') + '</span>';
                card.appendChild(link);
            } else {
                card.textContent = d.nome_ficheiro || 'Documento';
            }

            lista.appendChild(card);
        });

        sec.appendChild(lista);
        return sec;
    }

    function criarCardProcesso(processo, tramites, documentos) {
        const card = document.createElement('article');
        card.className = 'cliente-processo-card';

        const header = document.createElement('div');
        header.className = 'cliente-processo-header';

        const info = document.createElement('div');
        const titulo = document.createElement('h3');
        titulo.className = 'cliente-processo-titulo';
        titulo.textContent = processo.titulo || 'Processo';

        const meta = document.createElement('p');
        meta.className = 'cliente-processo-meta';
        meta.textContent = 'N.º ' + (processo.numero_processo || '—');

        info.appendChild(titulo);
        info.appendChild(meta);

        const badge = document.createElement('span');
        badge.className = classeEstado(processo.estado);
        badge.textContent = labelEstado(processo.estado);

        header.appendChild(info);
        header.appendChild(badge);
        card.appendChild(header);

        if (processo.descricao) {
            const desc = document.createElement('p');
            desc.className = 'cliente-processo-desc';
            desc.textContent = processo.descricao;
            card.appendChild(desc);
        }

        card.appendChild(criarTimeline(tramites));
        card.appendChild(criarListaDocumentos(documentos));

        return card;
    }

    async function carregarDetalhesProcesso(processoId) {
        const [resTram, resDocs] = await Promise.all([
            SistemaLegalAPI.apiFetch('/api/tramites?processo_id=' + processoId),
            SistemaLegalAPI.apiFetch('/api/documentos?processo_id=' + processoId)
        ]);

        let tramites = [];
        let documentos = [];

        if (resTram.ok) {
            const data = await resTram.json();
            tramites = data.tramites || [];
        }

        if (resDocs.ok) {
            const data = await resDocs.json();
            documentos = filtrarDocumentosVisiveis(data.documentos || []);
        }

        return { tramites: tramites, documentos: documentos };
    }

    async function carregarProcessos() {
        const loading = $('processosLoading');
        const lista = $('processosLista');
        const vazio = $('processosVazio');
        const erroEl = $('processosErro');

        mostrarMsg(erroEl, '');

        try {
            const res = await SistemaLegalAPI.apiFetch('/api/processos');
            if (!res.ok) {
                const err = await res.json().catch(function () { return {}; });
                throw new Error(err.erro || 'Não foi possível carregar os processos.');
            }

            const data = await res.json();
            const processos = data.processos || [];

            if (loading) loading.classList.add('hidden');

            if (!processos.length) {
                if (lista) lista.classList.add('hidden');
                if (vazio) vazio.classList.remove('hidden');
                return;
            }

            if (vazio) vazio.classList.add('hidden');
            if (lista) {
                lista.classList.remove('hidden');
                lista.innerHTML = '';
            }

            const detalhes = await Promise.all(processos.map(function (p) {
                return carregarDetalhesProcesso(p.id).then(function (d) {
                    return { processo: p, tramites: d.tramites, documentos: d.documentos };
                });
            }));

            detalhes.forEach(function (item) {
                if (lista) {
                    lista.appendChild(criarCardProcesso(item.processo, item.tramites, item.documentos));
                }
            });

            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        } catch (e) {
            if (loading) loading.classList.add('hidden');
            if (lista) lista.classList.add('hidden');
            mostrarMsg(erroEl, e.message || 'Erro ao carregar processos.');
        }
    }

    function aplicarLogoBranding() {
        const logoEl = $('headerLogo');
        if (!logoEl) return;
        const uri = (typeof window !== 'undefined' && window.LOGO_DATA_URI) ? window.LOGO_DATA_URI : '';
        if (uri) {
            logoEl.src = uri;
            logoEl.classList.remove('hidden');
        }
    }

    function initIcones() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    function bindEventos() {
        $('btnLogout').addEventListener('click', SistemaLegalAuth.logout);
        $('btnDarkMode').addEventListener('click', function () {
            toggleTema();
            initIcones();
        });
        const formTrocar = $('formTrocarPassword');
        if (formTrocar) formTrocar.addEventListener('submit', submeterTrocarPassword);
    }

    async function init() {
        initTema();
        aplicarLogoBranding();

        const user = await SistemaLegalAuth.requireAuth('cliente');
        if (!user) return;

        $('loading').classList.add('hidden');
        $('dashboard').classList.remove('hidden');

        const nomeEl = $('clienteNome');
        if (nomeEl) {
            nomeEl.textContent = user.nome || user.email || 'Cliente';
        }

        bindEventos();
        initIcones();

        if (user.must_change_password || SistemaLegalAuth.userMustChangePassword()) {
            mostrarEcraTrocarPassword(user);
            return;
        }

        mostrarEcraProcessos(user);
        await carregarProcessos();
    }

    init();
})();
