import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    MOBILE_BREAKPOINT,
    isMobileViewport,
    hasTouchInput,
    shouldDisableAutoZen
} from '../device.js';

describe('device utils', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        delete window.ontouchstart;
    });

    describe('isMobileViewport', () => {
        it('returns true at or below mobile breakpoint', () => {
            vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(MOBILE_BREAKPOINT);
            expect(isMobileViewport()).toBe(true);
        });

        it('returns false above mobile breakpoint', () => {
            vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(MOBILE_BREAKPOINT + 1);
            expect(isMobileViewport()).toBe(false);
        });
    });

    describe('hasTouchInput', () => {
        it('returns true when coarse pointer media query matches', () => {
            vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
                matches: query === '(pointer: coarse)',
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }));
            vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(0);

            expect(hasTouchInput()).toBe(true);
        });

        it('returns true when touch points are available', () => {
            vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }));
            vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(5);

            expect(hasTouchInput()).toBe(true);
        });

        it('returns false when no touch signals are present', () => {
            vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }));
            vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(0);

            expect(hasTouchInput()).toBe(false);
        });
    });

    describe('shouldDisableAutoZen', () => {
        it('returns true on narrow viewport', () => {
            vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(480);
            vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }));
            vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(0);

            expect(shouldDisableAutoZen()).toBe(true);
        });

        it('returns true with touch support on wide viewport', () => {
            vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
            vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }));
            vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(2);

            expect(shouldDisableAutoZen()).toBe(true);
        });

        it('returns false on wide non-touch desktop', () => {
            vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
            vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn()
            }));
            vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(0);

            expect(shouldDisableAutoZen()).toBe(false);
        });
    });
});
