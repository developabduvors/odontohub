"""Ad-hoc reproduction/verification for the empty-service-dropdown bug.

Patient Booking page requests GET /services/?dentist_id=<id>. Dentist
"abduvoris" (dentist_profiles.id=3) has zero own services, and the strict
equality filter excluded the legacy global services (dentist_id IS NULL),
so the dropdown rendered empty.

Run:  python test_services_dentist_filter.py
"""
from sqlalchemy import or_
from app.core.database import SessionLocal
from app.models.service import Service

DENTIST_ID = 3  # "abduvoris" — only approved dentist, has no own services

db = SessionLocal()
try:
    old = db.query(Service).filter(Service.dentist_id == DENTIST_ID).all()
    new = db.query(Service).filter(
        or_(Service.dentist_id == DENTIST_ID, Service.dentist_id.is_(None))
    ).all()

    print(f"OLD (strict ==):        {len(old)} services -> {[s.name for s in old]}")
    print(f"NEW (own OR global):    {len(new)} services -> {[s.name for s in new]}")

    assert len(old) == 0, "Expected reproduction: strict filter returns nothing"
    assert len(new) > 0, "Fix must surface the global (dentist_id IS NULL) catalogue"
    print("\nPASS: bug reproduced (old=0) and fix yields the global catalogue.")
finally:
    db.close()
