# src/create_db.py

from .database import Base, engine

# Import all models so SQLAlchemy is aware of them
from .users import models as user_models              # noqa: F401
from .collectives import models as collective_models  # noqa: F401
from .suppliers import models as supplier_models      # noqa: F401
from .procedures import models as procedure_models    # noqa: F401
from .negotiations import models as negotiation_models  # noqa: F401


def main():
    print("Creating SQLite database...")
    Base.metadata.create_all(bind=engine)
    print("Done.")


if __name__ == "__main__":
    main()
