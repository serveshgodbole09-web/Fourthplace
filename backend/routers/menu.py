from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_admin
from database import get_db
from models import MenuItem
from schemas import MenuItemIn, MenuItemOut

router = APIRouter(prefix="/api/menu", tags=["menu"])


@router.get("", response_model=list[MenuItemOut])
def list_menu(db: Session = Depends(get_db)):
    return (
        db.query(MenuItem)
        .filter(MenuItem.is_available.is_(True))
        .order_by(MenuItem.sort_order, MenuItem.id)
        .all()
    )


@router.get("/all", response_model=list[MenuItemOut])
def list_all_menu(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    return db.query(MenuItem).order_by(MenuItem.sort_order, MenuItem.id).all()


@router.post("", response_model=MenuItemOut)
def create_item(payload: MenuItemIn, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    if payload.category not in {"beverages", "coffee", "food", "art"}:
        raise HTTPException(status_code=400, detail="Category must be beverages, coffee, food, or art")
    item = MenuItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=MenuItemOut)
def update_item(
    item_id: int,
    payload: MenuItemIn,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
