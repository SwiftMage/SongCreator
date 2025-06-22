import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SongCreator - Custom AI-Generated Songs",
  description: "Create personalized, AI-generated songs for any occasion. Perfect for birthdays, anniversaries, weddings, and special moments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check for maintenance mode (only in production)
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true' && process.env.NODE_ENV === 'production'

  if (isMaintenanceMode) {
    return (
      <html lang="en">
        <body className={`${inter.variable} font-sans antialiased`}>
          <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon</h1>
              <p className="text-xl text-gray-600 mb-8">We're working hard to bring you something amazing!</p>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
