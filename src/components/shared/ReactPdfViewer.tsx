import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface ReactPdfViewerProps {
  fileUrl: string;
  fileName: string;
  onBackgroundClick?: () => void;
}

export default function ReactPdfViewer({ fileUrl, fileName, onBackgroundClick }: ReactPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setPageNumber(1);
    setZoom(1);
    setNumPages(0);
    setLoadError(null);
    pageRefs.current = [];
  }, [fileUrl]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const element = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setContainerWidth(Math.floor(entry.contentRect.width));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const pageWidth = useMemo(() => {
    if (containerWidth <= 0) return undefined;
    return Math.max(260, Math.min(containerWidth - 112, 980));
  }, [containerWidth]);

  const canGoPrev = pageNumber > 1;
  const canGoNext = numPages > 0 && pageNumber < numPages;

  function scrollToPage(targetPage: number) {
    const scrollRoot = containerRef.current;
    const pageElement = pageRefs.current[targetPage - 1];
    if (!scrollRoot || !pageElement) return;

    scrollRoot.scrollTo({
      top: pageElement.offsetTop - 24,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const scrollRoot = containerRef.current;
    if (!scrollRoot || numPages <= 0) return;

    let ticking = false;

    const updateCurrentPage = () => {
      ticking = false;
      const viewportTop = scrollRoot.scrollTop;
      const viewportTarget = viewportTop + scrollRoot.clientHeight * 0.35;

      let nextPage = 1;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let index = 0; index < numPages; index += 1) {
        const element = pageRefs.current[index];
        if (!element) continue;
        const pageTop = element.offsetTop;
        const distance = Math.abs(pageTop - viewportTarget);
        if (distance < bestDistance) {
          bestDistance = distance;
          nextPage = index + 1;
        }
      }

      setPageNumber((current) => (current === nextPage ? current : nextPage));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateCurrentPage);
    };

    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    updateCurrentPage();

    return () => {
      scrollRoot.removeEventListener("scroll", onScroll);
    };
  }, [numPages, zoom]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 sm:top-4">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom((current) => Math.max(0.6, Number((current - 0.1).toFixed(2))))}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-[52px] text-center text-[12.5px] font-medium text-foreground tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom((current) => Math.min(2.2, Number((current + 0.1).toFixed(2))))}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom(1)}
            aria-label="Reset zoom"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="pdf-preview-scroll min-h-0 flex-1 overflow-auto px-3 pb-24 pt-16 sm:px-6 sm:pt-20"
        onClick={(event) => {
          if (onBackgroundClick && event.target === event.currentTarget) {
            onBackgroundClick();
          }
        }}
      >
        {loadError ? (
          <div className="mx-auto flex h-full min-h-[260px] max-w-xl items-center justify-center rounded-xl border bg-black/20 px-6 py-10 text-center">
            <p className="text-[13px] text-muted-foreground">
              Could not load this PDF preview. Try opening it in a new tab.
            </p>
          </div>
        ) : (
          <div className="mx-auto w-fit space-y-3 sm:space-y-4">
            <Document
              file={fileUrl}
              onLoadSuccess={(nextDocument) => {
                setNumPages(nextDocument.numPages);
                setPageNumber((current) => Math.min(Math.max(current, 1), nextDocument.numPages));
              }}
              onLoadError={() => setLoadError("load_failed")}
              loading={
                <div className="flex h-[400px] w-[min(92vw,720px)] items-center justify-center text-muted-foreground">
                  <Loader2 className="size-4 animate-spin opacity-70" />
                </div>
              }
              error={null}
            >
              {Array.from({ length: numPages }, (_, index) => {
                const page = index + 1;
                return (
                  <div
                    key={`page_${page}`}
                    ref={(node) => {
                      pageRefs.current[index] = node;
                    }}
                    className="mx-auto rounded-md border bg-white p-1 shadow-[0_20px_45px_-28px_rgba(0,0,0,0.65)]"
                    data-page-number={page}
                  >
                    <Page
                      pageNumber={page}
                      width={pageWidth}
                      scale={zoom}
                      renderTextLayer={false}
                      loading={
                        <div
                          className="flex h-[400px] w-[min(92vw,720px)] items-center justify-center rounded bg-gradient-to-b from-muted/40 to-muted/20"
                        >
                          <Loader2 className="size-4 animate-spin text-muted-foreground/60" />
                        </div>
                      }
                    />
                  </div>
                );
              })}
            </Document>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 sm:bottom-5">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canGoPrev}
            onClick={() => scrollToPage(Math.max(1, pageNumber - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[88px] text-center text-[12.5px] font-medium text-foreground tabular-nums">
            {numPages > 0 ? `${pageNumber} / ${numPages}` : "Loading..."}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canGoNext}
            onClick={() => scrollToPage(Math.min(numPages, pageNumber + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Previewing {fileName}, page {pageNumber} of {numPages || 0}
      </p>
    </div>
  );
}