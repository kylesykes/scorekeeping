import { useState, useCallback } from "react";

const DEVICE_ID_KEY = "tally_device_id";
const PLAYER_NAME_KEY = "tally_player_name";

function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Manages local identity: a stable device UUID and a player name.
 * No auth required — identity lives entirely in localStorage.
 */
export function useIdentity() {
  const [deviceId] = useState(getOrCreateDeviceId);
  const [name, setNameState] = useState(
    () => localStorage.getItem(PLAYER_NAME_KEY) ?? ""
  );

  const setName = useCallback((newName) => {
    const trimmed = newName.trim();
    setNameState(trimmed);
    if (trimmed) {
      localStorage.setItem(PLAYER_NAME_KEY, trimmed);
    }
  }, []);

  return { deviceId, name, setName };
}
