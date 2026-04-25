import { test, expect } from '@playwright/test';

/**
 * Smoke test: o app carrega a tela de login.
 * Pre-condicao: backend rodando em 127.0.0.1:3001 (ou USE_MOCK ativo).
 */
test('tela de login carrega com campos esperados', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveURL(/\/login/);
  // Tolerante a variacoes de label — busca campos por type/role.
  await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"], input[name="senha"]')).toBeVisible();
});

test('redireciona / para /login quando nao autenticado', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});
