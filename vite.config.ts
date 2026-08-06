import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiOrigin = env.VITE_BASE_URL
    ? new URL(env.VITE_BASE_URL).origin
    : null
  const apiUrlPattern = apiOrigin
    ? new RegExp(`^${apiOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`)
    : null

  const wellKnownHeadersPlugin = {
    name: "well-known-headers",
    configureServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/.well-known/apple-app-site-association")) {
          res.setHeader("Content-Type", "application/json")
        }
        next()
      })
    },
    configurePreviewServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/.well-known/apple-app-site-association")) {
          res.setHeader("Content-Type", "application/json")
        }
        next()
      })
    },
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      wellKnownHeadersPlugin,
      VitePWA({
        registerType: "prompt",
        includeAssets: [
          "logo/favicon.ico",
          "logo/favicon-16x16.png",
          "logo/favicon-32x32.png",
          "logo/apple-touch-icon.png",
        ],
        manifest: {
          name: "Stepra",
          short_name: "Stepra",
          description:
            "Practice smarter. Track progress. Prepare for JAMB, DLI, UNILAG and more.",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/dashboard",
          icons: [
            {
              src: "/logo/android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/logo/android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/logo/android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          importScripts: ["/push-sw.js"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/, /^\/\.well-known\//],
          runtimeCaching: [
            // Never cache authenticated API responses — subscription status is
            // device-bound and a stale "unsubscribed" cache looks like a failed payment.
            ...(apiUrlPattern
              ? [
                  {
                    urlPattern: apiUrlPattern,
                    handler: "NetworkOnly" as const,
                  },
                ]
              : []),
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: "StaleWhileRevalidate" as const,
              options: {
                cacheName: "stepra-images",
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
