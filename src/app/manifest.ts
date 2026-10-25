import type { MetadataRoute } from "next";

/**
 * Web app manifest. Makes SafeClick installable and registers it as a share
 * target, so on Android you can share a text or screenshot from another app
 * straight into SafeClick. Shared content is POSTed to /share, which the
 * service worker intercepts on the device (see public/sw.js).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SafeClick AI",
    short_name: "SafeClick",
    description: "Check suspicious messages on your device and choose a safer next step.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#0a1029",
    categories: ["security", "education", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    share_target: {
      action: "/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [{ name: "image", accept: ["image/png", "image/jpeg", "image/webp"] }],
      },
    },
    shortcuts: [
      { name: "Check a message", url: "/" },
      { name: "Simple mode (Hindi)", short_name: "Simple", url: "/simple" },
      { name: "I already clicked or paid", short_name: "Get help", url: "/help" },
      { name: "Safety Guide", short_name: "Guide", url: "/guide" },
    ],
  };
}
