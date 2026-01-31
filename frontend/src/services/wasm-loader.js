/**
 * WASM Signing Module Loader
 * Feature-detects WebAssembly support and dynamically loads the signing module
 */

let wasmModule = null;
let wasmAvailable = false;

/**
 * Load the WASM signing module
 * @returns {Promise<object|null>} The WASM module or null if unavailable
 */
export async function loadWasmModule() {
    if (wasmModule) {
        return wasmModule;
    }

    if (typeof WebAssembly === 'undefined') {
        console.warn('[WASM] WebAssembly not supported in this browser');
        return null;
    }

    try {
        const mod = await import('../../wasm/pkg/ton3s_signer.js');
        await mod.default();
        wasmModule = mod;
        wasmAvailable = true;
        console.log('[WASM] Signing module loaded');
        return mod;
    } catch (error) {
        console.warn('[WASM] Failed to load signing module, falling back to JS:', error.message);
        return null;
    }
}

/**
 * Get the loaded WASM module (null if not loaded)
 */
export function getWasmModule() {
    return wasmModule;
}

/**
 * Check if WASM signing is available
 */
export function isWasmAvailable() {
    return wasmAvailable;
}
