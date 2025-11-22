// Device key management for multi-device exam access

import {
  generateDeviceKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
} from "./crypto";

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  publicKey: string;
  registeredAt: number;
  lastActive: number;
}

const DEVICE_KEY = "cbc_device_keys";
const DEVICE_INFO_KEY = "cbc_device_info";

/**
 * Generate device ID based on browser fingerprint
 */
function generateDeviceId(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height,
  ].join("|");
  
  return btoa(data).slice(0, 32);
}

/**
 * Get device name (browser + OS)
 */
function getDeviceName(): string {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";

  // Detect browser
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  // Detect OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS")) os = "iOS";

  return `${browser} on ${os}`;
}

/**
 * Initialize device keys (generate if not exists)
 */
export async function initializeDevice(): Promise<DeviceInfo> {
  let deviceInfo = localStorage.getItem(DEVICE_INFO_KEY);
  
  if (!deviceInfo) {
    // Generate new key pair
    const keyPair = await generateDeviceKeyPair();
    const publicKey = await exportPublicKey(keyPair.publicKey);
    const privateKey = await exportPrivateKey(keyPair.privateKey);

    // Store keys
    localStorage.setItem(
      DEVICE_KEY,
      JSON.stringify({
        publicKey,
        privateKey,
      })
    );

    // Create device info
    const info: DeviceInfo = {
      deviceId: generateDeviceId(),
      deviceName: getDeviceName(),
      publicKey,
      registeredAt: Date.now(),
      lastActive: Date.now(),
    };

    localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(info));
    return info;
  }

  const info = JSON.parse(deviceInfo) as DeviceInfo;
  info.lastActive = Date.now();
  localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(info));
  
  return info;
}

/**
 * Get device info
 */
export function getDeviceInfo(): DeviceInfo | null {
  const info = localStorage.getItem(DEVICE_INFO_KEY);
  return info ? JSON.parse(info) : null;
}

/**
 * Get device public key
 */
export async function getDevicePublicKey(): Promise<CryptoKey> {
  const keys = localStorage.getItem(DEVICE_KEY);
  if (!keys) {
    throw new Error("Device not initialized");
  }

  const { publicKey } = JSON.parse(keys);
  return await importPublicKey(publicKey);
}

/**
 * Get device private key
 */
export async function getDevicePrivateKey(): Promise<CryptoKey> {
  const keys = localStorage.getItem(DEVICE_KEY);
  if (!keys) {
    throw new Error("Device not initialized");
  }

  const { privateKey } = JSON.parse(keys);
  return await importPrivateKey(privateKey);
}

/**
 * Export device public key as string
 */
export function getDevicePublicKeyString(): string {
  const keys = localStorage.getItem(DEVICE_KEY);
  if (!keys) {
    throw new Error("Device not initialized");
  }

  const { publicKey } = JSON.parse(keys);
  return publicKey;
}

/**
 * Reset device (clear all keys and data)
 */
export function resetDevice(): void {
  localStorage.removeItem(DEVICE_KEY);
  localStorage.removeItem(DEVICE_INFO_KEY);
}
