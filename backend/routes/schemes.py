from fastapi import APIRouter
from services.scheme_service import get_eligible_schemes

router = APIRouter(prefix="/schemes", tags=["Government Schemes"])


@router.get("/")
def get_schemes(
    disaster: str,
    damage: int,
    state: str
):
    schemes = get_eligible_schemes(
        disaster=disaster,
        damage=damage,
        state=state
    )

    return {
        "success": True,
        "count": len(schemes),
        "schemes": schemes
    }