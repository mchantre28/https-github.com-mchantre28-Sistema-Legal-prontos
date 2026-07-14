// Testes de fumo — carregamento da página de entrada (sem login API)
// Login e segurança: tests/api-login.spec.cjs, tests/api-client-security.spec.cjs

const { test, expect } = require('@playwright/test');

test.describe('Sistema Legal - Smoke', () => {
  test('página carrega sem erros', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Sistema Legal|Gestão Jurídica/i);
  });

  test('raiz / redireciona para login (sem listagem de diretório)', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).not.toContainText(/Index of/i);
    await expect(page.locator('button:has-text("Administrador")')).toBeVisible({ timeout: 10000 });
  });

  test('index.html carrega sem erros', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Sistema Legal|Gestão Jurídica/i);
  });

  test('mostra ecrã de seleção de acesso', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('button:has-text("Administrador")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Cliente")')).toBeVisible();
  });
});
