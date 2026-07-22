from fastapi import APIRouter
from pydantic import BaseModel

from app.services.disaster_scheme_service import get_disaster_schemes

router = APIRouter(
    prefix="/disaster-schemes",
    tags=["Disaster Schemes"]
)


class SchemeRequest(BaseModel):
    disasterType: str
    damagePercent: int
    state: str


@router.post("/")
async def schemes(body: SchemeRequest):

    result = await get_disaster_schemes(
        body.disasterType,
        body.damagePercent,
        body.state
    )

    return result