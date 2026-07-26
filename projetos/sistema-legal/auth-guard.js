/**
 * Sistema Legal — verificação de sessão JWT para admin.html / cliente.html.
 */
(function (global) {
    'use strict';

    /** Redireciona utilizadores API com perfil cliente para cliente.html (bloqueia index.html). */
    function redirectClienteFromFullSystem() {
        const api = global.SistemaLegalAPI;
        if (api && api.isApiSessionActive && api.isApiSessionActive()) {
            const user = api.getCurrentUser();
            if (user && user.perfil === 'cliente') {
                global.location.replace('cliente.html');
                return true;
            }
            return false;
        }
        try {
            const token = localStorage.getItem('sl_api_token');
            const raw = localStorage.getItem('sl_api_user');
            if (!token || !raw) return false;
            const user = JSON.parse(raw);
            if (user && user.perfil === 'cliente') {
                global.location.replace('cliente.html');
                return true;
            }
        } catch (e) {
            /* ignorar */
        }
        return false;
    }

    function redirectForPerfil(perfil) {
        if (perfil === 'cliente') return 'cliente.html';
        if (perfil === 'admin') return 'admin.html';
        return 'index.html';
    }

    async function requireAuth(expectedPerfil) {
        const api = global.SistemaLegalAPI;
        if (!api || !api.isApiSessionActive()) {
            global.location.href = 'index.html';
            return null;
        }

        let response;
        try {
            response = await api.apiFetch('/api/me');
        } catch (e) {
            api.logout();
            global.location.href = 'index.html';
            return null;
        }

        if (!response.ok) {
            api.logout();
            global.location.href = 'index.html';
            return null;
        }

        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            api.logout();
            global.location.href = 'index.html';
            return null;
        }

        const user = data.utilizador;
        if (!user || !user.perfil) {
            api.logout();
            global.location.href = 'index.html';
            return null;
        }

        if (expectedPerfil && user.perfil !== expectedPerfil) {
            global.location.href = redirectForPerfil(user.perfil);
            return null;
        }

        return user;
    }

    function logout() {
        const api = global.SistemaLegalAPI;
        if (api && api.logout) api.logout();
        try {
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('tipoUsuario');
            localStorage.removeItem('usuarioNome');
            localStorage.removeItem('apiUserId');
            localStorage.removeItem('convidadoId');
        } catch (e) {
            /* ignorar */
        }
        global.location.href = 'index.html';
    }

    global.SistemaLegalAuth = {
        requireAuth: requireAuth,
        logout: logout,
        redirectClienteFromFullSystem: redirectClienteFromFullSystem
    };
})(typeof window !== 'undefined' ? window : globalThis);
