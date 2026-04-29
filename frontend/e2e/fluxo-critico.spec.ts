import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@solutionticket.com';
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_DEFAULT_PASSWORD ?? 'admin123';

/**
 * Testes E2E de fluxos críticos do Solution Ticket.
 *
 * Pre-condicoes:
 * - Frontend rodando em http://127.0.0.1:3000
 * - Se backend nao estiver disponivel, o frontend deve estar em modo mock
 *   (NEXT_PUBLIC_ENABLE_LOCAL_MOCKS=true) para que estes smoke tests de UI passem.
 *
 * Para rodar com backend real:
 *   1. Inicie backend: pnpm --filter ./backend start
 *   2. Inicie frontend: pnpm --filter ./frontend start
 *   3. Rode: pnpm --filter ./frontend test:e2e
 */

test.describe('Autenticacao', () => {
  test('login com credenciais validas redireciona para area autenticada', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"], input[name="senha"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 });
    await expect(page.locator('text=/ticket|pesagem|balanca|cliente/i').first()).toBeVisible();
  });

  test('login com senha invalida mostra erro', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@solutionticket.com');
    await page.fill('input[type="password"], input[name="senha"]', 'senha-errada');
    await page.click('button[type="submit"]');

    // Verifica que permanece na tela de login ou mostra toast/erro
    await expect(page.locator('text=/senha|credenciais|invalido|erro/i').first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Navegacao pos-login', () => {
  test.beforeEach(async ({ page }) => {
    // Realiza login rapido antes de cada teste
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"], input[name="senha"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 });
  });

  test('home autenticada carrega KPIs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/pesagens|ticket|balanca|cliente/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('listagem de tickets carrega', async ({ page }) => {
    await page.goto('/tickets');
    await expect(
      page.locator('table, [role="table"], .ticket-list, .data-grid').first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test('cadastro de clientes carrega', async ({ page }) => {
    await page.goto('/cadastros/clientes');
    await expect(page.locator('table, [role="table"], .cliente-list').first()).toBeVisible({
      timeout: 5000,
    });
  });
});
