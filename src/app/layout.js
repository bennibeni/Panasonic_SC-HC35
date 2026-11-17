import "./globals.css";

export const metadata = {
  title: "Panasonic SC-HC35 · Guida all’uso",
  description: "Guida navigabile in italiano per lo stereo Panasonic SC-HC35.",
};

// Applica il tema salvato prima del primo disegno, come la versione HTML.
const themeScript =
  "try{document.documentElement.dataset.theme=localStorage.getItem('panasonic-theme')||'light'}catch{}";

export default function RootLayout({ children }) {
  return (
    <html lang="it" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
