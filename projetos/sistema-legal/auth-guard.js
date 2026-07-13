/**
 * Sistema Legal — verificação de sessão JWT para admin.html / cliente.html.
 */
(function (global) {
    'use strict';

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
            api.logout();
            global.location.href = 'index.html';
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
        logout: logout
    };
})(typeof window !== 'undefined' ? window : globalThis);
