/**
 * Device capability helpers
 */

export const MOBILE_BREAKPOINT = 1024;

export function isMobileViewport() {
    if (typeof window === 'undefined') {
        return false;
    }
    return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function hasTouchInput() {
    if (typeof window === 'undefined') {
        return false;
    }

    const supportsCoarsePointer =
        typeof window.matchMedia === 'function' &&
        (window.matchMedia('(pointer: coarse)').matches ||
            window.matchMedia('(any-pointer: coarse)').matches ||
            window.matchMedia('(hover: none)').matches);

    const touchEventSupport = 'ontouchstart' in window;
    const maxTouchPoints = window.navigator?.maxTouchPoints || 0;

    return supportsCoarsePointer || touchEventSupport || maxTouchPoints > 0;
}

/**
 * Auto-zen is desktop-focused and should be disabled for mobile/touch contexts.
 */
export function shouldDisableAutoZen() {
    return isMobileViewport() || hasTouchInput();
}
