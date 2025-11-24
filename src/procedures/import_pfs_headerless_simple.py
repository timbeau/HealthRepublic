# src/procedures/import_pfs_headerless_simple.py

import csv
import sys
from pathlib import Path

from sqlalchemy.orm import Session

from ..database import SessionLocal
from . import models


BATCH_SIZE = 2000  # commit every 2000 codes to keep memory low


def parse_reference_cost(value: str | None) -> float | None:
    if value is None:
        return None
    v = value.strip()
    if not v:
        return None
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


def import_pfs_headerless(path_str: str) -> None:
    path = Path(path_str)
    if not path.exists():
        print(f"[ERROR] File not found: {path_str}")
        sys.exit(1)

    db: Session = SessionLocal()
    created = 0
    updated = 0
    total_rows = 0
    used_rows = 0

    # Track codes we've already processed in THIS run to avoid duplicate INSERTs
    seen_codes: set[str] = set()

    try:
        with path.open("r", encoding="utf-8-sig") as f:
            sample = f.read(4096)
            f.seek(0)
            # Try to sniff delimiter; fall back to comma
            try:
                dialect = csv.Sniffer().sniff(sample)
            except csv.Error:
                dialect = csv.get_dialect("excel")

            reader = csv.reader(f, dialect=dialect)

            for row in reader:
                total_rows += 1

                # Progress heartbeat
                if total_rows % 10000 == 0:
                    print(
                        f"[INFO] Processed {total_rows} rows, "
                        f"used_rows={used_rows}, created={created}, updated={updated}"
                    )

                # Skip empty rows
                if not row or all(not col.strip() for col in row):
                    continue

                # We expect at least 6 columns
                if len(row) < 6:
                    continue

                raw_code = row[3]  # 4th column
                code = (raw_code or "").strip()
                if not code:
                    continue

                # Basic sanity: HCPCS/CPT codes are alphanumeric, length 3–7 typically
                if len(code) < 3 or len(code) > 7:
                    continue

                # Skip if we've already processed this code in this run
                if code in seen_codes:
                    continue
                seen_codes.add(code)

                used_rows += 1

                description = f"Procedure {code}"
                ref_raw = row[5]  # 6th column: non-facility total payment
                reference_cost = parse_reference_cost(ref_raw)
                code_system = derive_code_system(code)

                # Check if this code already exists in the DB from previous runs
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

                # Batch commit to keep memory low
                if used_rows % BATCH_SIZE == 0:
                    db.commit()
                    db.expunge_all()
                    print(
                        f"[INFO] Batch commit: used_rows={used_rows}, "
                        f"created={created}, updated={updated}"
                    )

            # Final commit
            db.commit()

        print(f"[OK] Headerless import finished.")
        print(f"  Total rows read:   {total_rows}")
        print(f"  Rows with a code:  {used_rows}")
        print(f"  Created:           {created}")
        print(f"  Updated:           {updated}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Import failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m src.procedures.import_pfs_headerless_simple <path_to_pfs_txt_or_csv>")
        sys.exit(1)

    file_path = sys.argv[1]
    import_pfs_headerless(file_path)
