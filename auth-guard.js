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

    function loginRedirectForMissingSession(expectedPerfil) {
        // Área do cliente: ficar em cliente.html (login só de cliente).
        if (expectedPerfil === 'cliente') return null;
        return 'index.html';
    }

    async function requireAuth(expectedPerfil) {
        const api = global.SistemaLegalAPI;
        if (!api || !api.isApiSessionActive()) {
            const dest = loginRedirectForMissingSession(expectedPerfil);
            if (dest) global.location.href = dest;
            return null;
        }

        let response;
        try {
            response = await api.apiFetch('/api/me');
        } catch (e) {
            api.logout();
            const dest = loginRedirectForMissingSession(expectedPerfil);
            if (dest) global.location.href = dest;
            return null;
        }

        if (!response.ok) {
            api.logout();
            const dest = loginRedirectForMissingSession(expectedPerfil);
            if (dest) global.location.href = dest;
            return null;
        }

        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            api.logout();
            const dest = loginRedirectForMissingSession(expectedPerfil);
            if (dest) global.location.href = dest;
            return null;
        }

        const user = data.utilizador;
        if (!user || !user.perfil) {
            api.logout();
            const dest = loginRedirectForMissingSession(expectedPerfil);
            if (dest) global.location.href = dest;
            return null;
        }

        if (api.updateCurrentUser) {
            api.updateCurrentUser(user);
        }

        if (expectedPerfil && user.perfil !== expectedPerfil) {
            global.location.href = redirectForPerfil(user.perfil);
            return null;
        }

        return user;
    }

    function logout(redirectTo) {
        const api = global.SistemaLegalAPI;
        let perfil = null;
        try {
            const user = api && api.getCurrentUser ? api.getCurrentUser() : null;
            perfil = user && user.perfil;
        } catch (e) {
            /* ignorar */
        }
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
        if (redirectTo) {
            global.location.href = redirectTo;
            return;
        }
        global.location.href = perfil === 'cliente' ? 'cliente.html' : 'index.html';
    }

    global.SistemaLegalAuth = {
        requireAuth: requireAuth,
        logout: logout,
        redirectClienteFromFullSystem: redirectClienteFromFullSystem,
        userMustChangePassword: function () {
            const api = global.SistemaLegalAPI;
            if (api && api.userMustChangePassword) return api.userMustChangePassword();
            const user = api && api.getCurrentUser ? api.getCurrentUser() : null;
            return !!(user && user.must_change_password);
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
