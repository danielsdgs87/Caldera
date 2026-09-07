import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Boiler Studio — Anatomía de una caldera', description: 'Estudio 3D interactivo y explotado de una caldera industrial pirotubular.' };
export const viewport = {width:'device-width',initialScale:1,viewportFit:'cover'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="es" className="dark"><body>{children}</body></html> }
