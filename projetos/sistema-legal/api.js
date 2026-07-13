/**
 * Sistema Legal — cliente HTTP para a API Node.js (backend/).
 *
 * Uso:
 *   1. Arrancar o backend: cd backend && npm install && npm run seed && npm start
 *   2. API_BASE_URL: predefinição http://localhost:3001; em produção use
 *      <meta name="api-base-url" content="https://..."> ou window.API_BASE_URL
 *   3. Login admin: solicitadora@sistema-legal.pt / admin123 (perfil admin → admin.html)
 *   4. Login cliente: cliente@sistema-legal.pt / cliente123 (perfil cliente → cliente.html)
 *
 * O JWT fica em localStorage (chaves sl_api_token / sl_api_user).
 * O POST envia { email, password, perfil } para API_BASE_URL + '/api/login'.
 * Frontend :8000 e backend :3001 — sem proxy; URL resolvida por api.js (meta tag ou window.API_BASE_URL).
 */
(function (global) {
    'use strict';

    function resolveApiBaseUrl() {
        if (typeof global.API_BASE_URL === 'string' && global.API_BASE_URL.trim()) {
            return global.API_BASE_URL.trim().replace(/\/$/, '');
        }

        if (typeof document !== 'undefined') {
            const meta = document.querySelector('meta[name="api-base-url"]');
            if (meta && meta.content && meta.content.trim()) {
                return meta.content.trim().replace(/\/$/, '');
            }
        }

        return 'http://localhost:3001';
    }

    const API_BASE_URL = resolveApiBaseUrl();
    const TOKEN_KEY = 'sl_api_token';
    const USER_KEY = 'sl_api_user';

    function parseJsonSafe(raw, fallback) {
        if (raw == null || raw === '') return fallback;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function mapPerfilToTipoUsuario(perfil) {
        if (perfil === 'admin') return 'admin';
        if (perfil === 'cliente') return 'convidado';
        return '';
    }

    function getToken() {
        try {
            return localStorage.getItem(TOKEN_KEY) || '';
        } catch (e) {
            return '';
        }
    }

    function getCurrentUser() {
        try {
            return parseJsonSafe(localStorage.getItem(USER_KEY), null);
        } catch (e) {
            return null;
        }
    }

    function saveSession(token, utilizador) {
        try {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(utilizador));
        } catch (e) {
            console.warn('Não foi possível guardar sessão API:', e);
        }
    }

    function clearSession() {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        } catch (e) {
            console.warn('Não foi possível limpar sessão API:', e);
        }
    }

    function logout() {
        clearSession();
    }

    function isApiSessionActive() {
        return !!(getToken() && getCurrentUser());
    }

    async function login(email, password, perfil) {
        const emailNorm = (email || '').trim().toLowerCase();
        const passwordVal = password || '';
        const perfilVal = (perfil || '').trim().toLowerCase();

        if (!emailNorm || !passwordVal) {
            throw new Error('Email e senha são obrigatórios.');
        }

        if (!perfilVal) {
            throw new Error('Perfil de acesso é obrigatório.');
        }

        let response;
        try {
            response = await fetch(API_BASE_URL + '/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailNorm, password: passwordVal, perfil: perfilVal })
            });
        } catch (e) {
            throw new Error('Não foi possível contactar o servidor. Verifique se o backend está a correr em ' + API_BASE_URL + '.');
        }

        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            data = {};
        }

        if (!response.ok) {
            throw new Error(data.erro || 'Credenciais inválidas.');
        }

        if (!data.token || !data.utilizador) {
            throw new Error('Resposta inválida do servidor.');
        }

        saveSession(data.token, data.utilizador);
        return data;
    }

    async function apiFetch(path, options) {
        const opts = options || {};
        const headers = Object.assign({}, opts.headers || {});
        const token = getToken();

        if (token && !headers.Authorization) {
            headers.Authorization = 'Bearer ' + token;
        }

        if (opts.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const url = path.startsWith('http') ? path : API_BASE_URL + path;
        const response = await fetch(url, Object.assign({}, opts, { headers }));

        if (response.status === 401) {
            clearSession();
        }

        return response;
    }

    async function uploadDocument(processoId, file, visivelCliente, nome) {
        if (!processoId || !file) {
            throw new Error('Processo e ficheiro são obrigatórios.');
        }

        const formData = new FormData();
        formData.append('processo_id', String(processoId));
        formData.append('file', file);
        formData.append('visivel_cliente', visivelCliente ? '1' : '0');
        if (nome) {
            formData.append('nome_ficheiro', nome);
        }

        const headers = {};
        const token = getToken();
        if (token) {
            headers.Authorization = 'Bearer ' + token;
        }

        let response;
        try {
            response = await fetch(API_BASE_URL + '/api/documentos/upload', {
                method: 'POST',
                headers: headers,
                body: formData
            });
        } catch (e) {
            throw new Error('Não foi possível enviar o ficheiro. Verifique se o backend está a correr.');
        }

        if (response.status === 401) {
            clearSession();
        }

        return response;
    }

    function documentoUrl(url) {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        return API_BASE_URL + (url.startsWith('/') ? url : '/' + url);
    }

    const api = {
        API_BASE_URL: API_BASE_URL,
        TOKEN_KEY: TOKEN_KEY,
        USER_KEY: USER_KEY,
        login: login,
        logout: logout,
        getToken: getToken,
        getCurrentUser: getCurrentUser,
        isApiSessionActive: isApiSessionActive,
        mapPerfilToTipoUsuario: mapPerfilToTipoUsuario,
        apiFetch: apiFetch,
        uploadDocument: uploadDocument,
        documentoUrl: documentoUrl
    };

    global.SistemaLegalAPI = api;
})(typeof window !== 'undefined' ? window : globalThis);
