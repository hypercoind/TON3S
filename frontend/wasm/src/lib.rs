use k256::schnorr::{SigningKey, VerifyingKey};
use k256::schnorr::signature::hazmat::PrehashSigner;
use wasm_bindgen::prelude::*;
use std::sync::Mutex;

static PRIVATE_KEY: Mutex<Option<SigningKey>> = Mutex::new(None);

#[wasm_bindgen]
pub fn import_key(key_bytes: &[u8]) -> Result<(), JsValue> {
    if key_bytes.len() != 32 {
        return Err(JsValue::from_str("Private key must be 32 bytes"));
    }
    let sk = SigningKey::from_bytes(key_bytes)
        .map_err(|e| JsValue::from_str(&format!("Invalid private key: {}", e)))?;
    let mut guard = PRIVATE_KEY.lock().unwrap();
    *guard = Some(sk);
    Ok(())
}

#[wasm_bindgen]
pub fn derive_pubkey() -> Result<Vec<u8>, JsValue> {
    let guard = PRIVATE_KEY.lock().unwrap();
    match guard.as_ref() {
        Some(sk) => {
            let vk: &VerifyingKey = sk.verifying_key();
            Ok(vk.to_bytes().to_vec())
        }
        None => Err(JsValue::from_str("No key loaded")),
    }
}

#[wasm_bindgen]
pub fn sign_hash(hash_bytes: &[u8]) -> Result<Vec<u8>, JsValue> {
    if hash_bytes.len() != 32 {
        return Err(JsValue::from_str("Hash must be 32 bytes"));
    }
    let guard = PRIVATE_KEY.lock().unwrap();
    match guard.as_ref() {
        Some(sk) => {
            let sig = sk
                .sign_prehash(hash_bytes)
                .map_err(|e| JsValue::from_str(&format!("Signing failed: {}", e)))?;
            Ok(sig.to_bytes().to_vec())
        }
        None => Err(JsValue::from_str("No key loaded")),
    }
}

#[wasm_bindgen]
pub fn clear_key() {
    let mut guard = PRIVATE_KEY.lock().unwrap();
    *guard = None;
}

#[wasm_bindgen]
pub fn is_key_loaded() -> bool {
    let guard = PRIVATE_KEY.lock().unwrap();
    guard.is_some()
}
