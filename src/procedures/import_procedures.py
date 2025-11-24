# src/procedures/import_procedures.py

import csv
import sys
from pathlib import Path

from sqlalchemy.orm import Session

from ..database import SessionLocal
from . import models


def detect_fields(fieldnames: list[str]) -> tuple[str, str, str | None]:
    """
    Try to map the file's column names to:
    - code
    - description
    - reference_cost (optional)

    Raises ValueError if not found.
    """

    lower_map = {name.lower(): name for name in fieldnames}

    # Possible header names for each logical field
    code_candidates = [
        "hcpcs",
        "hcpcs code",
        "code",
        "cpt code",
    ]
    desc_candidates = [
        "short description",
        "short_desc",
        "description",
        "descr",
    ]
    ref_candidates = [
        "non-facility total payment",
        "non facility total payment",
        "non_facility_total_payment",
        "non-facility payment",
        "nonfacility total payment",
        "reference_cost",
        "ref_cost",
    ]

    def pick(candidates):
        for c in candidates:
            if c in lower_map:
                return lower_map[c]
        return None

    code_field = pick(code_candidates)
    desc_field = pick(desc_candidates)
    ref_field = pick(ref_candidates)

    if not code_field or not desc_field:
        raise ValueError(
            f"Could not find required columns for code/description. "
            f"Available columns: {fieldnames}"
        )

    return code_field, desc_field, ref_field


def parse_reference_cost(value: str | None) -> float | None:
    if value is None:
        return None
    v = value.strip()
    if not v:
        return None
    # Remove $ and commas if present
    v = v.replace("$", "").replace(",", "")
    try:
        return float(v)
    except ValueError:
        return None


def derive_code_system(code: str) -> str:
    code = code.strip()
    if len(code) == 5 and code.isdigit():
        return "cpt"
    return "hcpcs"


def import_with_header(path: Path, dialect: csv.Dialect, fieldnames: list[str]) -> tuple[int, int]:
    """
    Import assuming the file DOES have a header row.
    Returns (created, updated)
    """
    db: Session = SessionLocal()
    created = 0
    updated = 0

    try:
        code_field, desc_field, ref_field = detect_fields(fieldnames)

        print(
            f"[INFO] Using columns: code={code_field}, "
            f"description={desc_field}, reference_cost={ref_field}"
        )

        with path.open("r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, dialect=dialect)
            for row in reader:
                raw_code = row.get(code_field) or ""
                code = raw_code.strip()
                if not code:
                    continue

                description = (row.get(desc_field) or "").strip()
                reference_cost = parse_reference_cost(row.get(ref_field)) if ref_field else None
                code_system = derive_code_system(code)

                existing = (
                    db.query(models.Procedure)
                    .filter(models.Procedure.code == code)
                    .first()
                )

                if existing:
                    existing.description = description or existing.description
                    existing.code_system = code_system or existing.code_system
                    if reference_cost is not None:
                        existing.reference_cost = reference_cost
                    updated += 1
                else:
                    proc = models.Procedure(
                        code=code,
                        description=description or f"Procedure {code}",
                        code_system=code_system,
                        reference_cost=reference_cost,
                    )
                    db.add(proc)
                    created += 1

            db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return created, updated


def import_headerless_pfs(path: Path, dialect: csv.Dialect) -> tuple[int, int]:
    """
    Fallback importer for headerless PFS-like files where columns are positional.

    Based on the example row:
    ['2025', '01112', '05', 'G0011', '  ', '0000031.56', '0000027.89', ...]
    we assume:
        index 3 -> code
        index 5 -> non-facility total payment (reference_cost)
    Description is not present; we use 'Procedure <code>'.
    """

    db: Session = SessionLocal()
    created = 0
    updated = 0

    try:
        with path.open("r", encoding="utf-8-sig") as f:
            reader = csv.reader(f, dialect=dialect)

            for row in reader:
                # Skip empty lines
                if not row or all(not col.strip() for col in row):
                    continue

                # Defensive: ensure row is long enough
                if len(row) < 6:
                    continue

                raw_code = row[3]  # 4th column
                code = (raw_code or "").strip()
                if not code:
                    continue

                # We don't have a description column in this layout
                description = f"Procedure {code}"

                ref_raw = row[5]  # 6th column assumed = non-facility total payment
                reference_cost = parse_reference_cost(ref_raw)
                code_system = derive_code_system(code)

                existing = (
                    db.query(models.Procedure)
                    .filter(models.Procedure.code == code)
                    .first()
                )

                if existing:
                    existing.description = description or existing.description
                    existing.code_system = code_system or existing.code_system
                    if reference_cost is not None:
                        existing.reference_cost = reference_cost
                    updated += 1
                else:
                    proc = models.Procedure(
                        code=code,
                        description=description,
                        code_system=code_system,
                        reference_cost=reference_cost,
                    )
                    db.add(proc)
                    created += 1

            db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return created, updated


def import_procedures_from_pfs_file(path_str: str) -> None:
    path = Path(path_str)
    if not path.exists():
        print(f"[ERROR] File not found: {path_str}")
        sys.exit(1)

    try:
        # First, open a sample to detect dialect & header behavior
        with path.open("r", encoding="utf-8-sig") as f:
            sample = f.read(4096)
            f.seek(0)
            sniffer = csv.Sniffer()
            try:
                dialect = sniffer.sniff(sample)
            except csv.Error:
                dialect = csv.get_dialect("excel")

            # Peek at first row as "header"
            reader = csv.reader(f, dialect=dialect)
            first_row = next(reader, None)

            if first_row is None:
                print("[ERROR] File appears to be empty.")
                sys.exit(1)

            print(f"[INFO] First row fields: {first_row}")

            # Heuristic: if the "header" row is all numeric-like things and the error
            # about missing columns happens, we'll treat this as headerless.
            # Try header-based import first using DictReader with that first row as header.
            fieldnames = first_row
            try:
                created, updated = import_with_header(path, dialect, fieldnames)
                print(f"[OK] Import (with header) complete. Created: {created}, Updated: {updated}")
                return
            except ValueError as ve:
                print(f"[WARN] {ve}")
                print("[INFO] Falling back to headerless positional import...")

    except Exception as e:
        # If anything blows up above, we still attempt headerless before giving up
        print(f"[WARN] Header-based attempt failed with: {e}")
        print("[INFO] Falling back to headerless positional import...")

        with path.open("r", encoding="utf-8-sig") as f:
            sniffer = csv.Sniffer()
            sample = f.read(4096)
            f.seek(0)
            try:
                dialect = sniffer.sniff(sample)
            except csv.Error:
                dialect = csv.get_dialect("excel")

    # Now do the headerless import
    created, updated = import_headerless_pfs(path, dialect)
    print(f"[OK] Headerless import complete. Created: {created}, Updated: {updated}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m src.procedures.import_procedures <path_to_pfs_txt_or_csv>")
        sys.exit(1)

    file_path = sys.argv[1]
    import_procedures_from_pfs_file(file_path)
