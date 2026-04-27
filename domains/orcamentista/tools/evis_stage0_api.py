from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[3]
TOOLS_DIR = Path(__file__).resolve().parent
READER_LAB = TOOLS_DIR / "reader_lab.py"
INTERPRETER = TOOLS_DIR / "evis_pdf_interpreter.py"
ROUTE_EXECUTOR = TOOLS_DIR / "evis_route_executor.py"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_path(value: str | None) -> Path:
    if not value:
        raise ValueError("Caminho obrigatorio nao informado.")
    path = Path(value)
    if not path.is_absolute():
        path = ROOT / path
    return path.resolve()


def relative_or_absolute(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def run_command(args: list[str], timeout: int = 900) -> dict[str, Any]:
    started = time.time()
    proc = subprocess.run(
        args,
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=timeout,
        encoding="utf-8",
        errors="replace",
    )
    return {
        "ok": proc.returncode == 0,
        "returncode": proc.returncode,
        "duration_seconds": round(time.time() - started, 2),
        "stdout": proc.stdout,
        "stderr": proc.stderr,
        "command": args,
    }


def latest_reader_output_from_stdout(stdout: str) -> str | None:
    for line in reversed(stdout.splitlines()):
        marker = "[reader-lab] concluido:"
        if marker in line:
            return line.split(marker, 1)[1].strip()
    return None


def stage0_run_reader(payload: dict[str, Any]) -> dict[str, Any]:
    project_dir = resolve_path(payload.get("project_dir") or payload.get("path"))
    if not project_dir.exists():
        raise FileNotFoundError(f"Pasta nao encontrada: {project_dir}")

    args = [sys.executable, str(READER_LAB), str(project_dir)]
    if payload.get("no_debug_images", True):
        args.append("--no-debug-images")
    result = run_command(args, timeout=int(payload.get("timeout", 900)))
    output_dir = latest_reader_output_from_stdout(result["stdout"])
    result["reader_output_dir"] = output_dir
    return result


def stage0_run_interpreter(payload: dict[str, Any]) -> dict[str, Any]:
    reader_dir = resolve_path(payload.get("reader_dir") or payload.get("path"))
    if not reader_dir.exists():
        raise FileNotFoundError(f"Reader dir nao encontrado: {reader_dir}")

    result = run_command([sys.executable, str(INTERPRETER), str(reader_dir)], timeout=int(payload.get("timeout", 240)))
    output_path = reader_dir / "evis_interpreter_output.json"
    result["evis_output_path"] = relative_or_absolute(output_path)
    result["evis_output"] = read_json(output_path) if output_path.exists() else None
    return result


def stage0_run_executor(payload: dict[str, Any]) -> dict[str, Any]:
    evis_output = resolve_path(payload.get("evis_output") or payload.get("path"))
    if not evis_output.exists():
        raise FileNotFoundError(f"evis_interpreter_output nao encontrado: {evis_output}")

    args = [
        sys.executable,
        str(ROUTE_EXECUTOR),
        str(evis_output),
        "--provider",
        str(payload.get("provider") or "auto"),
        "--llm-call-limit",
        str(payload.get("llm_call_limit") or 2),
    ]
    if payload.get("live"):
        args.append("--live")

    result = run_command(args, timeout=int(payload.get("timeout", 240)))
    route_path = evis_output.parent / "route_executor" / "route_execution.json"
    result["route_execution_path"] = relative_or_absolute(route_path)
    result["route_execution"] = read_json(route_path) if route_path.exists() else None
    return result


def stage0_run_all(payload: dict[str, Any]) -> dict[str, Any]:
    reader = stage0_run_reader(payload)
    output_dir_raw = reader.get("reader_output_dir")
    if not reader.get("ok") or not output_dir_raw:
        return {"ok": False, "reader": reader, "erro": "Reader Lab nao concluiu."}

    output_dir = resolve_path(output_dir_raw)
    folha_results = []
    for folha_dir in sorted(output_dir.glob("Folha_*")):
        if not folha_dir.is_dir():
            continue
        interpreter = stage0_run_interpreter({"reader_dir": str(folha_dir)})
        executor = None
        evis_path = folha_dir / "evis_interpreter_output.json"
        if evis_path.exists():
            executor = stage0_run_executor(
                {
                    "evis_output": str(evis_path),
                    "provider": payload.get("provider") or "auto",
                    "live": bool(payload.get("live")),
                    "llm_call_limit": payload.get("llm_call_limit") or 2,
                }
            )
        folha_results.append(
            {
                "folha_dir": relative_or_absolute(folha_dir),
                "interpreter": interpreter,
                "executor": executor,
            }
        )

    return {
        "ok": True,
        "reader": reader,
        "reader_output_dir": relative_or_absolute(output_dir),
        "folhas": folha_results,
    }


class Stage0Handler(BaseHTTPRequestHandler):
    server_version = "EVISStage0API/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[stage0-api] {self.address_string()} - {format % args}")

    def _send(self, status: int, payload: Any) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self._send(204, {})

    def _read_payload(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw) if raw.strip() else {}

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/health":
                self._send(200, {"ok": True, "root": str(ROOT), "tools_dir": str(TOOLS_DIR)})
                return
            if parsed.path == "/stage0/read-json":
                query = parse_qs(parsed.query)
                path = resolve_path((query.get("path") or [None])[0])
                self._send(200, {"ok": True, "path": relative_or_absolute(path), "data": read_json(path)})
                return
            self._send(404, {"ok": False, "erro": f"Endpoint nao encontrado: {parsed.path}"})
        except Exception as exc:
            self._send(500, {"ok": False, "erro": str(exc)})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            payload = self._read_payload()
            if parsed.path == "/stage0/run-reader":
                self._send(200, stage0_run_reader(payload))
            elif parsed.path == "/stage0/run-interpreter":
                self._send(200, stage0_run_interpreter(payload))
            elif parsed.path == "/stage0/run-executor":
                self._send(200, stage0_run_executor(payload))
            elif parsed.path == "/stage0/run-all":
                self._send(200, stage0_run_all(payload))
            else:
                self._send(404, {"ok": False, "erro": f"Endpoint nao encontrado: {parsed.path}"})
        except subprocess.TimeoutExpired as exc:
            self._send(504, {"ok": False, "erro": f"Timeout: {exc}"})
        except Exception as exc:
            self._send(500, {"ok": False, "erro": str(exc)})


def main() -> int:
    parser = argparse.ArgumentParser(description="EVIS Etapa 0 local API for dashboard control.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), Stage0Handler)
    print(f"[stage0-api] online em http://{args.host}:{args.port}")
    print("[stage0-api] endpoints: /health, /stage0/run-reader, /stage0/run-interpreter, /stage0/run-executor, /stage0/run-all")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[stage0-api] encerrando...")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
