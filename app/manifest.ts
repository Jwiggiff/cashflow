import type { MetadataRoute } from "next";
import { appName } from "@/lib/app-name";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: appName,
    description: "CashFlow is a simple and easy to use money tracker.",
    start_url: "/",
    theme_color: "#222222",
    background_color: "#222222",
    display: "standalone",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
