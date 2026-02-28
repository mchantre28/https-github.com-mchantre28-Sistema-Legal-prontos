// Teste de fumo - verifica que a página carrega e elementos principais existem
// Executar: npm test  ou  npx playwright test

const { test, expect } = require('@playwright/test');

test.describe('Sistema Legal - Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  });

  test('página carrega sem erros', async ({ page }) => {
    await expect(page).toHaveTitle(/Sistema Legal|Gestão Jurídica/i);
  });

  test('mostra ecrã de login ou sistema', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasLogin = await page.locator('text=Administrador').count() > 0;
    const hasSidebar = await page.locator('#sidebar, .sidebar').count() > 0;
    expect(hasLogin || hasSidebar).toBeTruthy();
  });
});

test.describe('Sistema Legal - Login', () => {
  test('login admin mostra dashboard', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    const btnAdmin = page.locator('button:has-text("Administrador")');
    if (await btnAdmin.isVisible()) {
      await btnAdmin.click();
      await page.waitForTimeout(500);
    }
    const form = page.locator('#formLoginAdmin');
    if (await form.isVisible()) {
      await page.fill('#usuario', 'admin');
      await page.fill('#senha', 'APM2024!');
      await page.click('#formLoginAdmin button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    const sidebar = page.locator('#sidebar, .sidebar');
    await expect(sidebar).toBeVisible({ timeout: 8000 });
    await expect(page.locator('a:has-text("Clientes")')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Sistema Legal - Pesquisa global', () => {
  test('campo de pesquisa existe após carregar', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const searchInput = page.locator('#globalSearchInput');
    await expect(searchInput).toBeAttached({ timeout: 8000 });
  });
});

test.describe('Sistema Legal - Navegação', () => {
  test('dashboard visível após login (navegação básica)', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);
    if (await page.locator('button:has-text("Administrador")').isVisible()) {
      await page.locator('button:has-text("Administrador")').click();
      await page.waitForTimeout(400);
      await page.fill('#usuario', 'admin');
      await page.fill('#senha', 'APM2024!');
      await page.click('#formLoginAdmin button[type="submit"]');
      await page.waitForTimeout(2500);
    }
    // Verificar que o conteúdo dinâmico mostra o dashboard (Honorários, Clientes, etc.)
    const content = page.locator('#conteudoDinamico');
    await expect(content).toContainText(/Honorários|Clientes|Dashboard|Resumo/i, { timeout: 8000 });
  });
});
