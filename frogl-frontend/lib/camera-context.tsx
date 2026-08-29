"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CAMERA_KEY = "frogl:camera-live:v1";
const CAMERA_CHANNEL = "frogl-camera";

type CameraContextValue = {
  live: boolean;
  setLive: (live: boolean) => void;
};

const CameraContext = createContext<CameraContextValue | null>(null);

function readLive() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CAMERA_KEY) === "1";
  } catch {
    return false;
  }
}

function persistLive(live: boolean) {
  try {
    window.localStorage.setItem(CAMERA_KEY, live ? "1" : "0");
  } catch {
    /* ignore */
  }
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CAMERA_CHANNEL);
    channel.postMessage(live);
    channel.close();
  }
}

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const [live, setLiveState] = useState(false);

  useEffect(() => {
    setLiveState(readLive());
    const onStorage = (event: StorageEvent) => {
      if (event.key === CAMERA_KEY) setLiveState(readLive());
    };
    window.addEventListener("storage", onStorage);

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(CAMERA_CHANNEL);
      channel.onmessage = (event: MessageEvent<boolean>) => {
        if (typeof event.data === "boolean") setLiveState(event.data);
      };
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, []);

  const setLive = useCallback((next: boolean) => {
    persistLive(next);
    setLiveState(next);
  }, []);

  const value = useMemo(() => ({ live, setLive }), [live, setLive]);
  return (
    <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
  );
}

export function useCameraLive() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error("useCameraLive must be used within CameraProvider");
  return ctx;
}
