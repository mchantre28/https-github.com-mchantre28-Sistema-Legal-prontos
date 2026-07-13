// Testes de login API + área do cliente
const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:8000';
const API = 'http://localhost:3001';

test.describe('Login API', () => {
  test('admin redireciona para admin.html', async ({ page }) => {
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const btnAdmin = page.locator('button:has-text("Administrador")');
    await expect(btnAdmin).toBeVisible({ timeout: 10000 });
    await btnAdmin.click();

    await page.fill('#emailAdmin', 'solicitadora@sistema-legal.pt');
    await page.fill('#senhaAdmin', 'admin123');
    await page.click('#btnEntrarAdmin');

    await page.waitForURL('**/admin.html', { timeout: 10000 });
    await expect(page).toHaveURL(/admin\.html/);
    await expect(page.locator('text=Área Administrativa')).toBeVisible({ timeout: 5000 });
  });

  test('cliente redireciona para cliente.html com processos', async ({ page }) => {
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const btnCliente = page.locator('button:has-text("Cliente")');
    await expect(btnCliente).toBeVisible({ timeout: 10000 });
    await btnCliente.click();

    await page.fill('#emailCliente', 'cliente@sistema-legal.pt');
    await page.fill('#senhaCliente', 'cliente123');
    await page.click('#btnEntrarCliente');

    await page.waitForURL('**/cliente.html', { timeout: 10000 });
    await expect(page.locator('#welcome')).toContainText(/João Silva|cliente@sistema-legal\.pt/i);
    await expect(page.locator('text=HER-2026-0001')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Herança — Espólio de Maria Santos')).toBeVisible();
    await expect(page.locator('text=Em tramitação')).toBeVisible();
    await expect(page.getByText(/Trâmites \(\d+ registados?\)|Trâmites \(1 registado\)/i)).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Abertura do processo')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=requerimento-abertura.pdf')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=notas-internas-solicitadora.pdf')).toHaveCount(0);
  });

  test('credenciais erradas mostram erro e mantêm modal', async ({ page }) => {
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    await page.locator('button:has-text("Cliente")').click();
    await page.fill('#emailCliente', 'cliente@sistema-legal.pt');
    await page.fill('#senhaCliente', 'senhaerrada');
    await page.click('#btnEntrarCliente');

    await page.waitForTimeout(1500);
    const erro = page.locator('#erroLoginCliente');
    await expect(erro).toBeVisible();
    await expect(erro).toContainText(/inválid|Credenciais/i);
    await expect(page.locator('#formLoginCliente')).toBeVisible();
    expect(page.url()).not.toMatch(/cliente\.html/);
  });
});
