import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Must import fresh instance per test, so we test the class directly
import { ToastManager } from '../Toast.js';

describe('ToastManager', () => {
    let manager;

    beforeEach(() => {
        vi.useFakeTimers();
        manager = new ToastManager();
    });

    afterEach(() => {
        manager.destroy();
        vi.useRealTimers();
    });

    describe('tag support', () => {
        it('should track tagged toast in taggedToasts Map', () => {
            manager.show('Theme A', { tag: 'theme' });
            expect(manager.taggedToasts.has('theme')).toBe(true);
            expect(manager.taggedToasts.get('theme').element).toBeTruthy();
        });

        it('should set data-tag attribute on tagged toast element', () => {
            const el = manager.show('Theme A', { tag: 'theme' });
            expect(el.dataset.tag).toBe('theme');
        });

        it('should update text in-place for same tag', () => {
            const el1 = manager.show('Theme A', { tag: 'theme', duration: 1500 });
            const el2 = manager.show('Theme B', { tag: 'theme', duration: 1500 });

            // Same element returned
            expect(el2).toBe(el1);
            // Text updated
            expect(el1.querySelector('.toast-message').textContent).toBe('Theme B');
            // Only one toast in DOM
            expect(manager.toasts.length).toBe(1);
            expect(manager.container.querySelectorAll('.toast').length).toBe(1);
        });

        it('should reset timer on tagged update', () => {
            manager.show('Theme A', { tag: 'theme', duration: 1000 });

            // Advance 800ms (almost expired)
            vi.advanceTimersByTime(800);

            // Update resets the timer
            manager.show('Theme B', { tag: 'theme', duration: 1000 });

            // Advance another 800ms — old timer would have fired at 1000ms total
            vi.advanceTimersByTime(800);

            // Toast should still be in DOM (new timer hasn't expired yet)
            expect(manager.container.contains(manager.taggedToasts.get('theme').element)).toBe(
                true
            );

            // Advance remaining 200ms + 300ms for dismiss animation
            vi.advanceTimersByTime(500);
            expect(manager.taggedToasts.has('theme')).toBe(false);
        });

        it('should allow multiple different tags to coexist', () => {
            manager.show('Theme A', { tag: 'theme', duration: 1500 });
            manager.show('Font A', { tag: 'font', duration: 1500 });

            expect(manager.taggedToasts.size).toBe(2);
            expect(manager.toasts.length).toBe(2);
            expect(manager.container.querySelectorAll('.toast').length).toBe(2);
        });

        it('should clean up Map entry on dismiss', () => {
            const el = manager.show('Theme A', { tag: 'theme', duration: 0 });
            expect(manager.taggedToasts.has('theme')).toBe(true);

            manager.dismiss(el);
            expect(manager.taggedToasts.has('theme')).toBe(false);
        });

        it('should clear all tagged timers on destroy', () => {
            manager.show('Theme A', { tag: 'theme', duration: 5000 });
            manager.show('Font A', { tag: 'font', duration: 5000 });

            const clearSpy = vi.spyOn(global, 'clearTimeout');
            manager.destroy();

            // Both timers should be cleared
            expect(clearSpy).toHaveBeenCalledTimes(2);
            expect(manager.taggedToasts.size).toBe(0);
            clearSpy.mockRestore();
        });
    });

    describe('untagged toasts (backward compat)', () => {
        it('should not track untagged toasts in taggedToasts Map', () => {
            manager.show('Hello');
            expect(manager.taggedToasts.size).toBe(0);
            expect(manager.toasts.length).toBe(1);
        });

        it('should stack multiple untagged toasts', () => {
            manager.show('First');
            manager.show('Second');
            manager.show('Third');

            expect(manager.toasts.length).toBe(3);
            expect(manager.container.querySelectorAll('.toast').length).toBe(3);
        });

        it('should not interfere with tagged toasts', () => {
            manager.show('Untagged');
            manager.show('Tagged', { tag: 'test' });
            manager.show('Another untagged');

            expect(manager.toasts.length).toBe(3);
            expect(manager.taggedToasts.size).toBe(1);
        });
    });

    describe('convenience methods with tags', () => {
        it('should pass tag through info()', () => {
            const el = manager.info('Theme A', { duration: 1500, tag: 'theme' });
            expect(el.dataset.tag).toBe('theme');
            expect(manager.taggedToasts.has('theme')).toBe(true);
        });

        it('should pass tag through success()', () => {
            const el = manager.success('Saved', { tag: 'save' });
            expect(el.dataset.tag).toBe('save');
        });

        it('should pass tag through warning()', () => {
            const el = manager.warning('Caution', { tag: 'warn' });
            expect(el.dataset.tag).toBe('warn');
        });

        it('should pass tag through error()', () => {
            const el = manager.error('Failed', { tag: 'err' });
            expect(el.dataset.tag).toBe('err');
        });
    });
});
