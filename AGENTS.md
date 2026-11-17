# Panasonic SC-HC35 — Guida all’uso

App React/Next.js convertita dalla precedente versione in HTML, CSS e
JavaScript puro (`index.html`, `data.js`, `guida.js`, `stile.css`,
`server.mjs`), che resta nella cronologia git.

- I contenuti sono dati: `src/components/panasonic/data.js` (`SECTIONS`, con
  blocchi `links`, `note`, `text`, `steps`, `faq`, `table`) più i punti
  cliccabili `REMOTE_HOTSPOTS` e `TOP_HOTSPOTS` ([numero, capitolo, x %, y %])
  e le dimensioni delle figure `IMAGE_SIZES`.
- La pagina è `src/components/panasonic/PanasonicGuide.jsx`. Il capitolo
  corrente è l'hash dell'URL (`#cd`, `#radio`…); il tema è l'attributo
  `data-theme` di `<html>`, impostato prima del primo disegno dallo script in
  `layout.js` e salvato in `localStorage` (`panasonic-theme`). Entrambi si
  leggono con `useSyncExternalStore`: non usare `setState` dentro gli effect
  per sincronizzarli.
- Gli stili sono in `src/app/globals.css` (ripresi da `stile.css`).
- Figure in `public/immagini/`, manuale originale in `public/manuale.pdf`; i
  link «p. N» aprono `/manuale.pdf#page=N`.
- Conservare il footer con link `https://links-page-bennibeni.vercel.app/`.
- Leggere i documenti pertinenti in `node_modules/next/dist/docs/` prima di
  modificare routing, layout o configurazione Next.js.
- Eseguire `npm run check` dopo modifiche sostanziali.
