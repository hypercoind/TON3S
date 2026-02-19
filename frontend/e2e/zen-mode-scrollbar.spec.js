import { expect, test } from '@playwright/test';

const ZEN_TRANSITION_SNAPSHOT_DELAY_MS = 120;
const ZEN_SETTLED_SNAPSHOT_DELAY_MS = 900;

function getRightEdgeClip(page, width = 24) {
    const viewport = page.viewportSize();
    if (!viewport) {
        throw new Error('Viewport is unavailable');
    }
    return {
        x: viewport.width - width,
        y: 0,
        width,
        height: viewport.height
    };
}

test.describe('Zen mode scrollbar regression', () => {
    test('does not introduce page scroll overflow during enter and exit transitions', async ({ page }) => {
        await page.goto('/');

        const editor = page.locator('.editor');
        await expect(editor).toBeVisible();

        // Wait until startup overlay is no longer visible.
        const loadingOverlay = page.locator('#loading-overlay');
        await expect(loadingOverlay).toHaveCount(0);

        const body = page.locator('body');
        await expect(body).not.toHaveClass(/zen-mode/);

        await expect(page).toHaveScreenshot('zen-idle-right-edge.png', {
            clip: getRightEdgeClip(page),
            animations: 'disabled',
            caret: 'hide'
        });

        await editor.click();
        await page.keyboard.type('Zen mode overflow regression.');

        // Auto-zen activates after a 3s typing delay.
        await expect(body).toHaveClass(/zen-mode/, { timeout: 6000 });

        await page.waitForTimeout(ZEN_TRANSITION_SNAPSHOT_DELAY_MS);
        await expect(page).toHaveScreenshot('zen-enter-transition-right-edge.png', {
            clip: getRightEdgeClip(page),
            animations: 'allow',
            caret: 'hide'
        });

        await page.waitForTimeout(ZEN_SETTLED_SNAPSHOT_DELAY_MS);
        await expect(page).toHaveScreenshot('zen-enter-right-edge.png', {
            clip: getRightEdgeClip(page),
            animations: 'disabled',
            caret: 'hide'
        });

        // Mouse movement over 50px exits zen mode.
        await page.mouse.move(5, 5);
        await page.mouse.move(350, 350);
        await expect(body).not.toHaveClass(/zen-mode/, { timeout: 4000 });

        await page.waitForTimeout(ZEN_TRANSITION_SNAPSHOT_DELAY_MS);
        await expect(page).toHaveScreenshot('zen-exit-transition-right-edge.png', {
            clip: getRightEdgeClip(page),
            animations: 'allow',
            caret: 'hide'
        });

        await page.waitForTimeout(ZEN_SETTLED_SNAPSHOT_DELAY_MS);
        await expect(page).toHaveScreenshot('zen-exit-right-edge.png', {
            clip: getRightEdgeClip(page),
            animations: 'disabled',
            caret: 'hide'
        });
    });
});
