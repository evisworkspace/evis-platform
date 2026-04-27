from __future__ import annotations

import argparse
import json
import math
import time
from pathlib import Path
from typing import Any


WET_ROOM_KEYWORDS = ("BANHEIRO", "COZINHA", "LAVANDERIA", "AREA DE SERVICO", "ÁREA DE SERVIÇO", "LAVABO")
MIN_CONFIDENCE = 0.6


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S")


def parse_number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.strip().replace("m²", "").replace("m2", "").replace(",", ".")
        cleaned = "".join(ch for ch in cleaned if ch.isdigit() or ch in ".-")
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def latest_validated_output(search_root: Path) -> Path:
    files = sorted(
        search_root.glob("**/route_executor/versions/evis_output_pos_llm_*.json"),
        key=lambda item: item.stat().st_mtime,
        reverse=True,
    )
    if not files:
        raise FileNotFoundError("Nenhum evis_output_pos_llm_*.json encontrado em scratch/reader-lab.")
    return files[0]


def is_wet_room(name: str) -> bool:
    upper = name.upper()
    return any(keyword in upper for keyword in WET_ROOM_KEYWORDS)


def has_active_inconsistency(data: dict[str, Any]) -> bool:
    post_route = data.get("roteamento_evis_pos_llm", {})
    if post_route.get("proximo_passo") == "quantitativos":
        return False
    if data.get("corrigido_por_llm") and parse_number(data.get("confianca_pos_llm")):
        return False
    checks = data.get("validacoes_semanticas", [])
    return any(item.get("status") == "conflito" for item in checks if isinstance(item, dict))


def service_item(
    ambiente: str,
    servico: str,
    unidade: str,
    quantidade: float,
    origem: str,
    status: str,
    confianca: float,
) -> dict[str, Any]:
    return {
        "ambiente": ambiente,
        "servico": servico,
        "unidade": unidade,
        "quantidade": round(quantidade, 2),
        "origem": origem,
        "status": status,
        "confianca": round(max(0.0, min(1.0, confianca)), 2),
    }


def generate_items_for_room(room: dict[str, Any]) -> list[dict[str, Any]]:
    ambiente = str(room.get("nome") or room.get("ambiente") or "").strip().upper()
    area = parse_number(room.get("area_m2"))
    confidence = parse_number(room.get("confianca")) or 0.0
    if not ambiente or area is None:
        return []

    direct_conf = confidence
    estimated_conf = max(0.0, confidence - 0.15)
    rodape_conf = max(0.0, confidence - 0.2)
    items = [
        service_item(ambiente, "Piso", "m2", area, "area_validada", "ok", direct_conf),
        service_item(ambiente, "Forro", "m2", area, "area_validada", "ok", direct_conf),
        service_item(ambiente, "Pintura parede", "m2", area * 2.7, "regra", "estimado", estimated_conf),
        service_item(ambiente, "Rodape", "m", math.sqrt(area) * 4, "regra", "estimado", rodape_conf),
    ]
    if is_wet_room(ambiente):
        items.append(
            service_item(ambiente, "Revestimento parede", "m2", area * 2.0, "regra", "estimado", estimated_conf)
        )
    return items


def generate_quantitativos(data: dict[str, Any], source_path: Path) -> dict[str, Any]:
    alerts: list[str] = []
    rooms = data.get("ambientes_validados_llm") or []
    if not isinstance(rooms, list):
        rooms = []

    if has_active_inconsistency(data):
        alerts.append("Inconsistencia ativa detectada; quantitativos nao gerados.")
        return {
            "metadata": {
                "generated_at": now_iso(),
                "source_file": str(source_path),
                "status": "bloqueado",
            },
            "summary": {
                "ambientes_processados": 0,
                "itens_gerados": 0,
                "itens_diretos": 0,
                "itens_estimados": 0,
            },
            "alerts": alerts,
            "items": [],
        }

    items: list[dict[str, Any]] = []
    processed_rooms = 0
    skipped_rooms = 0
    for room in rooms:
        confidence = parse_number(room.get("confianca")) or 0.0
        if confidence < MIN_CONFIDENCE:
            skipped_rooms += 1
            alerts.append(f"Ambiente ignorado por baixa confianca: {room.get('nome')} ({confidence:.2f}).")
            continue
        room_items = generate_items_for_room(room)
        if not room_items:
            skipped_rooms += 1
            alerts.append(f"Ambiente sem area valida: {room.get('nome')}.")
            continue
        processed_rooms += 1
        items.extend(room_items)

    direct_items = sum(1 for item in items if item["status"] == "ok")
    estimated_items = sum(1 for item in items if item["status"] == "estimado")

    if processed_rooms == 0:
        alerts.append("Nenhum ambiente elegivel para quantitativos fisicos.")

    return {
        "metadata": {
            "generated_at": now_iso(),
            "source_file": str(source_path),
            "status": "ok" if items else "vazio",
            "corrigido_por_llm": data.get("corrigido_por_llm", False),
            "confianca_pos_llm": data.get("confianca_pos_llm"),
            "score_final_hibrido": data.get("score_final_hibrido"),
        },
        "summary": {
            "ambientes_processados": processed_rooms,
            "ambientes_ignorados": skipped_rooms,
            "itens_gerados": len(items),
            "itens_diretos": direct_items,
            "itens_estimados": estimated_items,
        },
        "alerts": alerts,
        "items": items,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="EVIS Etapa 1 - gerar quantitativos fisicos a partir da Etapa 0 validada.")
    parser.add_argument("--input", type=Path, default=None, help="Arquivo evis_output_pos_llm_*.json. Se omitido, usa o mais recente.")
    parser.add_argument("--search-root", type=Path, default=Path("scratch/reader-lab"), help="Raiz para localizar o output validado.")
    args = parser.parse_args()

    input_path = args.input.resolve() if args.input else latest_validated_output(args.search_root.resolve())
    data = read_json(input_path)
    output = generate_quantitativos(data, input_path)
    output_path = input_path.parents[2] / "evis_quantitativos_output.json"
    write_json(output_path, output)

    print(f"[evis-quantitativos] origem: {input_path}")
    print(f"[evis-quantitativos] salvo: {output_path}")
    print(
        f"[evis-quantitativos] ambientes={output['summary']['ambientes_processados']} "
        f"itens={output['summary']['itens_gerados']} "
        f"estimados={output['summary']['itens_estimados']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
