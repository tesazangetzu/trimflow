import type { Metadata } from "next"
import { Poppins, Marcellus, Spectral, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
})

// Fuentes de la landing pública («Umbral de tinta + libro de cuentas», ADR-014).
// Solo se usan en `/[slug]` y `/[slug]/reservar`.
const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: ["400"],
})

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "TrimFlow",
  description: "Sistema de gestión de barberías",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${poppins.variable} ${marcellus.variable} ${spectral.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
