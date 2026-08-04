import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
    <html lang="es" suppressHydrationWarning className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
