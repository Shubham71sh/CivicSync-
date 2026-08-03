from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.services import scheme_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/schemes", tags=["Schemes"])


@router.get("/search")
async def search_schemes(
    keyword: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    page: int = Query(1),
    limit: int = Query(10),
    current_user: dict = Depends(get_current_user),
):
    query = {"keyword": keyword, "category": category, "state": state,
             "page": page, "limit": limit}
    result = await scheme_service.get_all_schemes(
        {k: v for k, v in query.items() if v is not None}
    )
    return {"success": True, **result}


@router.get("/")
async def get_all_schemes(
    keyword: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    page: int = Query(1),
    limit: int = Query(10),
    current_user: dict = Depends(get_current_user),
):
    query = {"keyword": keyword, "category": category, "state": state,
             "page": page, "limit": limit}
    result = await scheme_service.get_all_schemes(
        {k: v for k, v in query.items() if v is not None}
    )
    return {"success": True, **result}


@router.get("/{scheme_id}")
async def get_scheme_by_id(
    scheme_id: str,
    current_user: dict = Depends(get_current_user),
):
    result = await scheme_service.get_scheme_by_id(scheme_id)
    return {"success": True, **result}
