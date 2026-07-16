#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::path::PathBuf;

/// Get the machine's local IP address for LAN discovery
#[tauri::command]
fn get_local_ip() -> Result<String, String> {
    // Try to find a non-loopback IPv4 address
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    // Use a UDP socket trick to find the default outbound IP
    match std::net::UdpSocket::bind("0.0.0.0:0") {
        Ok(socket) => {
            // Connect to a public DNS to determine outbound interface
            if socket.connect("8.8.8.8:80").is_ok() {
                if let Ok(addr) = socket.local_addr() {
                    return Ok(addr.ip().to_string());
                }
            }
            Ok("127.0.0.1".to_string())
        }
        Err(_) => Ok("127.0.0.1".to_string()),
    }
}

/// Get system information for device announcement
#[tauri::command]
fn get_system_info() -> Result<serde_json::Value, String> {
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "Unknown".to_string());

    let os = env::consts::OS;
    let arch = env::consts::ARCH;

    Ok(serde_json::json!({
        "hostname": hostname,
        "os": os,
        "arch": arch,
        "platform": format!("{} ({})", os, arch),
    }))
}

/// Read file bytes from the filesystem
#[tauri::command]
fn read_file_bytes(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))
}

/// Write bytes to a file on the filesystem
#[tauri::command]
fn write_file_bytes(path: String, bytes: Vec<u8>) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = PathBuf::from(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    fs::write(&path, bytes).map_err(|e| format!("Failed to write file: {}", e))
}

/// Open a file with the default OS application
#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| format!("Failed to open file: {}", e))
}

/// Get the default downloads directory
#[tauri::command]
fn get_downloads_dir() -> Result<String, String> {
    dirs::download_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Downloads directory not found".to_string())
}

/// List files in a directory
#[tauri::command]
fn list_directory(path: String) -> Result<Vec<serde_json::Value>, String> {
    let entries = fs::read_dir(&path).map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut result = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            let metadata = entry.metadata().ok();
            result.push(serde_json::json!({
                "name": entry.file_name().to_string_lossy(),
                "path": entry.path().to_string_lossy(),
                "isDir": metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false),
                "size": metadata.as_ref().map(|m| m.len()).unwrap_or(0),
            }));
        }
    }

    Ok(result)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_local_ip,
            get_system_info,
            read_file_bytes,
            write_file_bytes,
            open_file,
            get_downloads_dir,
            list_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
