"""Telefon raqamini kanonik shaklga keltirish.

Login kaliti telefon raqami bo'lgani uchun, u har doim bitta kanonik
formatga (+998XXXXXXXXX) keltirilishi shart. Aks holda eski frontend,
dentist qo'shgan bemorlar, brauzer autofill yoki copy-paste turli
formatlar yuboradi va aniq solishtirish "Пользователь не найден" beradi.
"""

import re


def normalize_phone(raw: str | None) -> str:
    """O'zbek raqamini +998XXXXXXXXX shakliga keltiradi.

    Qabul qiladi: bo'shliq/tire/qavslar, 00 yoki + prefiks, prefiksiz
    998..., va prefiksiz 9 xonali abonent raqami (998 deb taxmin qiladi).
    Tushunarsiz holatda raqamlarni qoldirib +-prefiks bilan qaytaradi.
    """
    if not raw:
        return ""
    digits = re.sub(r"\D", "", raw)          # faqat raqamlar
    if digits.startswith("00"):              # 00998... -> 998...
        digits = digits[2:]
    if len(digits) == 9:                     # 901234567 -> 998901234567
        digits = "998" + digits
    if digits.startswith("998") and len(digits) == 12:
        return "+" + digits                  # kanonik
    return "+" + digits if digits else ""    # best-effort fallback


def phones_match(stored: str | None, candidate: str | None) -> bool:
    """Ikki raqamni format farqidan qat'i nazar solishtiradi.

    Tarixiy yozuvlar har xil formatda saqlangan bo'lishi mumkin — shu
    sabab normalizatsiyadan keyin solishtiramiz.
    """
    return bool(stored) and bool(candidate) and normalize_phone(stored) == normalize_phone(candidate)
