use k256::schnorr::{SigningKey, VerifyingKey};
use k256::schnorr::signature::hazmat::PrehashSigner;
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

#[wasm_bindgen]
pub fn import_key(key_bytes: &[u8]) -> Result<(), JsValue> {
    if key_bytes.len() != 32 {
        return Err(JsValue::from_str("Private key must be 32 bytes"));
    }
    // Validate the key is usable before storing
    SigningKey::from_bytes(key_bytes)
        .map_err(|e| JsValue::from_str(&format!("Invalid private key: {}", e)))?;

    let mut buf = [0u8; 32];
    buf.copy_from_slice(key_bytes);
    let mut guard = PRIVATE_KEY_BYTES.lock().unwrap();
    *guard = Some(Zeroizing::new(buf));
    Ok(())
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
