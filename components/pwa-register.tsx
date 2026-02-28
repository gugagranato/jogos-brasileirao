"use client";

import { useEffect } from "react";

export const PwaRegister = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const isSecure = window.location.protocol === "https:" || isLocalhost;
    if (!isSecure) return;

    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
};
