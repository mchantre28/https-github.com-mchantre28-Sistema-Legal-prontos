// Testes de isolamento de dados entre clientes (403 cross-client)
const { test, expect } = require('@playwright/test');

const API = 'http://localhost:3001';

async function apiLogin(email, password, perfil) {
  const res = await fetch(API + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, perfil }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function apiGet(path, token) {
  const res = await fetch(API + path, {
    headers: { Authorization: 'Bearer ' + token },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

test.describe('Segurança API — isolamento entre clientes', () => {
  test('cliente A não acede a processo do cliente B (403)', async () => {
    const admin = await apiLogin('solicitadora@sistema-legal.pt', 'admin123', 'admin');
    expect(admin.ok, 'login admin').toBeTruthy();

    const todos = await apiGet('/api/processos', admin.data.token);
    expect(todos.ok).toBeTruthy();

    const processos = todos.data.processos || [];
    const processoCliente1 = processos.find((p) => p.numero_processo === 'HER-2026-0001');
    const processoCliente2 = processos.find((p) => p.numero_processo === 'CON-2026-0001');

    test.skip(!processoCliente1 || !processoCliente2, 'Requer seed com dois clientes (apague backend/data/sistema-legal.db e execute npm run seed)');

    const cliente1 = await apiLogin('cliente@sistema-legal.pt', 'cliente123', 'cliente');
    expect(cliente1.ok).toBeTruthy();

    const tokenA = cliente1.data.token;

    const resProcesso = await apiGet('/api/processos/' + processoCliente2.id, tokenA);
    expect(resProcesso.status).toBe(403);
    expect(resProcesso.data.erro).toMatch(/permissão|Sem permissão/i);

    const resTramites = await apiGet('/api/tramites?processo_id=' + processoCliente2.id, tokenA);
    expect(resTramites.status).toBe(403);

    const resDocumentos = await apiGet('/api/documentos?processo_id=' + processoCliente2.id, tokenA);
    expect(resDocumentos.status).toBe(403);

    const meus = await apiGet('/api/processos', tokenA);
    expect(meus.ok).toBeTruthy();
    const ids = (meus.data.processos || []).map((p) => p.id);
    expect(ids).toContain(processoCliente1.id);
    expect(ids).not.toContain(processoCliente2.id);
  });

  test('cliente só vê documentos visivel_cliente=true', async () => {
    const cliente1 = await apiLogin('cliente@sistema-legal.pt', 'cliente123', 'cliente');
    expect(cliente1.ok).toBeTruthy();

    const admin = await apiLogin('solicitadora@sistema-legal.pt', 'admin123', 'admin');
    const todos = await apiGet('/api/processos', admin.data.token);
    const processoCliente1 = (todos.data.processos || []).find((p) => p.numero_processo === 'HER-2026-0001');
    test.skip(!processoCliente1, 'Processo HER-2026-0001 em falta no seed');

    const resCliente = await apiGet('/api/documentos?processo_id=' + processoCliente1.id, cliente1.data.token);
    expect(resCliente.ok).toBeTruthy();
    const docsCliente = resCliente.data.documentos || [];
    expect(docsCliente.every((d) => d.visivel_cliente === 1)).toBeTruthy();
    expect(docsCliente.some((d) => d.nome_ficheiro === 'requerimento-abertura.pdf')).toBeTruthy();
    expect(docsCliente.some((d) => d.nome_ficheiro === 'notas-internas-solicitadora.pdf')).toBeFalsy();

    const resAdmin = await apiGet('/api/documentos?processo_id=' + processoCliente1.id, admin.data.token);
    expect(resAdmin.ok).toBeTruthy();
    expect((resAdmin.data.documentos || []).length).toBeGreaterThanOrEqual(2);
  });
});
