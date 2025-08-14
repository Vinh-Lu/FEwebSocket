// import { ThemeProvider } from "@/components/common/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { AntdRegistry } from "@ant-design/nextjs-registry"
import type { Metadata } from "next"
import type React from "react"
import "./globals.css"
// import { ThemeWrapper } from "@/components/theme/ThemeWrapper"


export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin Dashboard Interface",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AntdRegistry>
          {/* <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          > */}
          <QueryProvider>{children}</QueryProvider>
          {/* </ThemeProvider> */}
        </AntdRegistry>
      </body>
    </html>
  )
}
