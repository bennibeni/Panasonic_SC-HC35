# Panasonic SC-HC35 — Guida all’uso

App React con Next.js App Router: guida navigabile in italiano per lo stereo
compatto Panasonic SC-HC35, dai collegamenti alla risoluzione dei problemi.
Ogni capitolo rimanda alle pagine del manuale originale (in inglese e
spagnolo), incluso come PDF.

## Avvio

Richiede Node.js 22.12 o successivo e npm. Non richiede chiavi API o file `.env`.

```powershell
cd "C:\Users\torre\Desktop\I miei progetti\panasonic-sc-hc35"
npm ci
npm run dev
```

Apri l'indirizzo indicato nel terminale (normalmente `http://localhost:3000`).
Per usare un'altra porta: `npm run dev -- --port 3121`.

## Comandi

| Comando                | Azione                              |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Server di sviluppo                  |
| `npm run build`        | Build di produzione                 |
| `npm start`            | Avvia la build di produzione        |
| `npm run lint`         | Controlla JavaScript e React        |
| `npm run lint:a11y`    | Include le regole di accessibilità  |
| `npm run format`       | Applica Prettier                    |
| `npm run format:check` | Verifica la formattazione           |
| `npm run check`        | Formattazione, accessibilità, build |

## Come si usa

- L'indice a sinistra elenca gli 11 capitoli in quattro gruppi; la ricerca
  ignora maiuscole e accenti. Su schermi stretti l'indice si apre da «☰ Indice».
- Si cambia capitolo anche con i tasti ← e →. Ogni capitolo ha il suo indirizzo
  (`#collegamenti`, `#cd`, `#problemi`…).
- Nel capitolo «Unità e telecomando» i numeri sulle figure sono cliccabili e
  aprono il capitolo del tasto corrispondente.
- «Ingrandisci» apre la figura a tutto schermo; «Tema scuro» cambia tema e la
  scelta resta salvata nel browser.

## Struttura

- `src/app/`: pagina, layout (con lo script del tema), icona e stili globali.
- `src/components/panasonic/`:
  - `data.js`: capitoli, punti cliccabili e dimensioni delle figure.
  - `PanasonicGuide.jsx`: indice, ricerca, tema, capitoli, figure,
    ingrandimento e navigazione da tastiera.
- `public/immagini/`: le figure tratte dal manuale.
- `public/manuale.pdf`: il manuale originale (RQTX1260).

Il footer **All projects** rimanda all'[indice degli altri progetti](https://links-page-bennibeni.vercel.app/),
come negli altri progetti recenti.
