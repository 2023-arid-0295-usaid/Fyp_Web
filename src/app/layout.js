import "./globals.css";
import { ToastProvider } from "@/components/Toast/Toast";

export const metadata = {
  title: "FYP Services App",
  description:
    "Next.js (App Router) clone of the myFypProject React Native app — 4-role services marketplace backed by the external ASP.NET Core API.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
