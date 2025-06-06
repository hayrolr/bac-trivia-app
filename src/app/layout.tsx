// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Importa Tailwind
import GlobalAppDisabledModal from "@/components/ui/GlobalAppDisabledModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "BAC Trivia App",
    description: "Juego de Trivia con Realidad Aumentada",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
            <title>BAC Trivia</title>
        </head>
        <body className={inter.className}>
            {/* Aquí se puede añadir un Navbar/Header/Footer global en caso de ser necesario */}
            <main className="min-h-screen bg-gray-100"> {/* Fondo base */}
                {children}
            </main>
            <GlobalAppDisabledModal /> {/* Modal disponible globalmente */}
        </body>
        </html>
    );
}