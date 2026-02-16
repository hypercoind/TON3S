use bech32::Hrp;
use k256::schnorr::{SigningKey, VerifyingKey};
use k256::schnorr::signature::hazmat::PrehashSigner;
use sha2::{Sha256, Digest};
use wasm_bindgen::prelude::*;
use zeroize::Zeroizing;
use std::sync::Mutex;

// Store raw key bytes so we can zeroize them on drop/clear.
// SigningKey doesn't implement Zeroize, so we keep the 32-byte secret
// in a Zeroizing wrapper and reconstruct SigningKey when needed.
static PRIVATE_KEY_BYTES: Mutex<Option<Zeroizing<[u8; 32]>>> = Mutex::new(None);

fn with_signing_key<F, T>(f: F) -> Result<T, JsValue>
where
    F: FnOnce(&SigningKey) -> Result<T, JsValue>,
{
    let guard = PRIVATE_KEY_BYTES.lock().unwrap();
    match guard.as_ref() {
        Some(bytes) => {
            let sk = SigningKey::from_bytes(bytes.as_ref())
                .map_err(|e| JsValue::from_str(&format!("Key error: {}", e)))?;
            f(&sk)
        }
        None => Err(JsValue::from_str("No key loaded")),
    }
}

/// Validate and store 32 raw key bytes. Shared by all import paths.
fn import_key_bytes(key_bytes: &[u8]) -> Result<(), JsValue> {
    if key_bytes.len() != 32 {
        return Err(JsValue::from_str("Private key must be 32 bytes"));
    }
    SigningKey::from_bytes(key_bytes)
        .map_err(|e| JsValue::from_str(&format!("Invalid private key: {}", e)))?;

    let mut buf = Zeroizing::new([0u8; 32]);
    buf.copy_from_slice(key_bytes);
    let mut guard = PRIVATE_KEY_BYTES.lock().unwrap();
    *guard = Some(buf);
    Ok(())
}

/// Import raw 32-byte private key (backward compatibility).
#[wasm_bindgen]
pub fn import_key(key_bytes: &[u8]) -> Result<(), JsValue> {
    import_key_bytes(key_bytes)
}

/// Import private key from nsec (bech32) string.
/// Decodes entirely in WASM — raw key bytes never touch JS.
#[wasm_bindgen]
pub fn import_nsec(nsec_str: &str) -> Result<(), JsValue> {
    let (hrp, data) = bech32::decode(nsec_str)
        .map_err(|_| JsValue::from_str("Invalid nsec format"))?;

    let expected = Hrp::parse_unchecked("nsec");
    if hrp != expected {
        return Err(JsValue::from_str("Invalid nsec prefix"));
    }

    import_key_bytes(&data)
}

/// Import private key from 64-char hex string.
/// Decodes entirely in WASM — raw key bytes never touch JS.
#[wasm_bindgen]
pub fn import_hex(hex_str: &str) -> Result<(), JsValue> {
    let mut decoded = Zeroizing::new([0u8; 32]);
    hex::decode_to_slice(hex_str, decoded.as_mut())
        .map_err(|_| JsValue::from_str("Invalid hex private key (expected 64 hex chars)"))?;

    import_key_bytes(decoded.as_ref())
}

#[wasm_bindgen]
pub fn derive_pubkey() -> Result<Vec<u8>, JsValue> {
    with_signing_key(|sk| {
        let vk: &VerifyingKey = sk.verifying_key();
        Ok(vk.to_bytes().to_vec())
    })
}

#[wasm_bindgen]
pub fn sign_hash(hash_bytes: &[u8]) -> Result<Vec<u8>, JsValue> {
    if hash_bytes.len() != 32 {
        return Err(JsValue::from_str("Hash must be 32 bytes"));
    }
    with_signing_key(|sk| {
        let sig = sk
            .sign_prehash(hash_bytes)
            .map_err(|e| JsValue::from_str(&format!("Signing failed: {}", e)))?;
        Ok(sig.to_bytes().to_vec())
    })
}

#[wasm_bindgen]
pub fn clear_key() {
    let mut guard = PRIVATE_KEY_BYTES.lock().unwrap();
    // Zeroizing<[u8; 32]> zeroes memory on drop
    drop(guard.take());
}

#[wasm_bindgen]
pub fn is_key_loaded() -> bool {
    let guard = PRIVATE_KEY_BYTES.lock().unwrap();
    guard.is_some()
}

#[wasm_bindgen]
pub fn sha256_hash(data: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}
