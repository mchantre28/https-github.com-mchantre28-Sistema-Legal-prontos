/**
 * Sistema Legal — módulo de login (frontend).
 *
 * Envia POST para API_BASE_URL + '/api/login' (predefinição: http://localhost:3001).
 * O frontend corre em :8000; não há proxy — usa URL completa definida em api.js.
 */
(function (global) {
    'use strict';

    function getRedirectForPerfil(perfil) {
        if (perfil === 'admin') return 'admin.html';
        if (perfil === 'cliente') return 'cliente.html';
        return 'index.html';
    }

    function showLoginError(erroElId, mensagem) {
        const el = erroElId ? document.getElementById(erroElId) : null;
        if (el) {
            el.textContent = mensagem;
            el.classList.remove('hidden');
            return;
        }
        if (typeof mostrarErroLogin === 'function') {
            mostrarErroLogin(mensagem);
        } else {
            alert(mensagem);
        }
    }

    function clearLoginError(erroElId) {
        const el = erroElId ? document.getElementById(erroElId) : null;
        if (el) {
            el.textContent = '';
            el.classList.add('hidden');
        }
    }

    async function efetuarLogin(email, senha, perfil, erroElId) {
        const api = global.SistemaLegalAPI;
        if (!api) {
            showLoginError(erroElId, 'Módulo de API não carregado. Verifique se api.js está incluído em index.html.');
            return false;
        }

        clearLoginError(erroElId);

        try {
            const data = await api.login(email, senha, perfil);
            const user = data.utilizador;
            const userPerfil = user && user.perfil;

            if (!userPerfil) {
                api.logout();
                showLoginError(erroElId, 'Resposta inválida do servidor.');
                return false;
            }

            if (typeof aplicarSessaoLogin === 'function') {
                const tipoUsuario = api.mapPerfilToTipoUsuario(userPerfil);
                const usuarioNome = user.nome || user.email || 'Utilizador';
                await aplicarSessaoLogin(tipoUsuario, usuarioNome, null, user);
            }

            global.location.href = getRedirectForPerfil(userPerfil);
            return true;
        } catch (err) {
            showLoginError(erroElId, (err && err.message) ? err.message : 'Erro ao iniciar sessão.');
            return false;
        }
    }

    global.SistemaLegalLogin = {
        efetuarLogin: efetuarLogin,
        showLoginError: showLoginError,
        clearLoginError: clearLoginError,
        getRedirectForPerfil: getRedirectForPerfil
    };
})(typeof window !== 'undefined' ? window : globalThis);
