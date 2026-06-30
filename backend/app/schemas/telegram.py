from pydantic import BaseModel

class TelegramAuthSchema(BaseModel):
    init_data: str
    invite_token: str | None = None

class TelegramLinkSchema(BaseModel):
    init_data: str
