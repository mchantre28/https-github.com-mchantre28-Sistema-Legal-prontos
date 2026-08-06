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

    function normalizeBaseUrl(raw) {
        const trimmed = String(raw || '').trim();
        if (!trimmed) return '';
        return trimmed.replace(/\/$/, '');
    }

    function isLocalPageHost() {
        if (typeof location === 'undefined') return false;
        const host = (location.hostname || '').toLowerCase();
        return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    }

    /** App Capacitor no telemóvel — localhost do WebView não é o PC. */
    function isCapacitorNative() {
        if (global.Capacitor && typeof global.Capacitor.isNativePlatform === 'function') {
            return global.Capacitor.isNativePlatform();
        }
        if (typeof location !== 'undefined') {
            const protocol = (location.protocol || '').toLowerCase();
            return protocol === 'capacitor:' || protocol === 'ionic:';
        }
        return false;
    }

    function resolveApiBaseUrl() {
        const fromWindow = normalizeBaseUrl(global.API_BASE_URL);
        if (fromWindow) return fromWindow;

        if (typeof document !== 'undefined') {
            const meta = document.querySelector('meta[name="api-base-url"]');
            const fromMeta = normalizeBaseUrl(meta && meta.content);
            if (fromMeta) return fromMeta;
        }

        // Em localhost no browser do PC, priorizar backend local (:3001).
        if (isLocalPageHost() && !isCapacitorNative()) {
            return 'http://localhost:3001';
        }

        if (isCapacitorNative()) {
            return 'https://sistema-legal-api.onrender.com';
        }

        return 'http://localhost:3001';
    }

    function isLocalApiUrl(url) {
        return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/i.test(url || '');
    }

    function isGithubPagesHost() {
        if (typeof location === 'undefined') return false;
        return /\.github\.io$/i.test(location.hostname || '');
    }

    function isApiConfiguredForProduction() {
        return !!API_BASE_URL && !isLocalApiUrl(API_BASE_URL);
    }

    function getDeploymentHint() {
        if (!isGithubPagesHost() || isApiConfiguredForProduction()) return '';
        return 'GitHub Pages só serve o frontend estático. Para o login funcionar, publique o backend no Railway/Render '
            + 'e configure <meta name="api-base-url" content="https://sua-api..."> em index.html, admin.html e cliente.html. '
            + 'Em desenvolvimento local use http://localhost:8000 com START-SISTEMA.bat.';
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getLoginConnectionHintHtml() {
        const pageOrigin = typeof location !== 'undefined' ? location.origin : '';
        const apiUrl = API_BASE_URL;
        let html = '<div class="mt-6 text-center text-sm text-gray-600">';
        html += '<p><strong>Acesso Restrito</strong></p>';
        if (isLocalPageHost()) {
            html += '<p>Modo local: execute <strong>START-SISTEMA.bat</strong> (backend :3001 + frontend :8000)</p>';
        }
        html += '<p>Frontend: <strong>' + escapeHtml(pageOrigin || '—') + '</strong></p>';
        html += '<p>API: <strong>' + escapeHtml(apiUrl || '—') + '</strong></p>';
        html += '</div>';
        return html;
    }

    function getGithubPagesLoginHintHtml() {
        const hint = getDeploymentHint();
        if (!hint) return '';
        return '<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs text-left" role="status">'
            + '<strong>GitHub Pages:</strong> ' + escapeHtml(hint) + '</div>';
    }

    function showGithubPagesBanner() {
        if (typeof document === 'undefined') return;
        if (document.body && document.body.classList.contains('admin-page')) return;
        const hint = getDeploymentHint();
        if (!hint) return;
        const run = function () {
            if (!document.body || document.getElementById('sl-github-pages-banner')) return;
            const el = document.createElement('div');
            el.id = 'sl-github-pages-banner';
            el.setAttribute('role', 'status');
            el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#fef3c7;border-bottom:1px solid #f59e0b;color:#92400e;padding:10px 16px;font-size:13px;line-height:1.4;text-align:center;';
            el.textContent = hint;
            document.body.insertBefore(el, document.body.firstChild);
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    function describeFetchFailure(requestUrl, err) {
        const apiUrl = requestUrl || API_BASE_URL;
        const pageProtocol = typeof location !== 'undefined' ? location.protocol : '';
        const pageHost = typeof location !== 'undefined' ? location.hostname : '';
        const pageOrigin = typeof location !== 'undefined' ? location.origin : '';

        if (pageProtocol === 'file:') {
            return 'Abriu o sistema por file:// — o browser bloqueia ligações à API. '
                + 'Feche esta janela, execute START-SISTEMA.bat e use http://localhost:8000';
        }

        const remotePage = pageHost
            && pageHost !== 'localhost'
            && pageHost !== '127.0.0.1'
            && pageHost !== '[::1]';

        if (remotePage && isLocalApiUrl(apiUrl) && !isCapacitorNative()) {
            const githubNote = isGithubPagesHost()
                ? ' No GitHub Pages é obrigatório publicar o backend (Railway/Render) e definir api-base-url nos HTML.'
                : '';
            return 'Está em ' + pageOrigin + ' mas a API aponta para ' + apiUrl + '. '
                + 'localhost só funciona no seu PC com o backend local. '
                + 'Em produção, configure <meta name="api-base-url" content="https://seu-backend..."> '
                + 'com o URL público do Railway/Render.' + githubNote;
        }

        if (!apiUrl || !/^https?:\/\//i.test(apiUrl)) {
            return 'URL da API inválida ("' + apiUrl + '"). '
                + 'Verifique a meta tag api-base-url ou window.API_BASE_URL.';
        }

        const detail = err && err.message ? ' (' + err.message + ')' : '';
        return 'Não foi possível contactar o servidor em ' + apiUrl + '. '
            + 'Execute START-SISTEMA.bat (arranca backend :3001 e frontend :8000) '
            + 'ou manualmente: cd backend && npm start' + detail;
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
            throw new Error(describeFetchFailure(API_BASE_URL + '/api/login', e));
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
            throw new Error(describeFetchFailure(API_BASE_URL + '/api/documentos/upload', e));
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

    async function checkHealth() {
        try {
            const response = await fetch(API_BASE_URL + '/api/health', { method: 'GET' });
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    async function createClienteAccount(payload) {
        return apiFetch('/api/clientes', {
            method: 'POST',
            body: JSON.stringify(payload || {})
        });
    }

    async function resetClientePassword(email) {
        return apiFetch('/api/clientes/gerar-password', {
            method: 'POST',
            body: JSON.stringify({ email: String(email || '').trim().toLowerCase() })
        });
    }

    async function lookupClienteByEmail(email) {
        const q = encodeURIComponent(String(email || '').trim().toLowerCase());
        return apiFetch('/api/clientes/lookup?email=' + q);
    }

    function updateCurrentUser(patch) {
        const current = getCurrentUser();
        if (!current) return null;
        const next = Object.assign({}, current, patch || {});
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(next));
        } catch (e) {
            console.warn('Não foi possível actualizar sessão API:', e);
        }
        return next;
    }

    function userMustChangePassword() {
        const user = getCurrentUser();
        return !!(user && user.must_change_password);
    }

    async function changePassword(passwordAtual, passwordNova) {
        return apiFetch('/api/password/alterar', {
            method: 'POST',
            body: JSON.stringify({
                password_atual: passwordAtual,
                password_nova: passwordNova
            })
        });
    }

    async function recoverPassword(email) {
        const emailNorm = String(email || '').trim().toLowerCase();
        if (!emailNorm) {
            throw new Error('Email é obrigatório.');
        }
        let response;
        try {
            response = await fetch(API_BASE_URL + '/api/password/recuperar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailNorm })
            });
        } catch (e) {
            throw new Error(describeFetchFailure(API_BASE_URL + '/api/password/recuperar', e));
        }
        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            data = {};
        }
        if (!response.ok) {
            throw new Error(data.erro || 'Não foi possível recuperar a password.');
        }
        return data;
    }

    showGithubPagesBanner();

    const api = {
        API_BASE_URL: API_BASE_URL,
        TOKEN_KEY: TOKEN_KEY,
        USER_KEY: USER_KEY,
        isGithubPagesHost: isGithubPagesHost,
        isApiConfiguredForProduction: isApiConfiguredForProduction,
        getDeploymentHint: getDeploymentHint,
        getLoginConnectionHintHtml: getLoginConnectionHintHtml,
        getGithubPagesLoginHintHtml: getGithubPagesLoginHintHtml,
        isLocalPageHost: isLocalPageHost,
        checkHealth: checkHealth,
        describeFetchFailure: describeFetchFailure,
        login: login,
        logout: logout,
        getToken: getToken,
        getCurrentUser: getCurrentUser,
        isApiSessionActive: isApiSessionActive,
        mapPerfilToTipoUsuario: mapPerfilToTipoUsuario,
        apiFetch: apiFetch,
        uploadDocument: uploadDocument,
        documentoUrl: documentoUrl,
        createClienteAccount: createClienteAccount,
        resetClientePassword: resetClientePassword,
        lookupClienteByEmail: lookupClienteByEmail,
        changePassword: changePassword,
        recoverPassword: recoverPassword,
        updateCurrentUser: updateCurrentUser,
        userMustChangePassword: userMustChangePassword
    };

    global.SistemaLegalAPI = api;
})(typeof window !== 'undefined' ? window : globalThis);
