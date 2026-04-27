from __future__ import annotations

import argparse
import csv
import html
import json
import re
import statistics
import time
from collections import Counter
from pathlib import Path
from typing import Any


ROOM_PATTERN = re.compile(
    r"\b(SALA(?: DE ESTAR)?|COZINHA|DORMIT[OÓ]RIO\s*\d?|BANHEIRO\s*\d?|ESCRIT[OÓ]RIO|LAVANDERIA|VARANDA|CORREDOR)\b",
    re.I,
)
AREA_PATTERN = re.compile(r"(?<!\d)(\d{1,3}(?:[,.]\d{1,2})?)\s*(?:m\s*\[?2\]?|m2|m²|m\s*²)\b", re.I)
AREA_VALUE_ONLY_PATTERN = re.compile(r"^\d{1,3}(?:[,.]\d{1,2})?$")
SCALE_PATTERN = re.compile(r"\b(?:escala\s*)?(1\s*:\s*\d{2,4}|GERAL/POR DESENHO)\b", re.I)
SHEET_PATTERN = re.compile(r"\b(\d{2}\s*/\s*\d{2})\b")
DATE_PATTERN = re.compile(r"\b(\d{2}\s*/\s*\d{4}|[a-z]{3}/\d{4})\b", re.I)

REGION_KEYWORDS = {
    "quadro_areas": ["QUADRO DE AREAS", "QUADRO DE ÁREAS", "AREA TOTAL", "ÁREA TOTAL", "AREA UTIL", "ÁREA ÚTIL"],
    "legenda_acabamentos": ["LEGENDA ACABAMENTOS", "ACABAMENTOS - PAREDE", "ACABAMENTOS - TETO", "ACABAMENTOS - PISO"],
    "carimbo": ["PROJETO ARQUITETONICO", "PROJETO ARQUITETÔNICO", "AUTOR DO PROJETO", "PRANCHA", "RESPONSAVEL TECNICO"],
    "planta": ["PLANTA PAVIMENTO", "PLANTA DE IMPLANTACAO", "PLANTA DE IMPLANTAÇÃO", "PLANTA - PAVIMENTO"],
    "implantacao": ["SITUACAO", "SITUAÇÃO", "LOTE", "RUA", "NORTE", "GUIA REBAIXADA"],
    "infraestrutura": ["INFRAESTRUTURA", "REDE", "SANEPAR", "COPEL", "ESGOTO", "AGUA POTAVEL"],
}

ACABAMENTO_CATEGORIES = {
    "A": "parede",
    "B": "teto",
    "C": "piso",
}

AREA_CATEGORY_RULES = [
    ("area_lote", ["AREA DO LOTE", "DADOS DO LOTE", "LOTE"]),
    ("area_total", ["AREA TOTAL", "TOTAL A SER CONSTRUIDA", "TOTAL A SER CONSTRUIR"]),
    ("area_construida", ["AREA A SER CONSTRUIDA", "AREA CONSTRUIDA", "TERREO"]),
    ("area_projecao", ["AREA DE PROJECAO", "PROJECAO"]),
    ("area_permeavel", ["AREA PERMEAVEL", "PERMEABILIDADE"]),
]

DISCIPLINE_KEYWORDS = {
    "arquitetonico": ["PROJETO ARQUITETONICO", "PLANTA", "FACHADA", "CORTE", "COBERTURA"],
    "implantacao": ["IMPLANTACAO", "SITUACAO", "LOTE", "RUA", "NORTE"],
    "cortes": ["CORTE AA", "CORTE BB", "CORTE CC", "CORTE DD", "CORTES"],
    "fachadas": ["FACHADA NORTE", "FACHADA SUL", "FACHADA LESTE", "FACHADA OESTE", "ELEVACOES"],
    "cobertura": ["COBERTURA", "TELHA", "INC.10", "INC10"],
    "infraestrutura": ["INFRAESTRUTURA", "SANEPAR", "COPEL", "ESGOTO", "AGUA POTAVEL"],
}

REGION_PRIORITY = {
    "quadro_areas": 1.0,
    "legenda_acabamentos": 0.75,
    "carimbo": 0.7,
    "implantacao": 0.55,
    "infraestrutura": 0.5,
    "planta": 0.35,
    "desconhecida": 0.25,
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def strip_accents_light(text: str) -> str:
    repl = {
        "Á": "A",
        "À": "A",
        "Â": "A",
        "Ã": "A",
        "É": "E",
        "Ê": "E",
        "Í": "I",
        "Ó": "O",
        "Ô": "O",
        "Õ": "O",
        "Ú": "U",
        "Ç": "C",
        "á": "a",
        "à": "a",
        "â": "a",
        "ã": "a",
        "é": "e",
        "ê": "e",
        "í": "i",
        "ó": "o",
        "ô": "o",
        "õ": "o",
        "ú": "u",
        "ç": "c",
    }
    for src, dst in repl.items():
        text = text.replace(src, dst)
    return text


def normalize_text(text: str) -> str:
    text = html.unescape(text)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("\ufffd", "�")
    text = re.sub(r"\(cid:\d+\)", "�", text)
    return text


def clean_label(text: str) -> str:
    text = strip_accents_light(text)
    text = re.sub(r"[^A-Za-z0-9 /_-]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip(" -_/")
    return text.upper()


def load_markdown(reader_dir: Path) -> str:
    path = reader_dir / "pymupdf4llm.md"
    return normalize_text(path.read_text(encoding="utf-8")) if path.exists() else ""


def load_pdfplumber(reader_dir: Path) -> list[dict[str, Any]]:
    path = reader_dir / "pdfplumber.pages.json"
    return read_json(path) if path.exists() else []


def load_tables(reader_dir: Path) -> list[dict[str, Any]]:
    tables: list[dict[str, Any]] = []
    for csv_path in sorted((reader_dir / "tables").glob("*.csv")):
        rows: list[list[str]] = []
        with csv_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.reader(handle)
            for row in reader:
                rows.append([normalize_text(cell).strip() for cell in row])
        flat = "\n".join(cell for row in rows for cell in row if cell)
        tables.append(
            {
                "id": csv_path.stem,
                "path": str(csv_path),
                "rows": rows,
                "text": flat,
                "row_count": len(rows),
                "col_max": max((len(row) for row in rows), default=0),
            }
        )
    return tables


def table_bbox_by_id(pages: list[dict[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for page in pages:
        for table in page.get("tables", []):
            result[table["id"]] = table.get("bbox")
    return result


def page_words(pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    words: list[dict[str, Any]] = []
    for page in pages:
        page_number = page.get("metrics", {}).get("page")
        for word in page.get("words", []) or []:
            if isinstance(word, dict):
                words.append({**word, "page": page_number})
    return words


def word_center(word: dict[str, Any]) -> tuple[float, float]:
    return (
        (float(word.get("x0", 0)) + float(word.get("x1", 0))) / 2,
        (float(word.get("top", 0)) + float(word.get("bottom", 0))) / 2,
    )


def words_in_bbox(words: list[dict[str, Any]], bbox: list[float] | None, margin: float = 0) -> list[dict[str, Any]]:
    if not bbox:
        return []
    x0, top, x1, bottom = map(float, bbox)
    return [
        word
        for word in words
        if x0 - margin <= word_center(word)[0] <= x1 + margin
        and top - margin <= word_center(word)[1] <= bottom + margin
    ]


def bbox_coverage_ratio(bbox: list[float] | None, pages: list[dict[str, Any]]) -> float | None:
    if not bbox or not pages:
        return None
    x0, top, x1, bottom = map(float, bbox)
    page_metrics = pages[0].get("metrics", {})
    page_area = float(page_metrics.get("width", 0)) * float(page_metrics.get("height", 0))
    if page_area <= 0:
        return None
    return round(max(0.0, ((x1 - x0) * (bottom - top)) / page_area), 3)


def infer_table_region_type(table_text: str) -> str:
    text = strip_accents_light(table_text).upper()
    if "ACABAMENTOS" in text:
        return "legenda_acabamentos"
    if "AREA" in text and ("M2" in text or "M 2" in text or "UTIL" in text):
        return "quadro_areas"
    if "PROJETO ARQUITETONICO" in text or "PRANCHA" in text or "AUTOR DO PROJETO" in text:
        return "carimbo"
    if "REDE" in text or "SANEPAR" in text or "COPEL" in text:
        return "infraestrutura"
    return "desconhecida"


def table_region_index(regions: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    indexed: dict[str, dict[str, Any]] = {}
    for region in regions:
        table_id = region.get("table_id")
        if not table_id:
            continue
        current = indexed.get(table_id)
        if not current or REGION_PRIORITY.get(region["tipo"], 0) > REGION_PRIORITY.get(current["tipo"], 0):
            indexed[table_id] = region
    return indexed


def detect_regions(markdown: str, pages: list[dict[str, Any]], tables: list[dict[str, Any]]) -> list[dict[str, Any]]:
    regions: list[dict[str, Any]] = []
    normalized_doc = strip_accents_light(markdown).upper()
    bboxes = table_bbox_by_id(pages)
    words = page_words(pages)

    for region, keywords in REGION_KEYWORDS.items():
        hits = [kw for kw in keywords if strip_accents_light(kw).upper() in normalized_doc]
        if hits:
            regions.append(
                {
                    "tipo": region,
                    "origem": "markdown",
                    "keywords": hits,
                    "confianca": 0.65,
                }
            )

    for table in tables:
        inferred = infer_table_region_type(table["text"])
        text_norm = strip_accents_light(table["text"]).upper()
        matched = [] if inferred == "desconhecida" else [inferred]
        for region, keywords in REGION_KEYWORDS.items():
            if any(strip_accents_light(kw).upper() in text_norm for kw in keywords):
                matched.append(region)
        if matched:
            bbox = bboxes.get(table["id"])
            region_words = words_in_bbox(words, bbox, margin=8)
            numeric_density = len([word for word in region_words if re.search(r"\d", str(word.get("text", "")))])
            coverage_ratio = bbox_coverage_ratio(bbox, pages)
            regions.append(
                {
                    "tipo": matched[0],
                    "origem": "tabela",
                    "table_id": table["id"],
                    "bbox": bbox,
                    "bbox_coverage_ratio": coverage_ratio,
                    "word_count": len(region_words),
                    "numeric_word_count": numeric_density,
                    "prioridade_regiao": REGION_PRIORITY.get(matched[0], 0.25),
                    "autoridade_dados": "alta" if matched[0] == "quadro_areas" else "contextual",
                    "confianca": 0.88 if matched[0] == inferred else 0.8,
                }
            )

    return regions


def repeated_values_from_metrics(pages: list[dict[str, Any]]) -> Counter[str]:
    values: list[str] = []
    for page in pages:
        metrics = page.get("metrics", {})
        values.extend(metrics.get("area_mentions") or [])
    return Counter(values)


def classify_sheet(markdown: str, regions: list[dict[str, Any]]) -> tuple[str, list[str]]:
    text = strip_accents_light(markdown).upper()
    disciplinas = [
        discipline
        for discipline, keywords in DISCIPLINE_KEYWORDS.items()
        if any(keyword in text for keyword in keywords)
    ]

    region_types = {region["tipo"] for region in regions}
    has_cortes = "cortes" in disciplinas
    has_fachadas = "fachadas" in disciplinas
    has_planta = "planta" in region_types or "PLANTA PAVIMENTO" in text
    has_implantacao = "implantacao" in region_types or "implantacao" in disciplinas
    has_cobertura = "cobertura" in disciplinas

    if has_cortes and has_fachadas:
        sheet_type = "cortes_fachadas"
    elif has_planta and has_implantacao:
        sheet_type = "planta_implantacao"
    elif has_planta and has_cobertura:
        sheet_type = "planta_cobertura"
    elif has_planta:
        sheet_type = "planta"
    elif has_implantacao:
        sheet_type = "implantacao"
    elif has_cobertura:
        sheet_type = "cobertura"
    else:
        sheet_type = "nao_classificada"

    return sheet_type, sorted(set(disciplinas))


def classify_area_candidate(candidate: dict[str, Any]) -> str:
    text = clean_label(" ".join([candidate.get("rotulo", ""), candidate.get("evidencia", "")]))
    if ROOM_PATTERN.search(text):
        return "area_ambiente"
    for category, keywords in AREA_CATEGORY_RULES:
        if any(keyword in text for keyword in keywords):
            return category
    return "area_outros"


def group_areas_by_category(area_candidates: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped = {
        "area_total": [],
        "area_ambientes": [],
        "area_lote": [],
        "area_construida": [],
        "area_projecao": [],
        "area_permeavel": [],
        "area_outros": [],
    }

    for candidate in area_candidates:
        category = candidate.get("categoria_area") or classify_area_candidate(candidate)
        if category == "area_ambiente":
            grouped["area_ambientes"].append(candidate)
        elif category in grouped:
            grouped[category].append(candidate)
        else:
            grouped["area_outros"].append(candidate)
    return grouped


def area_candidates_from_text(
    text: str,
    origin: str,
    repeated: Counter[str],
    source: str,
    region: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    region_type = region.get("tipo") if region else None
    region_priority = REGION_PRIORITY.get(region_type or "desconhecida", 0.25)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines:
        if not re.search(r"m\s*\[?2\]?|m2|m²|m\s*²", line, re.I):
            continue
        for match in AREA_PATTERN.finditer(line):
            raw_value = match.group(1)
            value = float(raw_value.replace(",", "."))
            label_part = line[: match.start()].strip()
            label = clean_label(label_part[-80:]) or "AREA_NAO_CLASSIFICADA"
            repeated_count = repeated.get(raw_value, 0)
            suspicious = repeated_count > 5
            if origin == "tabela" and region_type == "quadro_areas":
                confidence = 0.94
            elif origin == "tabela":
                confidence = 0.72
            else:
                confidence = 0.6
            motivos: list[str] = []
            if origin == "tabela" and region_type and region_type != "quadro_areas":
                motivos.append("fora_quadro_areas")
            if suspicious:
                confidence = min(confidence, 0.25)
                motivos.append("valor_repetido")
            if "�" in line or "(cid:" in line:
                suspicious = True
                confidence = min(confidence, 0.15)
                motivos.append("linha_corrompida")
            if value <= 0:
                suspicious = True
                confidence = min(confidence, 0.15)
                motivos.append("valor_zero_ou_invalido")
            candidates.append(
                {
                    "rotulo": label,
                    "valor_m2": value,
                    "valor_raw": raw_value,
                    "origem": origin,
                    "fonte": source,
                    "repeticoes_no_documento": repeated_count,
                    "suspeito": suspicious,
                    "motivos_suspeita": motivos,
                    "confianca": confidence,
                    "regiao_origem": region_type or ("tabela_sem_regiao" if origin == "tabela" else "texto_solto"),
                    "prioridade_regiao": region_priority,
                    "fonte_autoritativa": origin == "tabela" and region_type == "quadro_areas",
                    "evidencia": line[:250],
                }
            )
            candidates[-1]["categoria_area"] = classify_area_candidate(candidates[-1])
    return candidates


def extract_areas(
    markdown: str,
    tables: list[dict[str, Any]],
    pages: list[dict[str, Any]],
    regions: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    repeated = repeated_values_from_metrics(pages)
    indexed_regions = table_region_index(regions)
    candidates: list[dict[str, Any]] = []
    for table in tables:
        text_norm = strip_accents_light(table["text"]).upper()
        if "AREA" in text_norm or "M2" in text_norm or "M 2" in text_norm:
            candidates.extend(
                area_candidates_from_text(
                    table["text"],
                    "tabela",
                    repeated,
                    table["id"],
                    indexed_regions.get(table["id"]),
                )
            )
    candidates.extend(area_candidates_from_text(markdown, "texto_solto", repeated, "pymupdf4llm.md"))

    unique: dict[tuple[str, str, str], dict[str, Any]] = {}
    for candidate in candidates:
        key = (candidate["rotulo"], candidate["valor_raw"], candidate["origem"])
        current = unique.get(key)
        if not current or candidate["confianca"] > current["confianca"]:
            unique[key] = candidate
    return sorted(unique.values(), key=lambda item: (-item["confianca"], item["rotulo"], item["valor_m2"]))


def word_text(word: dict[str, Any]) -> str:
    return normalize_text(str(word.get("text", ""))).strip()


def word_number(word: dict[str, Any]) -> float | None:
    text = word_text(word).replace(",", ".")
    if AREA_VALUE_ONLY_PATTERN.fullmatch(text):
        try:
            return float(text)
        except ValueError:
            return None
    return None


def grouped_word_lines(words: list[dict[str, Any]], tolerance: float = 8) -> list[list[dict[str, Any]]]:
    lines: list[list[dict[str, Any]]] = []
    for word in sorted(words, key=lambda item: (item.get("page") or 0, float(item.get("top", 0)), float(item.get("x0", 0)))):
        _, y = word_center(word)
        if not lines:
            lines.append([word])
            continue
        last_y = statistics.mean(word_center(item)[1] for item in lines[-1])
        if word.get("page") == lines[-1][0].get("page") and abs(y - last_y) <= tolerance:
            lines[-1].append(word)
        else:
            lines.append([word])
    return [sorted(line, key=lambda item: float(item.get("x0", 0))) for line in lines]


def line_text(line: list[dict[str, Any]]) -> str:
    return " ".join(word_text(word) for word in line if word_text(word))


def has_area_unit_near(line: list[dict[str, Any]], index: int, lookahead: int = 3) -> bool:
    next_tokens = [word_text(word).lower() for word in line[index + 1 : index + 1 + lookahead]]
    if not next_tokens:
        return False
    if re.fullmatch(r"m2|m²", next_tokens[0], re.I):
        return True
    if next_tokens[0] == "m" and len(next_tokens) > 1 and re.fullmatch(r"\[?2\]?|²", next_tokens[1]):
        return True
    return False


def spatial_room_area_links(pages: list[dict[str, Any]], area_candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    repeated = repeated_values_from_metrics(pages)
    candidate_by_raw = {}
    for candidate in area_candidates:
        candidate_by_raw.setdefault(candidate["valor_raw"], []).append(candidate)

    links: list[dict[str, Any]] = []
    for line in grouped_word_lines(page_words(pages)):
        text = line_text(line)
        room_match = ROOM_PATTERN.search(text)
        if not room_match:
            continue

        room = clean_label(room_match.group(1))
        room_words = [word for word in line if clean_label(word_text(word)) in room]
        room_x = min((float(word.get("x0", 0)) for word in room_words), default=float(line[0].get("x0", 0)))
        numbers = []
        for index, word in enumerate(line):
            value = word_number(word)
            if value is None or not has_area_unit_near(line, index):
                continue
            raw = word_text(word)
            x, y = word_center(word)
            distance = abs(x - room_x)
            numbers.append((distance, raw, value, x, y))
        if not numbers:
            continue

        distance, raw_value, value, x, y = sorted(numbers, key=lambda item: item[0])[0]
        matched_candidates = candidate_by_raw.get(raw_value, [])
        repeated_count = repeated.get(raw_value, 0)
        line_numeric_count = len([word for word in line if word_number(word) is not None])
        distance_score = max(0.0, min(1.0, 1 - (distance / 450)))
        noise_score = max(0.0, min(1.0, 1 - max(0, line_numeric_count - 2) / 8))
        spatial_confidence = round((0.65 * distance_score) + (0.35 * noise_score), 2)
        suspicious = repeated_count > 5 or any(item.get("suspeito") for item in matched_candidates)
        confidence = round(min(0.78, max(0.35, spatial_confidence)), 2)
        status = "area_associada_por_coordenada"
        motivos: list[str] = []
        if suspicious:
            confidence = min(confidence, 0.25)
            status = "area_espacial_suspeita"
            motivos.append("valor_repetido_ou_suspeito")
        if line_numeric_count > 5:
            motivos.append("linha_numericamente_densa")
        links.append(
            {
                "nome": room,
                "area_m2": None if suspicious else value,
                "valor_raw": raw_value,
                "status": status,
                "confianca": confidence,
                "confianca_espacial": spatial_confidence,
                "origem_associacao": "pdfplumber_words",
                "distancia_area_ambiente_px": round(distance, 2),
                "densidade_numerica_linha": line_numeric_count,
                "bbox_aproximado": {
                    "x": round(x, 2),
                    "y": round(y, 2),
                    "page": line[0].get("page"),
                },
                "repeticoes_no_documento": repeated_count,
                "motivos_suspeita": motivos,
                "evidencia": text[:250],
            }
        )
    return links


def merge_room_candidates(text_rooms: list[dict[str, Any]], spatial_rooms: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for room in text_rooms + spatial_rooms:
        name = room["nome"]
        current = merged.get(name)
        if not current or room.get("confianca", 0) > current.get("confianca", 0):
            merged[name] = room
    return sorted(merged.values(), key=lambda item: item["nome"])


def extract_rooms(
    markdown: str,
    area_candidates: list[dict[str, Any]],
    pages: list[dict[str, Any]] | None = None,
    spatial_rooms: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    rooms: list[dict[str, Any]] = []
    seen: set[str] = set()
    for match in ROOM_PATTERN.finditer(markdown):
        room = clean_label(match.group(1))
        if not room or room in seen:
            continue
        seen.add(room)
        window = markdown[match.start() : match.start() + 160]
        area_match = AREA_PATTERN.search(window)
        area = None
        confidence = 0.45
        status = "sem_area_confiavel"
        if area_match:
            raw_value = area_match.group(1)
            matched_candidates = [item for item in area_candidates if item["valor_raw"] == raw_value]
            if matched_candidates and any(item["suspeito"] for item in matched_candidates):
                status = "area_suspeita_repetida"
                confidence = 0.2
            else:
                parsed_area = float(raw_value.replace(",", "."))
                if parsed_area <= 0:
                    status = "area_corrompida_ou_invalida"
                    confidence = 0.15
                else:
                    area = parsed_area
                    status = "area_candidata"
                    confidence = 0.55
        rooms.append(
            {
                "nome": room,
                "area_m2": area,
                "status": status,
                "confianca": confidence,
                "evidencia": re.sub(r"\s+", " ", window[:220]).strip(),
            }
        )
    spatial_rooms = spatial_rooms if spatial_rooms is not None else spatial_room_area_links(pages or [], area_candidates)
    return merge_room_candidates(rooms, spatial_rooms)


def extract_acabamentos(markdown: str, tables: list[dict[str, Any]]) -> list[dict[str, Any]]:
    legend_texts = [
        table["text"]
        for table in tables
        if "ACABAMENTOS" in strip_accents_light(table["text"]).upper()
    ]
    text = "\n".join(legend_texts) if legend_texts else markdown
    acabamentos: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        match = re.match(r"^([ABC][1-9])\s+(.{3,90})$", line, flags=re.I)
        if not match:
            continue
        code, description = match.groups()
        code = code.upper()
        category = ACABAMENTO_CATEGORIES.get(code[0], "nao_classificado")
        description = re.split(
            r"\b(?:QUADRO|AREA|ÁREA|SALA|COZINHA|DORMIT|BANHEIRO|ESCRIT|LAVANDERIA|CORREDOR|VARANDA|NOTAS)\b",
            description,
            maxsplit=1,
            flags=re.I,
        )[0]
        description = clean_label(description)
        if len(description) < 3:
            continue
        if re.fullmatch(r"(?:[ABC]\d\s*)+[0-9 ]*", description):
            continue
        if description.startswith(("B1 ", "B2 ", "B3 ", "C1 ", "C2 ", "C3 ")):
            continue
        key = f"{code}:{description}"
        if key in seen:
            continue
        seen.add(key)
        acabamentos.append(
            {
                "codigo": code,
                "categoria": category,
                "descricao": description,
                "origem": "legenda",
                "confianca": 0.85,
            }
        )
    return acabamentos


def extract_carimbo(markdown: str) -> dict[str, Any]:
    clean = re.sub(r"\s+", " ", markdown)
    carimbo: dict[str, Any] = {}
    scales = list(dict.fromkeys(match.group(1).replace(" ", "") for match in SCALE_PATTERN.finditer(clean)))
    sheets = SHEET_PATTERN.findall(clean)
    dates = DATE_PATTERN.findall(clean)

    if "PROJETO ARQUIT" in clean.upper():
        carimbo["tipo_projeto"] = "PROJETO ARQUITETONICO"
    if "CONSTRU" in clean.upper() and "RESID" in clean.upper():
        carimbo["descricao"] = "CONSTRUCAO DE RESIDENCIA UNIFAMILIAR EM ALVENARIA"

    author = re.search(r"(TATIANA\s+MORITA\s+NOBRE\s+MATTOS)", clean, re.I)
    owner = re.search(r"(JORGYANO\s+BRUNO\s+DE\s+OLIVEIRA\s+VIEIRA)", clean, re.I)
    cau = re.search(r"\b(A\d{4,6}-\d)\b", clean, re.I)

    if author:
        carimbo["autor_projeto"] = clean_label(author.group(1)).title()
    if cau:
        carimbo["registro_autor"] = cau.group(1).upper()
    if owner:
        carimbo["proprietario"] = clean_label(owner.group(1)).title()
    if scales:
        carimbo["escalas_detectadas"] = scales[:8]
    if sheets:
        carimbo["prancha"] = sheets[-1].replace(" ", "")
    if dates:
        carimbo["data"] = dates[-1]

    return carimbo


def build_alerts(
    pages: list[dict[str, Any]],
    area_candidates: list[dict[str, Any]],
    rooms: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    alertas: list[dict[str, Any]] = []
    conflitos: list[dict[str, Any]] = []

    for page in pages:
        metrics = page.get("metrics", {})
        if metrics.get("replacement_chars", 0) > 0:
            alertas.append(
                {
                    "tipo": "texto_corrompido",
                    "severidade": "media",
                    "mensagem": f"Pagina {metrics.get('page')}: {metrics.get('replacement_chars')} caracteres corrompidos.",
                }
            )
        if metrics.get("repeated_area_warning"):
            alertas.append(
                {
                    "tipo": "areas_repetidas",
                    "severidade": "alta",
                    "mensagem": metrics["repeated_area_warning"],
                }
            )
            conflitos.append(
                {
                    "tipo": "area_ambiente_suspeita",
                    "descricao": metrics["repeated_area_warning"],
                    "impacto": "Nao usar valores repetidos como quantitativo final sem validacao visual.",
                }
            )

    if area_candidates:
        values = [item["valor_m2"] for item in area_candidates if not item["suspeito"]]
        if len(values) > 1 and statistics.mean(values) > 0:
            max_value = max(values)
            min_value = min(values)
            if max_value > min_value * 20:
                alertas.append(
                    {
                        "tipo": "variacao_area_extrema",
                        "severidade": "media",
                        "mensagem": "Areas candidatas variam demais; conferir origem e unidade.",
                    }
                )

    for room in rooms:
        if room["nome"].startswith("BANHEIRO") and room.get("area_m2") and room["area_m2"] > 10:
            alertas.append(
                {
                    "tipo": "banheiro_atipico",
                    "severidade": "alta",
                    "mensagem": f"{room['nome']} com area {room['area_m2']} m2 acima do esperado.",
                }
            )

    return alertas, conflitos


def semantic_area_checks(area_groups: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    checks: list[dict[str, Any]] = []
    totals = [item for item in area_groups.get("area_total", []) if not item.get("suspeito")]
    rooms = [item for item in area_groups.get("area_ambientes", []) if not item.get("suspeito")]

    if totals and rooms:
        total = max(totals, key=lambda item: item.get("confianca", 0))
        room_sum = sum(item["valor_m2"] for item in rooms)
        total_value = total["valor_m2"]
        ratio = room_sum / total_value if total_value else 0
        status = "ok" if 0.75 <= ratio <= 1.15 else "conflito"
        checks.append(
            {
                "tipo": "soma_ambientes_vs_area_total",
                "status": status,
                "area_total_m2": total_value,
                "soma_ambientes_m2": round(room_sum, 2),
                "ratio": round(ratio, 3),
            }
        )
    else:
        checks.append(
            {
                "tipo": "soma_ambientes_vs_area_total",
                "status": "indisponivel",
                "motivo": "Sem area_total e/ou areas_ambientes confiaveis.",
            }
        )

    return checks


def quantitative_gate(
    sheet_type: str,
    confidence: float,
    area_groups: dict[str, list[dict[str, Any]]],
    alertas: list[dict[str, Any]],
    semantic_checks: list[dict[str, Any]],
) -> dict[str, Any]:
    motivos: list[str] = []
    high_alerts = [item for item in alertas if item.get("severidade") == "alta"]
    trusted_room_areas = [item for item in area_groups.get("area_ambientes", []) if not item.get("suspeito")]
    trusted_total_areas = [
        item
        for key in ("area_total", "area_construida")
        for item in area_groups.get(key, [])
        if not item.get("suspeito")
    ]

    if confidence < 0.4:
        motivos.append("confianca_global_baixa")
    if high_alerts:
        motivos.append("alerta_alta_severidade")
    if sheet_type in {"planta", "planta_implantacao", "planta_cobertura"} and not trusted_room_areas:
        motivos.append("sem_areas_ambiente_confiaveis")
    if sheet_type in {"planta", "planta_implantacao", "planta_cobertura"} and not trusted_total_areas:
        motivos.append("sem_area_total_ou_construida_confiavel")
    if any(check.get("status") == "conflito" for check in semantic_checks):
        motivos.append("conflito_semantico_area")

    return {
        "bloquear_quantitativo": bool(motivos),
        "motivos": sorted(set(motivos)),
        "regra": "Nenhum quantitativo e liberado sem area confiavel, sem alerta alto e com consistencia minima.",
    }


def llm_verification_plan(
    sheet_type: str,
    confidence: float,
    gate: dict[str, Any],
    alertas: list[dict[str, Any]],
    page_image: Path,
) -> dict[str, Any]:
    should_verify = gate["bloquear_quantitativo"] or confidence < 0.7 or bool(alertas)
    return {
        "necessaria": should_verify,
        "motor_sugerido": "gpt_vision",
        "imagem_base": str(page_image) if page_image.exists() else None,
        "tipo_folha": sheet_type,
        "perguntas": [
            "Validar o quadro de areas e devolver somente valores legiveis com fonte visual.",
            "Confirmar se areas repetidas pertencem a ambientes reais ou sao contaminacao da planta.",
            "Identificar area total, area construida, area do lote, area permeavel e areas dos ambientes.",
        ]
        if should_verify
        else [],
    }


def evis_routing_decision(
    sheet_type: str,
    gate: dict[str, Any],
    llm_plan: dict[str, Any],
    confidence: float,
) -> dict[str, Any]:
    if gate["bloquear_quantitativo"] and llm_plan["necessaria"]:
        next_step = "verificacao_llm_vision"
        reason = "Quantitativo bloqueado; precisa validacao visual dirigida antes de avancar."
    elif gate["bloquear_quantitativo"]:
        next_step = "hitl_manual"
        reason = "Quantitativo bloqueado sem plano automatico suficiente."
    elif sheet_type in {"cortes_fachadas", "cobertura"}:
        next_step = "classificar_complementar"
        reason = "Folha complementar confiavel; enviar para especialistas disciplinares, nao para quantitativo de areas."
    elif confidence >= 0.7:
        next_step = "quantitativos"
        reason = "Dados confiaveis o suficiente para iniciar quantitativo."
    else:
        next_step = "auditoria_humana"
        reason = "Confianca intermediaria; exigir auditoria antes dos quantitativos."

    return {
        "proximo_passo": next_step,
        "motivo": reason,
        "entrada_recomendada": llm_plan.get("imagem_base") if next_step == "verificacao_llm_vision" else None,
    }


def confidence_global(
    sheet_type: str,
    pages: list[dict[str, Any]],
    area_candidates: list[dict[str, Any]],
    rooms: list[dict[str, Any]],
    alertas: list[dict[str, Any]],
) -> float:
    coverage_scores = [page.get("metrics", {}).get("numeric_trust_score", 0) / 100 for page in pages]
    base = statistics.mean(coverage_scores) if coverage_scores else 0.5
    if not area_candidates:
        if sheet_type in {"planta", "planta_implantacao", "planta_cobertura", "implantacao"}:
            base -= 0.15
    if any(item.get("suspeito") for item in area_candidates):
        base -= 0.2
    if not rooms and sheet_type in {"planta", "planta_implantacao", "planta_cobertura"}:
        base -= 0.1
    base -= min(0.25, len([a for a in alertas if a.get("severidade") == "alta"]) * 0.08)
    return round(max(0.0, min(1.0, base)), 2)


def interpret_reader_dir(reader_dir: Path) -> dict[str, Any]:
    markdown = load_markdown(reader_dir)
    pages = load_pdfplumber(reader_dir)
    tables = load_tables(reader_dir)
    page_image = reader_dir / "pages_png" / "page_001.png"
    reader_report_path = reader_dir / "reader_report.json"
    reader_report = read_json(reader_report_path) if reader_report_path.exists() else {}

    regions = detect_regions(markdown, pages, tables)
    sheet_type, disciplinas = classify_sheet(markdown, regions)
    areas = extract_areas(markdown, tables, pages, regions)
    area_groups = group_areas_by_category(areas)
    spatial_room_links = spatial_room_area_links(pages, areas)
    rooms = extract_rooms(markdown, areas, pages, spatial_room_links)
    acabamentos = extract_acabamentos(markdown, tables)
    carimbo = extract_carimbo(markdown)
    alertas, conflitos = build_alerts(pages, areas, rooms)
    confianca = {
        "areas_candidatas": round(
            statistics.mean([item["confianca"] for item in areas]) if areas else 0.0,
            2,
        ),
        "ambientes_candidatos": round(
            statistics.mean([item["confianca"] for item in rooms]) if rooms else 0.0,
            2,
        ),
        "acabamentos": 0.85 if acabamentos else 0.0,
        "carimbo": 0.8 if carimbo else 0.0,
    }
    semantic_checks = semantic_area_checks(area_groups)
    global_confidence = confidence_global(sheet_type, pages, areas, rooms, alertas)
    gate = quantitative_gate(sheet_type, global_confidence, area_groups, alertas, semantic_checks)
    llm_plan = llm_verification_plan(sheet_type, global_confidence, gate, alertas, page_image)
    routing = evis_routing_decision(sheet_type, gate, llm_plan, global_confidence)

    result = {
        "metadata": {
            "reader_dir": str(reader_dir),
            "page_image": str(page_image) if page_image.exists() else None,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "source_file": reader_report.get("file"),
            "sha256": reader_report.get("sha256"),
        },
        "tipo_folha": sheet_type,
        "disciplinas_detectadas": disciplinas,
        "regioes_detectadas": regions,
        "areas_candidatas": areas,
        "areas_classificadas": area_groups,
        "associacoes_espaciais": {
            "ambiente_area": spatial_room_links,
        },
        "ambientes_candidatos": rooms,
        "acabamentos": acabamentos,
        "carimbo": carimbo,
        "alertas": alertas,
        "conflitos": conflitos,
        "validacoes_semanticas": semantic_checks,
        "bloqueio": gate,
        "verificacao_llm": llm_plan,
        "roteamento_evis": routing,
        "confianca_por_campo": confianca,
        "confianca_global": global_confidence,
        "origem_por_campo": {
            "areas_candidatas": "tabelas + markdown + metricas Reader Lab",
            "areas_classificadas": "classificacao deterministica por rotulo/evidencia",
            "associacoes_espaciais": "pdfplumber words agrupados por linha e proximidade x/y",
            "ambientes_candidatos": "pdfplumber words por coordenada + fallback markdown",
            "acabamentos": "legenda de acabamentos",
            "carimbo": "markdown/carimbo da prancha",
            "tipo_folha": "keywords + regioes detectadas",
            "bloqueio": "regras EVIS deterministicas",
            "roteamento_evis": "decisor pos-gate para LLM vision, quantitativos, HITL ou disciplina complementar",
        },
    }
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Interpret Reader Lab output into EVIS Etapa 0 candidates.")
    parser.add_argument("reader_dir", type=Path, help="Reader Lab PDF directory, e.g. scratch/.../Folha_1")
    parser.add_argument("--out", type=Path, default=None, help="Output JSON path.")
    args = parser.parse_args()

    result = interpret_reader_dir(args.reader_dir)
    out_path = args.out or (args.reader_dir / "evis_interpreter_output.json")
    write_json(out_path, result)
    print(f"[evis-pdf-interpreter] salvo: {out_path}")
    print(
        f"[evis-pdf-interpreter] confianca_global={result['confianca_global']} "
        f"tipo_folha={result['tipo_folha']} "
        f"bloquear_quantitativo={result['bloqueio']['bloquear_quantitativo']} "
        f"areas={len(result['areas_candidatas'])} ambientes={len(result['ambientes_candidatos'])} "
        f"alertas={len(result['alertas'])}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
