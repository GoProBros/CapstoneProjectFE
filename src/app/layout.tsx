import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FrontendConsoleCapture from "@/components/debug/FrontendConsoleCapture";
import TopProgressBar from "@/components/ui/TopProgressBar";

export const metadata: Metadata = {
  title: "KF Stock",
  description: "Cung cấp thông tin tài chính và tin tức về chứng khoán Việt Nam, giúp nhà đầu tư đưa ra quyết định sáng suốt.",
  icons: {
    icon: [
      {
        url: "/assets/Logo/KF%20Stock_Logo_Transparent.png",
        type: "image/png",
      },
    ],
    shortcut: "/assets/Logo/KF%20Stock_Logo_Transparent.png",
    apple: "/assets/Logo/KF%20Stock_Logo_Transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script src="https://code.iconify.design/3/3.1.0/iconify.min.js" async></script>
      </head>

      <body className="antialiased" suppressHydrationWarning>
        <TopProgressBar />
        <ThemeProvider>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            <AuthProvider>
              <FrontendConsoleCapture />
              {children}
            </AuthProvider>
          </GoogleOAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
