import { useState, useEffect } from "react";

const DEVICE_ID_KEY = "megaodds_device_id";

function generateDeviceId(): string {
  return `dev_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function useDeviceId(): string {
  const [deviceId] = useState<string>(() => {
    // Check cookie first
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const existing = cookies.find((c) => c.startsWith(`${DEVICE_ID_KEY}=`));
    if (existing) return existing.split("=")[1];

    // Check localStorage fallback
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;

    // Generate new
    const newId = generateDeviceId();
    // Set cookie (expires in 10 years)
    const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${DEVICE_ID_KEY}=${newId};expires=${expires};path=/;SameSite=Strict`;
    localStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  });

  useEffect(() => {
    // Ensure cookie is always set
    const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${DEVICE_ID_KEY}=${deviceId};expires=${expires};path=/;SameSite=Strict`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }, [deviceId]);

  return deviceId;
}
