import type { Metadata } from "next"
import { Poppins, Archivo, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
})

// Fuentes de la landing pública (estilo urbano/street). Solo se usan en `/[slug]`.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${poppins.variable} ${archivo.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
