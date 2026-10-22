import type { MetadataRoute } from "next";

/** Lets phones install HeriTech to the home screen and open it full screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HeriTech",
    short_name: "HeriTech",
    description: "Festival leftovers traced into handmade pieces, with a public record of where the money goes.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#1c2140",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
