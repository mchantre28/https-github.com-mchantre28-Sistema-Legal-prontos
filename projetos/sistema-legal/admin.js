/**
 * Sistema Legal — painel administrativo (Solicitadora).
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

    let processos = [];
    let processoModalId = null;
    let processoModalDados = null;
    let clientesPortal = [];

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

    function mostrarMsg(el, texto, tipo) {
        if (!el) return;
        el.textContent = texto || '';
        el.classList.remove('hidden', 'admin-msg-erro', 'admin-msg-sucesso');
        if (!texto) {
            el.classList.add('hidden');
            return;
        }
        el.classList.add(tipo === 'sucesso' ? 'admin-msg-sucesso' : 'admin-msg-erro');
    }

    function sufixoNotificacaoEmail(data) {
        if (!data) return '';
        if (data.notificacao_enviada) {
            return ' O cliente foi notificado por email.';
        }
        if (data.notificacao_erro) {
            return ' Aviso: não foi possível notificar o cliente por email (' + data.notificacao_erro + ').';
        }
        return '';
    }

    function normalizarTelefoneWhatsApp(telefone) {
        let digits = String(telefone || '').replace(/\D/g, '');
        if (!digits) return '';
        if (digits.startsWith('00')) digits = digits.slice(2);
        if (digits.startsWith('440') && digits.length > 12) digits = '44' + digits.slice(3);
        if (digits.length === 9 && /^9/.test(digits)) return '351' + digits;
        return digits;
    }

    function formatarTelefoneWhatsApp(telefone) {
        const digits = normalizarTelefoneWhatsApp(telefone);
        if (!digits) return '';
        return '+' + digits;
    }

    function getPortalClienteUrl() {
        const path = window.location.pathname.replace(/[^/]*$/, '');
        return window.location.origin + path + 'cliente.html';
    }

    function construirMensagemWhatsApp(opts) {
        const portalUrl = getPortalClienteUrl();
        const nome = opts.clienteNome || 'Cliente';
        const numero = opts.numeroProcesso || '—';
        const tituloProcesso = opts.tituloProcesso || 'Processo';
        const linhas = [
            'Exmo(a) Sr(a). ' + nome + ',',
            '',
        ];

        if (opts.tipo === 'credenciais') {
            linhas.push(
                'Seguem as credenciais de acesso ao portal do cliente.',
                '',
                'Email: ' + (opts.email || '—'),
                'Password temporária: ' + (opts.password || '—'),
                '',
                'Portal: ' + portalUrl,
                '',
                'Recomenda-se alterar a password no primeiro acesso.'
            );
            linhas.push('', 'Ana Paula Medina — Solicitadora');
            return linhas.join('\n');
        }

        if (opts.tipo === 'documento') {
            linhas.push(
                'Informamos que foi disponibilizado um novo documento no seu processo ' + numero + ' — ' + tituloProcesso + '.',
                '',
                'Documento: ' + (opts.detalheTitulo || 'Novo documento') + '.'
            );
        } else {
            linhas.push(
                'Informamos que foi registado um novo trâmite no seu processo ' + numero + ' — ' + tituloProcesso + '.',
                '',
                'Trâmite: ' + (opts.detalheTitulo || 'Nova actualização') + '.'
            );
            if (opts.detalheDescricao) {
                linhas.push('', String(opts.detalheDescricao));
            }
        }

        linhas.push('', 'Consulte o portal: ' + portalUrl, '', 'Ana Paula Medina — Solicitadora');
        return linhas.join('\n');
    }

    function buildWhatsAppLink(opts) {
        const telefone = normalizarTelefoneWhatsApp(opts.telefone);
        if (!telefone) return null;
        const msg = construirMensagemWhatsApp(opts);
        const link = 'https://wa.me/' + encodeURIComponent(telefone) + '?text=' + encodeURIComponent(msg);
        return { link: link, telefone: telefone, msg: msg };
    }

    function abrirWhatsAppLink(link, permitirMesmaAba) {
        if (!link) return false;
        try {
            const win = window.open(link, '_blank', 'noopener,noreferrer');
            if (win) return true;
        } catch (e) { /* fallback opcional */ }
        if (permitirMesmaAba) {
            try {
                window.location.assign(link);
                return true;
            } catch (e2) {
                return false;
            }
        }
        return false;
    }

    function criarBotaoWhatsApp(built, label) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-whatsapp btn-sm';
        btn.textContent = label || 'Abrir WhatsApp e enviar ao cliente';
        btn.addEventListener('click', function () {
            abrirWhatsAppLink(built.link, true);
        });
        return btn;
    }

    function esconderWhatsAppAcoes() {
        ['formTramiteWhatsApp', 'formDocWhatsApp'].forEach(function (id) {
            const el = $(id);
            if (el) {
                el.innerHTML = '';
                el.classList.add('hidden');
            }
        });
    }

    function mostrarWhatsAppAcao(containerId, opts, autoOpen) {
        const el = $(containerId);
        if (!el) return;

        const built = buildWhatsAppLink(opts);
        if (!built) {
            const clienteLabel = [opts.clienteNome, opts.clienteEmail].filter(Boolean).join(' · ') || 'deste processo';
            el.innerHTML =
                '<div class="admin-whatsapp-banner admin-whatsapp-banner-aviso">' +
                '<p class="admin-whatsapp-banner-titulo">WhatsApp indisponível</p>' +
                '<p class="admin-whatsapp-banner-texto">O cliente <strong>' + clienteLabel + '</strong> não tem telefone WhatsApp registado.</p>' +
                '<p class="admin-whatsapp-banner-texto admin-whatsapp-banner-alerta">Registe o número na secção «Clientes — Portal» (com indicativo, ex.: 447475602282) e volte a registar o trâmite, ou crie o processo associado ao cliente correcto.</p>' +
                '</div>';
            el.classList.remove('hidden');
            return;
        }

        let statusHtml =
            '<p class="admin-whatsapp-banner-texto admin-whatsapp-banner-alerta">Clique no botão verde → confirme o chat → carregue em <strong>Enviar</strong> no WhatsApp.</p>';

        el.innerHTML =
            '<div class="admin-whatsapp-banner">' +
            '<p class="admin-whatsapp-banner-titulo">WhatsApp — passo final manual</p>' +
            '<p class="admin-whatsapp-banner-texto">Email já enviado automaticamente. WhatsApp usa o número <strong>' + formatarTelefoneWhatsApp(built.telefone) + '</strong>.</p>' +
            statusHtml +
            '<ol class="admin-whatsapp-passos">' +
            '<li>Clique em «Abrir WhatsApp e enviar ao cliente»</li>' +
            '<li>Confirme que abriu o chat correcto</li>' +
            '<li>Carregue em <strong>Enviar</strong> no WhatsApp</li>' +
            '</ol>' +
            '</div>';

        el.appendChild(criarBotaoWhatsApp(built, 'Abrir WhatsApp e enviar ao cliente'));
        el.classList.remove('hidden');
    }

    function getDadosClienteProcesso(processo) {
        if (!processo) return { telefone: '', nome: '', email: '' };

        const cliente = clientesPortal.find(function (c) {
            return c.email === processo.cliente_email || c.id === processo.cliente_id;
        });

        return {
            telefone: (cliente && cliente.telefone) || processo.cliente_telefone || '',
            nome: processo.cliente_nome || (cliente && cliente.nome) || '',
            email: processo.cliente_email || (cliente && cliente.email) || '',
        };
    }

    function limparMsgs(ids) {
        ids.forEach(function (id) {
            const el = $(id);
            if (el) {
                el.textContent = '';
                el.classList.add('hidden');
            }
        });
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
        if (btn) btn.textContent = isDark ? 'Modo claro' : 'Modo escuro';
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

    function renderTabela() {
        const tbody = $('processosBody');
        const wrap = $('processosTabelaWrap');
        const vazio = $('processosVazio');
        const loading = $('processosLoading');

        if (loading) loading.classList.add('hidden');

        if (!processos.length) {
            if (wrap) wrap.classList.add('hidden');
            if (vazio) vazio.classList.remove('hidden');
            if (tbody) tbody.innerHTML = '';
            return;
        }

        if (wrap) wrap.classList.remove('hidden');
        if (vazio) vazio.classList.add('hidden');
        if (!tbody) return;

        tbody.innerHTML = '';

        processos.forEach(function (p) {
            const tr = document.createElement('tr');

            const tdNum = document.createElement('td');
            tdNum.textContent = p.numero_processo || '—';

            const tdTitulo = document.createElement('td');
            tdTitulo.textContent = p.titulo || '—';

            const tdEstado = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = classeEstado(p.estado);
            badge.textContent = labelEstado(p.estado);
            tdEstado.appendChild(badge);

            const tdEmail = document.createElement('td');
            const clienteLinha = [p.cliente_nome, p.cliente_email].filter(Boolean).join(' · ');
            tdEmail.textContent = clienteLinha || '—';
            if (p.cliente_telefone) {
                tdEmail.title = 'WhatsApp: ' + p.cliente_telefone;
            }

            const tdAcoes = document.createElement('td');
            const acoes = document.createElement('div');
            acoes.className = 'admin-acoes';

            const btnTramite = document.createElement('button');
            btnTramite.type = 'button';
            btnTramite.className = 'btn btn-primary btn-sm';
            btnTramite.textContent = 'Novo trâmite';
            btnTramite.addEventListener('click', function () {
                abrirModalTramite(p);
            });
            acoes.appendChild(btnTramite);

            const btnEditar = document.createElement('button');
            btnEditar.type = 'button';
            btnEditar.className = 'btn btn-secondary btn-sm';
            btnEditar.textContent = 'Editar';
            btnEditar.addEventListener('click', function () {
                abrirModalEditar(p);
            });
            acoes.appendChild(btnEditar);

            const btnEliminar = document.createElement('button');
            btnEliminar.type = 'button';
            btnEliminar.className = 'btn btn-error btn-sm';
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.addEventListener('click', function () {
                eliminarProcesso(p);
            });
            acoes.appendChild(btnEliminar);

            tdAcoes.appendChild(acoes);

            tr.appendChild(tdNum);
            tr.appendChild(tdTitulo);
            tr.appendChild(tdEstado);
            tr.appendChild(tdEmail);
            tr.appendChild(tdAcoes);
            tbody.appendChild(tr);
        });
    }

    async function carregarProcessos() {
        const erroEl = $('processosErro');
        mostrarMsg(erroEl, '', 'erro');

        try {
            const res = await SistemaLegalAPI.apiFetch('/api/processos');
            if (!res.ok) {
                const err = await res.json().catch(function () { return {}; });
                throw new Error(err.erro || 'Não foi possível carregar os processos.');
            }

            const data = await res.json();
            processos = data.processos || [];
            renderTabela();
        } catch (e) {
            const loading = $('processosLoading');
            if (loading) loading.classList.add('hidden');
            mostrarMsg(erroEl, e.message || 'Erro ao carregar processos.', 'erro');
        }
    }

    function abrirModalTramite(processo) {
        processoModalId = processo.id;
        processoModalDados = processo;

        const modal = $('modalTramite');
        const info = $('modalProcessoInfo');
        const form = $('formNovoTramite');

        if (info) {
            const cliente = getDadosClienteProcesso(processo);
            info.textContent =
                (processo.numero_processo || '—') + ' · ' +
                (processo.titulo || 'Processo') + ' · ' +
                labelEstado(processo.estado) +
                ' · Cliente: ' + (cliente.nome || cliente.email || '—') +
                (cliente.telefone ? ' · WhatsApp: ' + cliente.telefone : ' · sem WhatsApp');
        }

        limparMsgs(['formTramiteErro', 'formTramiteSucesso', 'formDocErro', 'formDocSucesso']);
        esconderWhatsAppAcoes();

        if (form) form.reset();
        const hoje = new Date().toISOString().slice(0, 10);
        const dataInput = $('dataTramite');
        if (dataInput) dataInput.value = hoje;

        const formDoc = $('formNovoDocumento');
        if (formDoc) formDoc.reset();
        const visivel = $('visivelCliente');
        if (visivel) visivel.checked = true;

        if (modal) modal.classList.add('show');
        carregarDocumentos(processo.id);
    }

    function fecharModalTramite() {
        const modal = $('modalTramite');
        if (modal) modal.classList.remove('show');
        processoModalId = null;
        processoModalDados = null;
    }

    async function carregarDocumentos(processoId) {
        const lista = $('documentosLista');
        if (!lista) return;

        lista.innerHTML = '<div class="admin-loading"><span class="admin-spinner"></span> A carregar documentos...</div>';

        try {
            const res = await SistemaLegalAPI.apiFetch('/api/documentos?processo_id=' + processoId);
            if (!res.ok) {
                const err = await res.json().catch(function () { return {}; });
                throw new Error(err.erro || 'Não foi possível carregar os documentos.');
            }

            const data = await res.json();
            const documentos = data.documentos || [];
            lista.innerHTML = '';

            if (!documentos.length) {
                const p = document.createElement('p');
                p.className = 'admin-section-desc';
                p.style.margin = '0';
                p.textContent = 'Ainda não existem documentos neste processo.';
                lista.appendChild(p);
                return;
            }

            documentos.forEach(function (d) {
                lista.appendChild(criarCardDocumento(d));
            });
        } catch (e) {
            lista.innerHTML = '';
            const p = document.createElement('p');
            p.className = 'admin-msg admin-msg-erro';
            p.textContent = e.message || 'Erro ao carregar documentos.';
            lista.appendChild(p);
        }
    }

    function criarCardDocumento(d) {
        const card = document.createElement('article');
        card.className = 'admin-doc-card';

        const url = SistemaLegalAPI.documentoUrl(d.url_ficheiro);
        if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = d.nome_ficheiro || 'Documento';
            card.appendChild(link);
        } else {
            card.textContent = d.nome_ficheiro || 'Documento';
        }

        const badge = document.createElement('span');
        badge.className = 'status-processo ' + (d.visivel_cliente ? 'status-processo-concluido' : 'status-processo-arquivado');
        badge.style.marginLeft = '0.5rem';
        badge.textContent = d.visivel_cliente ? 'Visível' : 'Interno';
        card.appendChild(document.createTextNode(' '));
        card.appendChild(badge);

        return card;
    }

    async function criarProcesso(ev) {
        ev.preventDefault();
        limparMsgs(['formProcessoErro', 'formProcessoSucesso']);

        const clienteEmail = $('clienteEmail').value.trim().toLowerCase();
        const numeroProcesso = $('numeroProcesso').value.trim();
        const titulo = $('tituloProcesso').value.trim();
        const descricao = $('descricaoProcesso').value.trim();
        const estado = $('estadoProcesso').value;

        if (!clienteEmail || !numeroProcesso || !titulo) {
            mostrarMsg($('formProcessoErro'), 'Email do cliente, número e título são obrigatórios.', 'erro');
            return;
        }

        const btn = $('btnCriarProcesso');
        if (btn) btn.disabled = true;

        try {
            const res = await SistemaLegalAPI.apiFetch('/api/processos', {
                method: 'POST',
                body: JSON.stringify({
                    cliente_email: clienteEmail,
                    numero_processo: numeroProcesso,
                    titulo: titulo,
                    descricao: descricao || '',
                    estado: estado || 'em_tramitacao'
                })
            });

            const data = await res.json().catch(function () { return {}; });

            if (!res.ok) {
                throw new Error(data.erro || 'Não foi possível criar o processo.');
            }

            mostrarMsg($('formProcessoSucesso'), 'Processo criado com sucesso.', 'sucesso');
            $('formNovoProcesso').reset();
            await carregarProcessos();
        } catch (e) {
            mostrarMsg($('formProcessoErro'), e.message || 'Erro ao criar processo.', 'erro');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    async function criarTramite(ev) {
        ev.preventDefault();
        limparMsgs(['formTramiteErro', 'formTramiteSucesso']);
        esconderWhatsAppAcoes();

        if (!processoModalId) {
            mostrarMsg($('formTramiteErro'), 'Nenhum processo selecionado.', 'erro');
            return;
        }

        const dataTramite = $('dataTramite').value;
        const titulo = $('tituloTramite').value.trim();
        const descricao = $('descricaoTramite').value.trim();

        if (!dataTramite || !titulo) {
            mostrarMsg($('formTramiteErro'), 'Data e título são obrigatórios.', 'erro');
            return;
        }

        const btn = $('btnCriarTramite');
        if (btn) btn.disabled = true;

        try {
            const res = await SistemaLegalAPI.apiFetch('/api/tramites', {
                method: 'POST',
                body: JSON.stringify({
                    processo_id: processoModalId,
                    data_tramite: dataTramite,
                    titulo: titulo,
                    descricao: descricao || null
                })
            });

            const data = await res.json().catch(function () { return {}; });

            if (!res.ok) {
                throw new Error(data.erro || 'Não foi possível registar o trâmite.');
            }

            mostrarMsg($('formTramiteSucesso'), 'Trâmite registado com sucesso.' + sufixoNotificacaoEmail(data), 'sucesso');

            const cliente = getDadosClienteProcesso(processoModalDados);
            mostrarWhatsAppAcao('formTramiteWhatsApp', {
                tipo: 'tramite',
                telefone: cliente.telefone,
                clienteNome: cliente.nome,
                clienteEmail: cliente.email,
                numeroProcesso: processoModalDados && processoModalDados.numero_processo,
                tituloProcesso: processoModalDados && processoModalDados.titulo,
                detalheTitulo: titulo,
                detalheDescricao: descricao || null,
            }, true);

            $('tituloTramite').value = '';
            $('descricaoTramite').value = '';
        } catch (e) {
            mostrarMsg($('formTramiteErro'), e.message || 'Erro ao registar trâmite.', 'erro');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    async function criarDocumento(ev) {
        ev.preventDefault();
        limparMsgs(['formDocErro', 'formDocSucesso']);
        esconderWhatsAppAcoes();

        if (!processoModalId) {
            mostrarMsg($('formDocErro'), 'Nenhum processo selecionado.', 'erro');
            return;
        }

        const ficheiroInput = $('ficheiroDocumento');
        const ficheiro = ficheiroInput && ficheiroInput.files && ficheiroInput.files[0];
        const nomeFicheiro = $('nomeDocumento').value.trim();
        const urlFicheiro = $('urlDocumento').value.trim();
        const visivelCliente = $('visivelCliente').checked;

        if (!ficheiro && !urlFicheiro) {
            mostrarMsg($('formDocErro'), 'Selecione um ficheiro ou indique uma URL externa.', 'erro');
            return;
        }

        if (ficheiro && urlFicheiro) {
            mostrarMsg($('formDocErro'), 'Indique apenas um ficheiro ou uma URL externa, não ambos.', 'erro');
            return;
        }

        if (ficheiro) {
            const ext = (ficheiro.name.split('.').pop() || '').toLowerCase();
            const extsPermitidas = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
            if (extsPermitidas.indexOf(ext) === -1) {
                mostrarMsg($('formDocErro'), 'Tipo de ficheiro não permitido. Use PDF, DOC, DOCX, JPG ou PNG.', 'erro');
                return;
            }
            if (ficheiro.size > 10 * 1024 * 1024) {
                mostrarMsg($('formDocErro'), 'Ficheiro demasiado grande. O limite é 10 MB.', 'erro');
                return;
            }
        }

        if (!ficheiro && urlFicheiro && !nomeFicheiro) {
            mostrarMsg($('formDocErro'), 'Para URL externa, o nome de exibição é obrigatório.', 'erro');
            return;
        }

        const btn = $('btnCriarDocumento');
        if (btn) btn.disabled = true;

        try {
            let res;
            if (ficheiro) {
                res = await SistemaLegalAPI.uploadDocument(
                    processoModalId,
                    ficheiro,
                    visivelCliente,
                    nomeFicheiro || undefined
                );
            } else {
                res = await SistemaLegalAPI.apiFetch('/api/documentos', {
                    method: 'POST',
                    body: JSON.stringify({
                        processo_id: processoModalId,
                        nome_ficheiro: nomeFicheiro,
                        url_ficheiro: urlFicheiro,
                        visivel_cliente: visivelCliente
                    })
                });
            }

            const data = await res.json().catch(function () { return {}; });

            if (!res.ok) {
                throw new Error(data.erro || 'Não foi possível adicionar o documento.');
            }

            const msgBase = ficheiro ? 'Ficheiro carregado com sucesso.' : 'Documento adicionado com sucesso.';
            const msgNotif = visivelCliente ? sufixoNotificacaoEmail(data) : '';
            mostrarMsg($('formDocSucesso'), msgBase + msgNotif, 'sucesso');

            if (visivelCliente) {
                const doc = data.documento || {};
                const cliente = getDadosClienteProcesso(processoModalDados);
                mostrarWhatsAppAcao('formDocWhatsApp', {
                    tipo: 'documento',
                    telefone: cliente.telefone,
                    clienteNome: cliente.nome,
                    clienteEmail: cliente.email,
                    numeroProcesso: processoModalDados && processoModalDados.numero_processo,
                    tituloProcesso: processoModalDados && processoModalDados.titulo,
                    detalheTitulo: doc.nome_ficheiro || nomeFicheiro || 'Novo documento',
                }, true);
            }

            $('formNovoDocumento').reset();
            $('visivelCliente').checked = true;
            await carregarDocumentos(processoModalId);
        } catch (e) {
            mostrarMsg($('formDocErro'), e.message || 'Erro ao adicionar documento.', 'erro');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    async function carregarClientes() {
        const datalist = $('listaClientesApi');
        const loading = $('clientesPortalLoading');
        const wrap = $('clientesPortalWrap');
        const vazio = $('clientesPortalVazio');
        const erroEl = $('clientesPortalErro');
        const tbody = $('clientesPortalBody');

        if (loading) loading.classList.remove('hidden');
        if (wrap) wrap.classList.add('hidden');
        if (vazio) vazio.classList.add('hidden');
        mostrarMsg(erroEl, '', 'erro');

        try {
            const res = await SistemaLegalAPI.apiFetch('/api/clientes');
            if (!res.ok) {
                const err = await res.json().catch(function () { return {}; });
                throw new Error(err.erro || 'Não foi possível carregar os clientes.');
            }

            const data = await res.json();
            clientesPortal = data.clientes || [];

            if (datalist) {
                datalist.innerHTML = '';
                clientesPortal.forEach(function (c) {
                    const opt = document.createElement('option');
                    opt.value = c.email || '';
                    opt.label = (c.nome || c.email) + (c.email ? ' (' + c.email + ')' : '');
                    datalist.appendChild(opt);
                });
            }

            if (tbody) {
                tbody.innerHTML = '';
                clientesPortal.forEach(function (c) {
                    tbody.appendChild(criarLinhaClientePortal(c));
                });
            }

            if (loading) loading.classList.add('hidden');
            if (clientesPortal.length) {
                if (wrap) wrap.classList.remove('hidden');
            } else if (vazio) {
                vazio.classList.remove('hidden');
            }
        } catch (e) {
            if (loading) loading.classList.add('hidden');
            mostrarMsg(erroEl, e.message || 'Erro ao carregar clientes.', 'erro');
            console.warn('Não foi possível carregar lista de clientes:', e);
        }
    }

    function sincronizarTelefoneProcessos(clienteId, telefone) {
        processos.forEach(function (p) {
            if (p.cliente_id === clienteId) {
                p.cliente_telefone = telefone || null;
            }
        });
        if (processoModalDados && processoModalDados.cliente_id === clienteId) {
            processoModalDados.cliente_telefone = telefone || null;
        }
    }

    function criarLinhaClientePortal(cliente) {
        const tr = document.createElement('tr');

        const tdNome = document.createElement('td');
        tdNome.textContent = cliente.nome || '—';

        const tdEmail = document.createElement('td');
        tdEmail.textContent = cliente.email || '—';

        const tdTel = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'tel';
        input.className = 'form-control';
        input.maxLength = 20;
        input.placeholder = '447404139780';
        input.value = cliente.telefone || '';
        input.dataset.clienteId = String(cliente.id);
        input.addEventListener('input', function () {
            input.value = input.value.replace(/\D/g, '');
        });
        tdTel.appendChild(input);

        const tdAcao = document.createElement('td');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-secondary btn-sm';
        btn.textContent = 'Guardar';
        btn.addEventListener('click', function () {
            guardarTelefoneCliente(cliente.id, input.value.trim(), btn);
        });
        tdAcao.appendChild(btn);

        tr.appendChild(tdNome);
        tr.appendChild(tdEmail);
        tr.appendChild(tdTel);
        tr.appendChild(tdAcao);
        return tr;
    }

    async function guardarTelefoneCliente(clienteId, telefone, btn) {
        if (btn) btn.disabled = true;
        try {
            const res = await SistemaLegalAPI.updateClientePortal(clienteId, {
                telefone: normalizarTelefoneWhatsApp(telefone) || telefone
            });
            const data = await res.json().catch(function () { return {}; });
            if (!res.ok) {
                throw new Error(data.erro || 'Não foi possível guardar o telefone.');
            }

            const actualizado = data.cliente || {};
            clientesPortal = clientesPortal.map(function (c) {
                return c.id === clienteId ? actualizado : c;
            });
            sincronizarTelefoneProcessos(clienteId, actualizado.telefone);
            if (btn) {
                btn.textContent = 'Guardado';
                setTimeout(function () { btn.textContent = 'Guardar'; }, 1500);
            }
        } catch (e) {
            window.alert(e.message || 'Erro ao guardar telefone.');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function abrirModalEditar(processo) {
        const modal = $('modalEditarProcesso');
        const info = $('modalEditarInfo');

        $('editarProcessoId').value = processo.id;
        $('editarNumeroProcesso').value = processo.numero_processo || '';
        $('editarTituloProcesso').value = processo.titulo || '';
        $('editarDescricaoProcesso').value = processo.descricao || '';
        $('editarEstadoProcesso').value = processo.estado || 'em_tramitacao';

        if (info) {
            info.textContent = (processo.cliente_nome || processo.cliente_email || 'Cliente') +
                (processo.cliente_email ? ' · ' + processo.cliente_email : '');
        }

        limparMsgs(['formEditarErro', 'formEditarSucesso']);
        if (modal) modal.classList.add('show');
    }

    function fecharModalEditar() {
        const modal = $('modalEditarProcesso');
        if (modal) modal.classList.remove('show');
    }

    async function guardarProcesso(ev) {
        ev.preventDefault();
        limparMsgs(['formEditarErro', 'formEditarSucesso']);

        const id = $('editarProcessoId').value;
        const numeroProcesso = $('editarNumeroProcesso').value.trim();
        const titulo = $('editarTituloProcesso').value.trim();
        const descricao = $('editarDescricaoProcesso').value.trim();
        const estado = $('editarEstadoProcesso').value;

        if (!id || !numeroProcesso || !titulo) {
            mostrarMsg($('formEditarErro'), 'Número e título são obrigatórios.', 'erro');
            return;
        }

        const btn = $('btnGuardarProcesso');
        if (btn) btn.disabled = true;

        try {
            const res = await SistemaLegalAPI.apiFetch('/api/processos/' + id, {
                method: 'PUT',
                body: JSON.stringify({
                    numero_processo: numeroProcesso,
                    titulo: titulo,
                    descricao: descricao || '',
                    estado: estado
                })
            });

            const data = await res.json().catch(function () { return {}; });

            if (!res.ok) {
                throw new Error(data.erro || 'Não foi possível atualizar o processo.');
            }

            mostrarMsg($('formEditarSucesso'), 'Processo atualizado com sucesso.', 'sucesso');
            await carregarProcessos();
            setTimeout(fecharModalEditar, 800);
        } catch (e) {
            mostrarMsg($('formEditarErro'), e.message || 'Erro ao atualizar processo.', 'erro');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    async function eliminarProcesso(processo) {
        const titulo = processo.titulo || processo.numero_processo || 'este processo';
        const msg = 'Tem a certeza que pretende eliminar o processo «' + titulo + '»?\n\n' +
            'Esta ação é irreversível. Os trâmites e documentos associados podem deixar de estar acessíveis.';

        if (!window.confirm(msg)) return;

        try {
            const res = await SistemaLegalAPI.apiFetch('/api/processos/' + processo.id, {
                method: 'DELETE'
            });

            const data = await res.json().catch(function () { return {}; });

            if (!res.ok) {
                throw new Error(data.erro || 'Não foi possível eliminar o processo.');
            }

            if (processoModalId === processo.id) {
                fecharModalTramite();
            }
            await carregarProcessos();
        } catch (e) {
            mostrarMsg($('processosErro'), e.message || 'Erro ao eliminar processo.', 'erro');
        }
    }

    function copiarTexto(texto, msg) {
        const valor = String(texto || '');
        if (!valor) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(valor).then(function () {
                window.alert(msg || 'Copiado.');
            }).catch(function () {
                window.alert('Não foi possível copiar.');
            });
            return;
        }
        window.prompt('Copiar:', valor);
    }

    let portalCredCache = null;

    function abrirModalCredenciaisPortal(opts) {
        opts = opts || {};
        const modal = $('modalCredenciaisPortal');
        const titulo = $('modalCredenciaisTitulo');
        const meta = $('modalCredenciaisMeta');
        const emailEl = $('modalCredenciaisEmail');
        const passWrap = $('modalCredenciaisPasswordWrap');
        const passEl = $('modalCredenciaisPassword');
        const aviso = $('modalCredenciaisAviso');
        const estadoEmail = $('modalCredenciaisEstadoEmail');
        const whatsappBox = $('modalCredenciaisWhatsApp');
        const btnReenviar = $('btnReenviarEmailPortal');
        const btnWhatsApp = $('btnAbrirWhatsAppCredenciais');
        const telefoneNorm = normalizarTelefoneWhatsApp(opts.telefone || '');

        if (titulo) {
            titulo.textContent = opts.criado ? 'Conta de portal criada' : (opts.redefinida ? 'Nova password gerada' : 'Conta de portal');
        }
        if (meta) meta.textContent = opts.nome || '';
        if (emailEl) emailEl.textContent = opts.email || '';
        if (passWrap && passEl) {
            if (opts.password) {
                passWrap.classList.remove('hidden');
                passEl.textContent = opts.password;
                portalCredCache = {
                    email: String(opts.email || ''),
                    nome: String(opts.nome || ''),
                    password: String(opts.password || ''),
                    telefone: telefoneNorm,
                    tipo: opts.redefinida ? 'reset' : 'criacao'
                };
            } else {
                passWrap.classList.add('hidden');
                passEl.textContent = '';
                portalCredCache = telefoneNorm ? {
                    email: String(opts.email || ''),
                    nome: String(opts.nome || ''),
                    password: '',
                    telefone: telefoneNorm,
                    tipo: 'criacao'
                } : null;
            }
        }
        if (estadoEmail) {
            estadoEmail.classList.remove('hidden');
            if (opts.email_enviado === true) {
                let htmlOk = '<strong>📧 Email enviado</strong><br><span class="text-green-800">Credenciais enviadas para o email do cliente.</span>';
                if (opts.email_dica) {
                    htmlOk += '<br><span class="text-amber-800" style="display:block;margin-top:0.5rem;">' + opts.email_dica + '</span>';
                } else if (/@(outlook|hotmail|live|msn)\./i.test(String(opts.email || ''))) {
                    htmlOk += '<br><span class="text-amber-800" style="display:block;margin-top:0.5rem;">Outlook/Hotmail: peça ao cliente para verificar Lixo/Spam e a pasta Outros.</span>';
                }
                estadoEmail.innerHTML = htmlOk;
                estadoEmail.className = 'text-sm text-green-900 bg-green-50 border-2 border-green-300 rounded-lg p-3';
            } else if (opts.email_enviado === false) {
                estadoEmail.innerHTML = '<strong>📧 Email não enviado</strong><br><span>' + (opts.email_erro || 'Falha no envio.') + '</span>';
                estadoEmail.className = 'text-sm text-amber-900 bg-amber-50 border-2 border-amber-400 rounded-lg p-3';
            } else {
                estadoEmail.textContent = '';
                estadoEmail.classList.add('hidden');
            }
        }

        const builtWa = (telefoneNorm && opts.password)
            ? buildWhatsAppLink({
                tipo: 'credenciais',
                telefone: telefoneNorm,
                clienteNome: opts.nome,
                email: opts.email,
                password: opts.password
            })
            : null;

        if (whatsappBox) {
            whatsappBox.innerHTML = '';
            if (builtWa) {
                whatsappBox.classList.remove('hidden');
                whatsappBox.innerHTML =
                    '<div class="admin-whatsapp-banner">' +
                    '<p class="admin-whatsapp-banner-titulo">WhatsApp — enviar credenciais ao cliente</p>' +
                    '<p class="admin-whatsapp-banner-texto">Número: <strong>' + formatarTelefoneWhatsApp(builtWa.telefone) + '</strong></p>' +
                    '<p class="admin-whatsapp-banner-texto admin-whatsapp-banner-alerta">O WhatsApp <strong>não envia sozinho</strong>. Abra o chat e carregue em <strong>Enviar</strong>.</p>' +
                    '<ol class="admin-whatsapp-passos">' +
                    '<li>Clique em «Abrir WhatsApp com credenciais»</li>' +
                    '<li>Confirme o contacto no WhatsApp</li>' +
                    '<li>Carregue em <strong>Enviar</strong></li>' +
                    '</ol></div>';
            } else if (opts.criado && !telefoneNorm) {
                whatsappBox.classList.remove('hidden');
                whatsappBox.innerHTML =
                    '<div class="admin-whatsapp-banner admin-whatsapp-banner-aviso">' +
                    '<p class="admin-whatsapp-banner-titulo">WhatsApp não configurado</p>' +
                    '<p class="admin-whatsapp-banner-texto">Não foi indicado número WhatsApp. Pode adicioná-lo na lista «Clientes — Portal».</p>' +
                    '</div>';
            } else {
                whatsappBox.classList.add('hidden');
            }
        }

        if (btnWhatsApp) {
            if (builtWa) {
                btnWhatsApp.classList.remove('hidden');
                btnWhatsApp.onclick = function () {
                    abrirWhatsAppLink(builtWa.link, true);
                };
            } else {
                btnWhatsApp.classList.add('hidden');
                btnWhatsApp.onclick = null;
            }
        }

        if (btnReenviar) {
            if (opts.password) btnReenviar.classList.remove('hidden');
            else btnReenviar.classList.add('hidden');
        }
        if (aviso) {
            aviso.textContent = opts.password
                ? 'Recomenda-se alterar a password no primeiro acesso. Email é automático; WhatsApp exige carregar em Enviar.'
                : (opts.mensagem || 'Use «Gerar nova password» na área CRM se precisar de credenciais.');
        }
        if (modal) modal.classList.add('show');

        if (builtWa && opts.autoAbrirWhatsApp !== false) {
            setTimeout(function () {
                abrirWhatsAppLink(builtWa.link, true);
            }, 450);
        }
    }

    function fecharModalCredenciaisPortal() {
        const modal = $('modalCredenciaisPortal');
        if (modal) modal.classList.remove('show');
    }

    async function criarClientePortal(ev) {
        ev.preventDefault();
        limparMsgs(['formPortalErro', 'formPortalSucesso']);

        const nome = $('portalClienteNome').value.trim();
        const email = $('portalClienteEmail').value.trim().toLowerCase();
        const telefone = ($('portalClienteTelefone') && $('portalClienteTelefone').value.trim()) || '';

        if (!nome || !email) {
            mostrarMsg($('formPortalErro'), 'Nome e email são obrigatórios.', 'erro');
            return;
        }

        const btn = $('btnCriarClientePortal');
        if (btn) btn.disabled = true;

        try {
            const res = await SistemaLegalAPI.createClienteAccount({
                nome: nome,
                email: email,
                telefone: normalizarTelefoneWhatsApp(telefone) || undefined,
                gerar_password: true,
                enviar_email: true
            });
            const data = await res.json().catch(function () { return {}; });

            if (res.status === 409) {
                mostrarMsg($('formPortalErro'), data.erro || 'Já existe conta com este email.', 'erro');
                abrirModalCredenciaisPortal({
                    email: (data.cliente && data.cliente.email) || email,
                    nome: (data.cliente && data.cliente.nome) || nome,
                    mensagem: 'Conta já existia. Pode gerar nova password na área CRM.'
                });
                return;
            }

            if (!res.ok) {
                throw new Error(data.erro || 'Não foi possível criar a conta.');
            }

            if (data.email_enviado === true) {
                mostrarMsg($('formPortalSucesso'), 'Conta criada e credenciais enviadas por email.', 'sucesso');
            } else if (data.email_enviado === false && data.email_erro) {
                mostrarMsg($('formPortalSucesso'), 'Conta criada. Email não enviado: ' + data.email_erro, 'erro');
            } else {
                mostrarMsg($('formPortalSucesso'), 'Conta criada com sucesso.', 'sucesso');
            }
            $('formNovoClientePortal').reset();
            await carregarClientes();
            abrirModalCredenciaisPortal({
                email: (data.cliente && data.cliente.email) || email,
                nome: (data.cliente && data.cliente.nome) || nome,
                password: data.password_temporaria,
                telefone: (data.cliente && data.cliente.telefone) || telefone,
                criado: true,
                email_enviado: data.email_enviado,
                email_erro: data.email_erro,
                email_dica: data.email_dica,
                autoAbrirWhatsApp: true
            });
        } catch (e) {
            mostrarMsg($('formPortalErro'), e.message || 'Erro ao criar conta.', 'erro');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    async function reenviarEmailPortal() {
        if (!portalCredCache || !portalCredCache.email || !portalCredCache.password) {
            window.alert('Credenciais indisponíveis para reenvio.');
            return;
        }
        const btn = $('btnReenviarEmailPortal');
        if (btn) btn.disabled = true;
        try {
            const res = await SistemaLegalAPI.sendPortalCredentials({
                email: portalCredCache.email,
                nome: portalCredCache.nome,
                password: portalCredCache.password,
                tipo: portalCredCache.tipo
            });
            const data = await res.json().catch(function () { return {}; });
            if (!res.ok) throw new Error(data.erro || data.email_erro || 'Não foi possível reenviar.');
            window.alert('Credenciais reenviadas por email.');
        } catch (e) {
            window.alert(e.message || 'Erro ao reenviar email.');
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function bindEventos() {
        $('btnLogout').addEventListener('click', SistemaLegalAuth.logout);
        $('btnDarkMode').addEventListener('click', toggleTema);
        $('btnFecharModal').addEventListener('click', fecharModalTramite);
        $('btnFecharModalEditar').addEventListener('click', fecharModalEditar);
        $('formEditarProcesso').addEventListener('submit', guardarProcesso);
        $('formNovoProcesso').addEventListener('submit', criarProcesso);
        $('formNovoTramite').addEventListener('submit', criarTramite);
        $('formNovoDocumento').addEventListener('submit', criarDocumento);
        $('formNovoClientePortal').addEventListener('submit', criarClientePortal);
        $('btnFecharModalCredenciais').addEventListener('click', fecharModalCredenciaisPortal);
        $('btnCopiarEmailPortal').addEventListener('click', function () {
            copiarTexto($('modalCredenciaisEmail') && $('modalCredenciaisEmail').textContent, 'Email copiado.');
        });
        $('btnCopiarPasswordPortal').addEventListener('click', function () {
            copiarTexto($('modalCredenciaisPassword') && $('modalCredenciaisPassword').textContent, 'Password copiada.');
        });
        const btnReenviar = $('btnReenviarEmailPortal');
        if (btnReenviar) btnReenviar.addEventListener('click', reenviarEmailPortal);

        const modal = $('modalTramite');
        const modalEditar = $('modalEditarProcesso');
        const modalCredenciais = $('modalCredenciaisPortal');
        if (modal) {
            modal.addEventListener('click', function (ev) {
                if (ev.target === modal) fecharModalTramite();
            });
        }
        if (modalEditar) {
            modalEditar.addEventListener('click', function (ev) {
                if (ev.target === modalEditar) fecharModalEditar();
            });
        }
        if (modalCredenciais) {
            modalCredenciais.addEventListener('click', function (ev) {
                if (ev.target === modalCredenciais) fecharModalCredenciaisPortal();
            });
        }

        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && modal && modal.classList.contains('show')) {
                fecharModalTramite();
            }
            if (ev.key === 'Escape' && modalEditar && modalEditar.classList.contains('show')) {
                fecharModalEditar();
            }
            if (ev.key === 'Escape' && modalCredenciais && modalCredenciais.classList.contains('show')) {
                fecharModalCredenciaisPortal();
            }
        });
    }

    async function init() {
        initTema();

        const user = await SistemaLegalAuth.requireAuth('admin');
        if (!user) return;

        $('loading').classList.add('hidden');
        $('dashboard').classList.remove('hidden');

        const nomeEl = $('adminNome');
        if (nomeEl) {
            nomeEl.textContent = user.nome || 'Ana Paula Medina';
        }

        bindEventos();
        await carregarClientes();
        await carregarProcessos();
    }

    init();
})();
