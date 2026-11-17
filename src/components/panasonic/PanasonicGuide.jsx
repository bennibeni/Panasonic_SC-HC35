"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  FIGURE_LABELS,
  IMAGE_SIZES,
  REMOTE_HOTSPOTS,
  SECTIONS,
  TOP_HOTSPOTS,
} from "./data";

const BY_ID = new Map(SECTIONS.map((section) => [section.id, section]));
const THEME_KEY = "panasonic-theme";
const THEME_EVENT = "panasonic-theme-change";

function normalize(value) {
  return value
    .toLocaleLowerCase("it")
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "");
}

const SEARCH_TEXT = new Map(
  SECTIONS.map((section) => [
    section.id,
    normalize(
      [
        section.group,
        section.title,
        section.heading,
        section.lead,
        ...section.blocks.flat(Infinity),
      ].join(" "),
    ),
  ]),
);

/* ---------- Stato esterno: hash dell'URL e tema ---------- */

function subscribeHash(callback) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function readHash() {
  return window.location.hash.slice(1);
}

// Il tema vive nell'attributo data-theme di <html> (impostato prima del
// primo disegno dallo script del layout) e in localStorage.
function subscribeTheme(callback) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function readTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function writeTheme(value) {
  document.documentElement.dataset.theme = value;
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {}
  window.dispatchEvent(new Event(THEME_EVENT));
}

/* ---------- Componenti ---------- */

function PdfLink({ page, children }) {
  return (
    <a href={`/manuale.pdf#page=${page}`} target="_blank" rel="noopener">
      {children}
    </a>
  );
}

// Figura con i nomi dei tasti scritti in obliquo sopra il bordo superiore,
// come nei disegni del manuale. È un SVG nelle coordinate della PNG, allungato
// verso l'alto della fascia che serve alle etichette.
const LABEL_BAND = 92;
const LABEL_ANGLE = -55;

function LabeledArt({ file, caption }) {
  const [width, height] = IMAGE_SIZES[file];
  const { y, labels } = FIGURE_LABELS[file];
  const names = labels.map(([name]) => name).join(", ");
  return (
    <svg
      className="labeled-art"
      viewBox={`0 ${-LABEL_BAND} ${width} ${height + LABEL_BAND}`}
      width={width}
      height={height + LABEL_BAND}
      role="img"
      aria-label={`${caption}. Tasti sul bordo superiore: ${names}.`}
    >
      <image href={`/immagini/${file}.png`} width={width} height={height} />
      {labels.map(([name, x]) => (
        <g key={name}>
          <line x1={x} y1={y - 2} x2={x} y2={y - 9} className="label-tick" />
          <text
            x={x}
            y={y - 12}
            transform={`rotate(${LABEL_ANGLE} ${x} ${y - 12})`}
            className="label-text"
          >
            {name}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Art({ file, caption, eager = false }) {
  if (FIGURE_LABELS[file]) return <LabeledArt file={file} caption={caption} />;
  const [width, height] = IMAGE_SIZES[file];
  return (
    <Image
      src={`/immagini/${file}.png`}
      width={width}
      height={height}
      alt={caption}
      loading={eager ? "eager" : undefined}
    />
  );
}

// La prima figura di un capitolo è spesso l'elemento più grande visibile
// all'apertura (LCP): si carica subito invece che in differita.
function Figure({ figure: [file, caption, page], onZoom, eager }) {
  const hotspots =
    file === "comandi-alto"
      ? TOP_HOTSPOTS
      : file === "telecomando"
        ? REMOTE_HOTSPOTS
        : [];
  return (
    <figure>
      <div className="figbox">
        <div
          className={
            file === "comandi-alto" ? "artwork top-controls" : "artwork"
          }
        >
          <Art file={file} caption={caption} eager={eager} />
          {hotspots.map(([number, id, x, y]) => (
            <a
              key={number + id}
              href={"#" + id}
              className="hotspot"
              style={{ left: x + "%", top: y + "%" }}
              aria-label={number + " · " + BY_ID.get(id).title}
              title={BY_ID.get(id).title}
            />
          ))}
        </div>
        <div>
          <button
            className="zoom"
            type="button"
            aria-label={"Ingrandisci " + caption}
            onClick={() => onZoom([file, caption])}
          >
            Ingrandisci
          </button>
        </div>
      </div>
      <figcaption>
        {caption} · <PdfLink page={page}>Manuale, p. {page}</PdfLink>
      </figcaption>
    </figure>
  );
}

function Block({ block: [kind, title, content, rows] }) {
  switch (kind) {
    case "links":
      return (
        <div className="cards">
          {title.map((id) => (
            <a key={id} href={"#" + id} className="card">
              {BY_ID.get(id).title}
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      );
    case "note":
      return (
        <aside className="note">
          <strong>{title}</strong>
          <p>{content}</p>
        </aside>
      );
    case "text":
      return (
        <section>
          <h2>{title}</h2>
          <p>{content}</p>
        </section>
      );
    case "steps":
      return (
        <section>
          <h2>{title}</h2>
          <ol className="steps">
            {content.map(([name, description]) => (
              <li key={name}>
                <strong>{name}</strong>
                {description}
              </li>
            ))}
          </ol>
        </section>
      );
    case "faq":
      return (
        <section>
          <h2>{title}</h2>
          {content.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </section>
      );
    case "table":
      return (
        <section>
          <h2>{title}</h2>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  {content.map((value) => (
                    <th key={value} scope="col">
                      {value}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((value, j) => (
                      <td key={j}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      );
    default:
      return null;
  }
}

export default function PanasonicGuide() {
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(null);

  const mainRef = useRef(null);
  const searchRef = useRef(null);
  const openButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(false);

  const current = BY_ID.get(hash) || SECTIONS[0];
  const index = SECTIONS.indexOf(current);
  const previous = SECTIONS[index - 1];
  const next = SECTIONS[index + 1];

  const words = normalize(query.trim()).split(/\s+/);
  const visible = SECTIONS.filter((section) =>
    words.every((word) => SEARCH_TEXT.get(section.id).includes(word)),
  );
  const groups = [];
  for (const section of visible) {
    const last = groups[groups.length - 1];
    if (last && last.name === section.group) last.items.push(section);
    else groups.push({ name: section.group, items: [section] });
  }

  function closeIndex(restoreFocus = true) {
    restoreFocusRef.current = restoreFocus;
    setOpen(false);
  }

  // Titolo della scheda del browser.
  useEffect(() => {
    document.title = (current.heading || current.title) + " · Guida Panasonic";
  }, [current]);

  // Cambio di capitolo: chiude l'indice, torna in cima, porta il focus sul testo.
  useEffect(() => {
    function onHashChange() {
      restoreFocusRef.current = false;
      setOpen(false);
      window.scrollTo(0, 0);
      mainRef.current?.focus({ preventScroll: true });
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Indice su schermi stretti: focus sulla ricerca all'apertura, sul pulsante
  // ☰ alla chiusura; si chiude se la finestra cambia formato.
  useEffect(() => {
    if (open) searchRef.current?.focus();
    else if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      openButtonRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 820px)");
    const onChange = () => {
      restoreFocusRef.current = false;
      setOpen(false);
    };
    mobile.addEventListener("change", onChange);
    return () => mobile.removeEventListener("change", onChange);
  }, []);

  // Ingrandimento: finestra modale nativa.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (zoom && dialog && !dialog.open) dialog.showModal();
  }, [zoom]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const onClose = () => setZoom(null);
    const onClick = (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        dialog.close();
    };
    dialog.addEventListener("close", onClose);
    dialog.addEventListener("click", onClick);
    return () => {
      dialog.removeEventListener("close", onClose);
      dialog.removeEventListener("click", onClick);
    };
  }, []);

  // Tastiera: Esc chiude l'indice, ← e → cambiano capitolo.
  useEffect(() => {
    function onKeyDown(event) {
      if (dialogRef.current?.open) return;
      if (open) {
        if (event.key === "Escape") closeIndex();
        return;
      }
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        (event.target instanceof Element &&
          event.target.closest(
            "input, textarea, select, [contenteditable], button, summary",
          ))
      )
        return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.key === "ArrowRight" ? next : previous;
      if (target) {
        event.preventDefault();
        window.location.hash = target.id;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  // Un clic sul capitolo già aperto chiude l'indice senza cambiare pagina.
  function onIndexLinkClick(event, id) {
    if (open && window.location.hash === "#" + id) {
      event.preventDefault();
      closeIndex(false);
      mainRef.current?.focus();
    }
  }

  return (
    <>
      <a
        className="skip"
        href="#contenuto"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Vai al contenuto
      </a>
      <div className="shell">
        <aside className={"side" + (open ? " open" : "")} id="indice">
          <div className="brand">
            <small>Panasonic · Guida all’uso</small>
            <a href="#inizio">SC-HC35</a>
          </div>
          <div className="tools">
            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => writeTheme(theme === "dark" ? "light" : "dark")}
            >
              Tema scuro
            </button>
            <a href="/manuale.pdf" target="_blank" rel="noopener">
              Manuale PDF ↗
            </a>
          </div>
          <label htmlFor="ricerca" className="visually-hidden">
            Cerca nella guida
          </label>
          <input
            ref={searchRef}
            id="ricerca"
            type="search"
            placeholder="Cerca nella guida"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="visually-hidden" role="status">
            {visible.length} capitoli trovati
          </div>
          <nav id="capitoli" aria-label="Capitoli della guida">
            {groups.map((group) => (
              <div key={group.name}>
                <p className="group">{group.name}</p>
                {group.items.map((section) => (
                  <a
                    key={section.id}
                    href={"#" + section.id}
                    aria-current={section === current ? "page" : undefined}
                    onClick={(event) => onIndexLinkClick(event, section.id)}
                  >
                    <span className="num" aria-hidden="true">
                      {String(SECTIONS.indexOf(section) + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </a>
                ))}
              </div>
            ))}
            {!visible.length && <p>Nessun capitolo trovato.</p>}
          </nav>
          <button id="chiudi-indice" type="button" onClick={() => closeIndex()}>
            Chiudi indice
          </button>
        </aside>

        <div className="main" inert={open}>
          <header className="topbar">
            <button
              ref={openButtonRef}
              type="button"
              aria-controls="indice"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              ☰ Indice
            </button>
            <b>SC-HC35</b>
          </header>
          <div className="progress" aria-hidden="true">
            <span
              style={{ width: ((index + 1) / SECTIONS.length) * 100 + "%" }}
            />
          </div>

          <main className="page" id="contenuto" tabIndex={-1} ref={mainRef}>
            <header>
              <div className="kicker">
                {current.group} · {index + 1} / {SECTIONS.length}
              </div>
              <h1>{current.heading || current.title}</h1>
              <p className="lead">{current.lead}</p>
            </header>

            {(current.figures || []).map((figure, i) => (
              <Figure
                key={figure[0]}
                figure={figure}
                eager={i === 0}
                onZoom={setZoom}
              />
            ))}
            {current.blocks.map((block, i) => (
              <Block key={current.id + i} block={block} />
            ))}

            <div className="sources">
              Nel manuale originale
              {current.pages.map((page) => (
                <PdfLink key={page} page={page}>
                  p. {page}
                </PdfLink>
              ))}
            </div>

            <nav className="pager" aria-label="Capitoli adiacenti">
              {previous ? (
                <a href={"#" + previous.id}>
                  <small>← Precedente</small>
                  {previous.title}
                </a>
              ) : (
                <span />
              )}
              {next ? (
                <a href={"#" + next.id}>
                  <small>Successivo →</small>
                  {next.title}
                </a>
              ) : (
                <span />
              )}
            </nav>
            <p className="hint">Usa ← e → per cambiare capitolo.</p>
          </main>

          <footer className="projects-footer">
            <a href="https://links-page-bennibeni.vercel.app/">
              <span aria-hidden="true">← </span>All projects
            </a>
          </footer>
        </div>
      </div>

      {open && (
        <button
          className="scrim"
          type="button"
          tabIndex={-1}
          aria-label="Chiudi indice"
          onClick={() => closeIndex()}
        />
      )}

      <dialog ref={dialogRef} aria-labelledby="didascalia-zoom">
        <form method="dialog">
          <button>Chiudi ✕</button>
        </form>
        {zoom && <Art file={zoom[0]} caption={zoom[1]} />}
        <p id="didascalia-zoom">{zoom ? zoom[1] : ""}</p>
      </dialog>
    </>
  );
}
