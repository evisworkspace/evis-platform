from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import time
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


SIGNALS = {
    "area_m2": re.compile(r"\b(?:area|areas|m2|m²|metro quadrado|metros quadrados)\b", re.I),
    "escala": re.compile(r"\bescala\b|\b1\s*:\s*\d+\b", re.I),
    "prancha": re.compile(r"\bprancha\b|\bfolha\b|\bplanta\b", re.I),
    "estrutura": re.compile(r"\b(?:fck|concreto|armadura|pilar|viga|laje|fundacao|sapata|estaca)\b", re.I),
    "sondagem": re.compile(r"\b(?:spt|sondagem|nspt|perfil geotecnico|solo)\b", re.I),
    "instalacoes": re.compile(r"\b(?:hidraulica|eletrica|sanitario|esgoto|agua fria|quadro de cargas)\b", re.I),
}

AREA_VALUE_PATTERN = re.compile(
    r"(?<!\d)(\d{1,3}(?:[,.]\d{1,2})?)\s*(?:m\s*\[?2\]?|m2|m²|m\s*²)\b",
    re.I,
)


@dataclass
class PageMetrics:
    page: int
    width: float | None = None
    height: float | None = None
    pymupdf_markdown_chars: int = 0
    pdfplumber_text_chars: int = 0
    pdfplumber_words: int = 0
    pdfplumber_tables: int = 0
    pdfplumber_chars: int = 0
    replacement_chars: int = 0
    area_mentions: list[str] | None = None
    repeated_area_warning: str | None = None
    numeric_trust_score: int = 0
    needs_ocr_review: bool = False
    signals: dict[str, int] | None = None
    errors: list[str] | None = None


@dataclass
class PdfReport:
    file: str
    sha256: str
    size_bytes: int
    page_count: int
    elapsed_seconds: float
    engines: dict[str, str]
    pages: list[PageMetrics]
    summary: dict[str, Any]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_slug(value: str) -> str:
    value = re.sub(r"[^\w.-]+", "_", value, flags=re.UNICODE)
    return value.strip("._") or "pdf"


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def extract_pymupdf4llm(pdf_path: Path, out_dir: Path, include_json: bool) -> tuple[list[str], dict[str, str]]:
    import pymupdf4llm

    engine_status: dict[str, str] = {}
    page_markdowns: list[str] = []

    try:
      chunks = pymupdf4llm.to_markdown(str(pdf_path), page_chunks=True, show_progress=False)
      if isinstance(chunks, list):
          for chunk in chunks:
              page_markdowns.append(str(chunk.get("text", "")))
          write_json(out_dir / "pymupdf4llm.page_chunks.json", chunks)
      else:
          page_markdowns = [str(chunks)]
      write_text(out_dir / "pymupdf4llm.md", "\n\n--- PAGE BREAK ---\n\n".join(page_markdowns))
      engine_status["pymupdf4llm_markdown"] = "ok"
    except Exception as exc:
      engine_status["pymupdf4llm_markdown"] = f"error: {exc}"

    if include_json:
      try:
        json_text = pymupdf4llm.to_json(str(pdf_path), show_progress=False)
        write_text(out_dir / "pymupdf4llm.layout.json", json_text)
        engine_status["pymupdf4llm_json"] = "ok"
      except Exception as exc:
        engine_status["pymupdf4llm_json"] = f"error: {exc}"
    else:
      engine_status["pymupdf4llm_json"] = "skipped"

    return page_markdowns, engine_status


def extract_pdfplumber(
    pdf_path: Path,
    out_dir: Path,
    page_markdowns: list[str],
    include_text_table_strategy: bool,
    include_debug_images: bool,
) -> tuple[list[PageMetrics], dict[str, str]]:
    import pdfplumber

    engine_status: dict[str, str] = {}
    pages_payload: list[dict[str, Any]] = []
    metrics: list[PageMetrics] = []
    tables_dir = out_dir / "tables"
    debug_dir = out_dir / "debug"
    tables_dir.mkdir(parents=True, exist_ok=True)
    debug_dir.mkdir(parents=True, exist_ok=True)

    table_settings_candidates = [("lines", {"vertical_strategy": "lines", "horizontal_strategy": "lines"})]
    if include_text_table_strategy:
        table_settings_candidates.append(("text", {"vertical_strategy": "text", "horizontal_strategy": "text"}))

    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            for index, page in enumerate(pdf.pages, start=1):
                errors: list[str] = []
                text = page.extract_text(layout=True) or ""
                words = page.extract_words() or []
                chars = page.chars or []
                found_tables: list[dict[str, Any]] = []

                for settings_name, table_settings in table_settings_candidates:
                    try:
                        table_objects = page.find_tables(table_settings=table_settings)
                        for table_index, table in enumerate(table_objects, start=1):
                            rows = table.extract() or []
                            if not rows:
                                continue
                            table_id = f"page_{index:03d}_{settings_name}_{table_index:02d}"
                            csv_path = tables_dir / f"{table_id}.csv"
                            with csv_path.open("w", newline="", encoding="utf-8") as handle:
                                writer = csv.writer(handle)
                                writer.writerows(rows)
                            found_tables.append(
                                {
                                    "id": table_id,
                                    "settings": settings_name,
                                    "bbox": table.bbox,
                                    "rows": len(rows),
                                    "cols_max": max((len(row) for row in rows), default=0),
                                    "csv": str(csv_path),
                                }
                            )
                    except Exception as exc:
                        errors.append(f"table_{settings_name}: {exc}")

                if include_debug_images:
                    try:
                        image = page.to_image(resolution=120)
                        image.draw_rects(words[:500], stroke=(0, 255, 0), fill=None)
                        image.save(str(debug_dir / f"page_{index:03d}_words.png"), format="PNG")
                    except Exception as exc:
                        errors.append(f"debug_image: {exc}")

                combined_text = "\n".join([text, page_markdowns[index - 1] if index - 1 < len(page_markdowns) else ""])
                signals = {name: len(pattern.findall(combined_text)) for name, pattern in SIGNALS.items()}
                replacement_chars = combined_text.count("\ufffd") + combined_text.count("�")
                area_mentions = AREA_VALUE_PATTERN.findall(combined_text)
                area_counts = Counter(area_mentions)
                repeated_area = area_counts.most_common(1)[0] if area_counts else None
                repeated_area_warning = None
                if repeated_area and repeated_area[1] >= 4:
                    repeated_area_warning = (
                        f"Area {repeated_area[0]} apareceu {repeated_area[1]} vezes; "
                        "possivel repeticao/contaminacao de OCR ou legenda."
                    )
                native_chars = len(text.strip())
                md_chars = len(page_markdowns[index - 1].strip()) if index - 1 < len(page_markdowns) else 0
                needs_ocr = native_chars < 80 and md_chars < 80
                numeric_trust = 100
                if replacement_chars:
                    numeric_trust -= min(45, replacement_chars // 10)
                if repeated_area_warning:
                    numeric_trust -= 35
                if len(area_mentions) == 0 and signals["area_m2"] > 0:
                    numeric_trust -= 25
                if needs_ocr:
                    numeric_trust -= 50
                numeric_trust = max(0, min(100, numeric_trust))

                page_metric = PageMetrics(
                    page=index,
                    width=float(page.width),
                    height=float(page.height),
                    pymupdf_markdown_chars=md_chars,
                    pdfplumber_text_chars=native_chars,
                    pdfplumber_words=len(words),
                    pdfplumber_tables=len(found_tables),
                    pdfplumber_chars=len(chars),
                    replacement_chars=replacement_chars,
                    area_mentions=area_mentions[:80],
                    repeated_area_warning=repeated_area_warning,
                    numeric_trust_score=numeric_trust,
                    needs_ocr_review=needs_ocr,
                    signals=signals,
                    errors=errors,
                )
                metrics.append(page_metric)
                pages_payload.append(
                    {
                        "metrics": asdict(page_metric),
                        "text": text,
                        "words": words,
                        "words_sample": words[:200],
                        "tables": found_tables,
                    }
                )
        write_json(out_dir / "pdfplumber.pages.json", pages_payload)
        engine_status["pdfplumber"] = "ok"
    except Exception as exc:
        engine_status["pdfplumber"] = f"error: {exc}"

    return metrics, engine_status


def render_pages_with_pymupdf(pdf_path: Path, out_dir: Path) -> tuple[int, dict[str, str]]:
    import fitz

    status: dict[str, str] = {}
    render_dir = out_dir / "pages_png"
    render_dir.mkdir(parents=True, exist_ok=True)
    try:
        doc = fitz.open(str(pdf_path))
        for index, page in enumerate(doc, start=1):
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
            pix.save(str(render_dir / f"page_{index:03d}.png"))
        page_count = doc.page_count
        doc.close()
        status["pymupdf_render"] = "ok"
        return page_count, status
    except Exception as exc:
        status["pymupdf_render"] = f"error: {exc}"
        return 0, status


def summarize(metrics: list[PageMetrics]) -> dict[str, Any]:
    total_pages = len(metrics)
    total_text = sum(page.pdfplumber_text_chars for page in metrics)
    total_md = sum(page.pymupdf_markdown_chars for page in metrics)
    total_words = sum(page.pdfplumber_words for page in metrics)
    total_tables = sum(page.pdfplumber_tables for page in metrics)
    needs_ocr_pages = [page.page for page in metrics if page.needs_ocr_review]
    numeric_trust_scores = [page.numeric_trust_score for page in metrics]
    repeated_area_warnings = [
        {"page": page.page, "warning": page.repeated_area_warning}
        for page in metrics
        if page.repeated_area_warning
    ]
    replacement_chars = sum(page.replacement_chars for page in metrics)
    signal_totals = {
        name: sum((page.signals or {}).get(name, 0) for page in metrics)
        for name in SIGNALS
    }
    score = 0
    if total_text or total_md:
        score += 35
    if total_words >= 30:
        score += 25
    if total_tables:
        score += 15
    if any(value > 0 for value in signal_totals.values()):
        score += 15
    if not needs_ocr_pages:
        score += 10

    return {
        "pages": total_pages,
        "total_pdfplumber_text_chars": total_text,
        "total_pymupdf_markdown_chars": total_md,
        "total_pdfplumber_words": total_words,
        "total_tables": total_tables,
        "needs_ocr_review_pages": needs_ocr_pages,
        "numeric_trust_score": round(sum(numeric_trust_scores) / len(numeric_trust_scores), 2)
        if numeric_trust_scores
        else 0,
        "replacement_chars": replacement_chars,
        "repeated_area_warnings": repeated_area_warnings,
        "signals": signal_totals,
        "coverage_score_heuristic": min(score, 100),
    }


def write_markdown_report(report: PdfReport, out_dir: Path) -> None:
    lines = [
        f"# Reader Lab - {Path(report.file).name}",
        "",
        f"- SHA256: `{report.sha256}`",
        f"- Paginas: {report.page_count}",
        f"- Tamanho: {report.size_bytes} bytes",
        f"- Tempo: {report.elapsed_seconds:.2f}s",
        f"- Score de cobertura: {report.summary['coverage_score_heuristic']}%",
        f"- Score de confianca numerica: {report.summary['numeric_trust_score']}%",
        "",
        "## Motores",
    ]
    lines.extend(f"- {name}: {status}" for name, status in report.engines.items())
    lines.extend(["", "## Resumo", "```json", json.dumps(report.summary, ensure_ascii=False, indent=2), "```", "", "## Paginas"])

    for page in report.pages:
        lines.extend(
            [
                f"### Pagina {page.page}",
                f"- PyMuPDF4LLM Markdown chars: {page.pymupdf_markdown_chars}",
                f"- pdfplumber texto chars: {page.pdfplumber_text_chars}",
                f"- pdfplumber palavras: {page.pdfplumber_words}",
                f"- tabelas detectadas: {page.pdfplumber_tables}",
                f"- precisa revisar OCR: {'sim' if page.needs_ocr_review else 'nao'}",
                f"- confianca numerica: {page.numeric_trust_score}%",
                f"- caracteres corrompidos: {page.replacement_chars}",
                f"- sinais: `{json.dumps(page.signals or {}, ensure_ascii=False)}`",
            ]
        )
        if page.repeated_area_warning:
            lines.append(f"- alerta de area repetida: {page.repeated_area_warning}")
        if page.errors:
            lines.append(f"- erros/alertas: `{json.dumps(page.errors, ensure_ascii=False)}`")
        lines.append("")

    write_text(out_dir / "reader_report.md", "\n".join(lines))


def analyze_pdf(
    pdf_path: Path,
    output_root: Path,
    include_pymupdf_json: bool,
    include_text_table_strategy: bool,
    include_debug_images: bool,
) -> PdfReport:
    started = time.perf_counter()
    pdf_out = output_root / safe_slug(pdf_path.stem)
    pdf_out.mkdir(parents=True, exist_ok=True)

    engines: dict[str, str] = {}
    page_count, render_status = render_pages_with_pymupdf(pdf_path, pdf_out)
    engines.update(render_status)

    page_markdowns, pymupdf_status = extract_pymupdf4llm(pdf_path, pdf_out, include_pymupdf_json)
    engines.update(pymupdf_status)

    pages, pdfplumber_status = extract_pdfplumber(
        pdf_path,
        pdf_out,
        page_markdowns,
        include_text_table_strategy,
        include_debug_images,
    )
    engines.update(pdfplumber_status)

    if not page_count:
        page_count = max(len(page_markdowns), len(pages))

    report = PdfReport(
        file=str(pdf_path),
        sha256=sha256_file(pdf_path),
        size_bytes=pdf_path.stat().st_size,
        page_count=page_count,
        elapsed_seconds=time.perf_counter() - started,
        engines=engines,
        pages=pages,
        summary=summarize(pages),
    )
    write_json(pdf_out / "reader_report.json", asdict(report))
    write_markdown_report(report, pdf_out)
    return report


def discover_pdfs(paths: list[Path]) -> list[Path]:
    pdfs: list[Path] = []
    for path in paths:
        if path.is_file() and path.suffix.lower() == ".pdf":
            pdfs.append(path)
        elif path.is_dir():
            pdfs.extend(sorted(path.rglob("*.pdf")))
    return pdfs


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate PDF extraction fidelity before EVIS budgeting.")
    parser.add_argument("paths", nargs="+", type=Path, help="PDF files or directories containing PDFs.")
    parser.add_argument("--out", type=Path, default=Path("scratch") / "reader-lab", help="Output directory.")
    parser.add_argument("--pymupdf-json", action="store_true", help="Run PyMuPDF4LLM deep JSON layout extraction.")
    parser.add_argument("--text-tables", action="store_true", help="Also try pdfplumber text-alignment table detection.")
    parser.add_argument("--no-debug-images", action="store_true", help="Skip pdfplumber debug PNG generation.")
    args = parser.parse_args()

    pdfs = discover_pdfs(args.paths)
    if not pdfs:
        print("Nenhum PDF encontrado.", file=sys.stderr)
        return 2

    run_dir = args.out / time.strftime("%Y%m%d-%H%M%S")
    run_dir.mkdir(parents=True, exist_ok=True)
    reports = []
    for pdf in pdfs:
        print(f"[reader-lab] lendo {pdf}")
        reports.append(
            analyze_pdf(
                pdf,
                run_dir,
                include_pymupdf_json=args.pymupdf_json,
                include_text_table_strategy=args.text_tables,
                include_debug_images=not args.no_debug_images,
            )
        )

    index = {
        "run_dir": str(run_dir),
        "pdf_count": len(reports),
        "reports": [
            {
                "file": report.file,
                "page_count": report.page_count,
                "coverage_score": report.summary["coverage_score_heuristic"],
                "numeric_trust_score": report.summary["numeric_trust_score"],
                "needs_ocr_review_pages": report.summary["needs_ocr_review_pages"],
                "total_tables": report.summary["total_tables"],
            }
            for report in reports
        ],
    }
    write_json(run_dir / "index.json", index)
    write_text(
        run_dir / "index.md",
        "\n".join(
            [
                "# Reader Lab - indice",
                "",
                *[
                    f"- {Path(item['file']).name}: cobertura {item['coverage_score']}%, "
                    f"confianca numerica {item['numeric_trust_score']}%, paginas {item['page_count']}, "
                    f"tabelas {item['total_tables']}, OCR revisar {item['needs_ocr_review_pages']}"
                    for item in index["reports"]
                ],
                "",
            ]
        ),
    )
    print(f"[reader-lab] concluido: {run_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
