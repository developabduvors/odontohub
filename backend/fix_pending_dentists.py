"""Bir martalik: barcha 'pending' doktorlarni 'approved' ga o'tkazadi.

Yangi registratsiya endi avto-APPROVED (auth.py). Bu skript eski, pending da
qotib qolgan doktorlarni ham bemorlarga ko'rinadigan qiladi.

ORM mapper zanjirini chetlab o'tib, to'g'ridan-to'g'ri SQL bilan ishlaydi.

Ishga tushirish (backend/ dan):  python fix_pending_dentists.py
"""
from sqlalchemy import text
from app.db.session import engine

with engine.begin() as conn:
    before = conn.execute(
        text("SELECT count(*) FROM dentist_profiles WHERE verification_status = 'pending'")
    ).scalar()
    print(f"Pending doktorlar: {before}")

    result = conn.execute(
        text(
            "UPDATE dentist_profiles SET verification_status = 'approved' "
            "WHERE verification_status = 'pending'"
        )
    )
    print(f"Tayyor. {result.rowcount} ta doktor approved qilindi.")
