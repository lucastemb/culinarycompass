import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Culinary Compass",
  description: "Your ultimate travel companion! Plan your culinary adventures with ease as CulinaryCompass maps out the perfect path between restaurants, ensuring you savor every moment of your vacation.",
  icons:{
    icon:['/favicon.ico?v=4'],
    apple:['/apple-touch-icon.png?v=4'],
    shortcut:['apple-touch-icon.png'],
  },
  manifest: '/site.webmanifest'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
