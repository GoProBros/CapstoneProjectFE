import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capstone Project",
  description: "Professional Next.js application with TypeScript and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <script src="https://code.iconify.design/3/3.1.0/iconify.min.js" async></script>
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
