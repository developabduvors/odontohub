"""Login telefon normalizatsiyasini tekshiruvchi bir martalik skript.

Ishga tushirish:  python test_phone_normalize.py
"""
from app.core.phone import normalize_phone, phones_match

CANON = "+998901234567"

# Foydalanuvchi har xil manbadan yuborishi mumkin bo'lgan variantlar.
variants = [
    "+998901234567",          # kanonik
    "+998 90 123 45 67",      # PhoneInput bo'shliqli format
    " +998901234567 ",        # chetida bo'shliq
    "998901234567",           # autofill, '+' siz
    "00998901234567",         # xalqaro 00 prefiks
    "901234567",              # faqat abonent raqami
    "+998-90-123-45-67",      # tirelar bilan
    "(998) 90 123 45 67",     # qavslar
]

print("normalize_phone:")
ok = True
for v in variants:
    n = normalize_phone(v)
    mark = "OK " if n == CANON else "XATO"
    if n != CANON:
        ok = False
    print(f"  {mark}  {v!r:24} -> {n!r}")

print("\nphones_match (baza '+998 90 123 45 67' formatda saqlangan, tarixiy):")
stored = "+998 90 123 45 67"
for v in variants:
    m = phones_match(stored, v)
    if not m:
        ok = False
    print(f"  {'OK ' if m else 'XATO'}  stored={stored!r}  candidate={v!r}")

print("\nNATIJA:", "HAMMASI O'TDI" if ok else "BA'ZILARI XATO")
