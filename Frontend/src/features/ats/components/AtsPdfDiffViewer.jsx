import { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import api from "../../../shared/api/client";
import "./AtsPdfDiffViewer.scss";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const normalize = (value = "") => String(value).toLowerCase().replace(/\s+/g, " ").trim();
const words = (value = "") => normalize(value).split(/[^a-z0-9+#.%-]+/i).filter(Boolean);

function buildWordCounts(items) {
  const counts = new Map();
  items.forEach((item) => words(item.str).forEach((word) => counts.set(word, (counts.get(word) || 0) + 1)));
  return counts;
}

function changedItems(items, otherItems) {
  const otherCounts = buildWordCounts(otherItems);
  const used = new Map();
  return items.map((item) => {
    const itemWords = words(item.str);
    const available = itemWords.every((word) => {
      const next = (used.get(word) || 0) + 1;
      if (next > (otherCounts.get(word) || 0)) return false;
      used.set(word, next);
      return true;
    });
    return { ...item, changed: !available };
  });
}

async function readPdf(source) {
  const pdf = await pdfjsLib.getDocument({ data: source }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items
      .filter((item) => item.str?.trim())
      .map((item) => ({
        str: item.str,
        transform: item.transform,
        width: item.width,
        height: item.height || Math.abs(item.transform?.[3] || 10),
      }));
    pages.push({ pageNumber, viewport, items });
  }
  return { pdf, pages };
}

function PdfPage({ page, scale, changed, tone, onChangeClick }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const viewport = page.viewport.clone({ scale });
      const context = canvas.getContext("2d", { alpha: false });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.page.render({ canvasContext: context, viewport }).promise;
      if (!cancelled) setRendered(true);
    };
    render();
    return () => { cancelled = true; };
  }, [page, scale]);

  const viewport = page.viewport.clone({ scale });
  return (
    <div className="ats-pdf-page" style={{ width: viewport.width, height: viewport.height }}>
      <canvas ref={canvasRef} className="ats-pdf-canvas" />
      {rendered && changed.map((item, index) => {
        if (!item.changed) return null;
        const [, , , , x, y] = item.transform;
        const left = x * scale;
        const top = viewport.height - (y + item.height) * scale;
        const width = Math.max(item.width * scale, 8);
        const height = Math.max(item.height * scale, 8);
        return (
          <button
            type="button"
            key={`${page.pageNumber}-${index}`}
            className={`ats-pdf-highlight ats-pdf-highlight--${tone}`}
            style={{ left, top, width, height }}
            title="Changed content"
            onClick={() => onChangeClick(page.pageNumber, top)}
            aria-label="Changed resume content"
          />
        );
      })}
    </div>
  );
}

const AtsPdfDiffViewer = ({ reportId, originalPdfUrl, originalText = "", revisedResume, onDownload, downloading }) => {
  const [original, setOriginal] = useState(null);
  const [revised, setRevised] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1.05);
  const [showChanges, setShowChanges] = useState(true);
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const syncing = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!reportId || !revisedResume) return;
      setLoading(true);
      setError("");
      try {
        const [originalResponse, revisedResponse] = await Promise.all([
          originalPdfUrl
            ? fetch(originalPdfUrl).then((r) => r.arrayBuffer())
            : api.get(`/api/resume/ats-original/${reportId}`, { responseType: "arraybuffer" }).then((r) => r.data),
          api.get(`/api/resume/ats-preview/${reportId}`, { responseType: "arraybuffer" }).then((r) => r.data),
        ]);
        const [originalPdf, revisedPdf] = await Promise.all([readPdf(originalResponse), readPdf(revisedResponse)]);
        if (active) {
          setOriginal(originalPdf);
          setRevised(revisedPdf);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message || "Unable to load the PDF comparison.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [reportId, originalPdfUrl, revisedResume]);

  const leftPages = useMemo(() => {
    if (!original || !revised) return [];
    const revisedItems = revised.pages.flatMap((page) => page.items);
    const originalItems = original.pages.flatMap((page) => page.items);
    const changed = changedItems(originalItems, revisedItems);
    let offset = 0;
    return original.pages.map((page) => {
      const pageItems = changed.slice(offset, offset + page.items.length);
      offset += page.items.length;
      return { ...page, items: pageItems };
    });
  }, [original, revised]);

  const rightPages = useMemo(() => {
    if (!original || !revised) return [];
    const revisedItems = revised.pages.flatMap((page) => page.items);
    const originalItems = original.pages.flatMap((page) => page.items);
    const changed = changedItems(revisedItems, originalItems);
    let offset = 0;
    return revised.pages.map((page) => {
      const pageItems = changed.slice(offset, offset + page.items.length);
      offset += page.items.length;
      return { ...page, items: pageItems };
    });
  }, [original, revised]);

  const syncScroll = (source, target) => {
    if (syncing.current) return;
    syncing.current = true;
    const ratio = source.scrollHeight > source.clientHeight ? source.scrollTop / (source.scrollHeight - source.clientHeight) : 0;
    target.scrollTop = ratio * Math.max(0, target.scrollHeight - target.clientHeight);
    requestAnimationFrame(() => { syncing.current = false; });
  };

  const jumpBoth = (pageNumber, top) => {
    const left = leftScrollRef.current;
    const right = rightScrollRef.current;
    if (!left || !right) return;
    const targetTop = Math.max(0, (pageNumber - 1) * 1050 + top - 220);
    left.scrollTo({ top: targetTop, behavior: "smooth" });
    right.scrollTo({ top: targetTop, behavior: "smooth" });
  };

  if (!revisedResume) return null;

  return (
    <section className="ats-pdf-diff glass-panel">
      <div className="ats-pdf-diff__header">
        <div>
          <div className="ats-pdf-diff__eyebrow"><span /> PDF CHANGE VIEW</div>
          <h3>See changes directly on the resume</h3>
          <p>Highlights are positioned over the actual text on each PDF page.</p>
        </div>
        <div className="ats-pdf-diff__actions">
          <button type="button" className={`ats-pdf-diff__toggle ${showChanges ? "is-active" : ""}`} onClick={() => setShowChanges((value) => !value)}>
            {showChanges ? "Hide changes" : "Show changes"}
          </button>
          <button type="button" onClick={() => setScale((value) => Math.min(1.55, value + 0.1))}>+</button>
          <button type="button" onClick={() => setScale((value) => Math.max(0.7, value - 0.1))}>−</button>
          <button type="button" className="ats-pdf-diff__download" disabled={downloading} onClick={() => onDownload(reportId, revisedResume?.contact?.fullName)}>Download PDF</button>
        </div>
      </div>

      {loading && <div className="ats-pdf-diff__state">Preparing synchronized PDF previews…</div>}
      {error && <div className="ats-pdf-diff__error">{error}{originalText ? " Text fallback is available below." : ""}</div>}

      {!loading && original && revised && (
        <div className="ats-pdf-diff__grid">
          {[{ label: "ORIGINAL", pages: leftPages, tone: "removed", ref: leftScrollRef }, { label: "AI REVISED", pages: rightPages, tone: "added", ref: rightScrollRef }].map(({ label, pages, tone, ref }, paneIndex) => (
            <div className="ats-pdf-diff__pane" key={label}>
              <div className="ats-pdf-diff__pane-head"><span className={tone}>{label === "ORIGINAL" ? "−" : "+"}</span><strong>{label}</strong><small>{pages.length} {pages.length === 1 ? "page" : "pages"}</small></div>
              <div className="ats-pdf-diff__scroll" ref={ref} onScroll={(event) => syncScroll(event.currentTarget, paneIndex === 0 ? rightScrollRef.current : leftScrollRef.current)}>
                <div className="ats-pdf-diff__document">
                  {pages.map((page) => (
                    <PdfPage key={page.pageNumber} page={page} scale={scale} tone={tone} changed={showChanges ? page.items : []} onChangeClick={jumpBoth} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ats-pdf-diff__legend">
        <span><i className="removed" /> Removed or replaced on original</span>
        <span><i className="added" /> Added or rewritten in AI version</span>
      </div>
    </section>
  );
};

export default AtsPdfDiffViewer;
