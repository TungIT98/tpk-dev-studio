import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select

from app.core.database import get_db, get_db_sync
from app.models.models import PetType, PetInstance, PetSkill, PetEquipment
from app.schemas.schemas import (
    PetTypeResponse,
    PetInstanceResponse,
    PetEvolveRequest,
    PetEquipRequest,
    PetEquipResponse,
    PetAcquireRequest,
)

router = APIRouter(prefix="/pets", tags=["pets"])


# ── Pet Types ──────────────────────────────────────────────────────────────────

@router.get("/types", response_model=List[PetTypeResponse])
def list_pet_types(
    rarity: Optional[str] = Query(None),
    db: Session = Depends(get_db_sync),
):
    """List all available pet types, optionally filtered by rarity."""
    query = select(PetType).where(PetType.is_active == True)
    if rarity:
        query = query.where(PetType.rarity == rarity)
    result = db.execute(query.order_by(PetType.rarity, PetType.name))
    return result.scalars().all()


@router.get("/types/{pet_type_id}", response_model=PetTypeResponse)
def get_pet_type(pet_type_id: str, db: Session = Depends(get_db_sync)):
    """Get a specific pet type by ID."""
    pet_type = db.execute(select(PetType).where(PetType.pet_type_id == pet_type_id)).scalars().first()
    if not pet_type or not pet_type.is_active:
        raise HTTPException(status_code=404, detail="Pet type not found")
    return pet_type


# ── Pet Instances ──────────────────────────────────────────────────────────────

@router.get("", response_model=List[PetInstanceResponse])
def list_player_pets(
    user_id: str = Query(...),
    equipped_only: bool = Query(False),
    db: Session = Depends(get_db_sync),
):
    """List all pet instances owned by a player."""
    query = (
        select(PetInstance)
        .options(joinedload(PetInstance.pet_type))
        .options(joinedload(PetInstance.skills))
        .options(joinedload(PetInstance.equipment))
        .where(PetInstance.user_id == user_id)
        .where(PetInstance.is_active == True)
    )
    if equipped_only:
        query = query.where(PetInstance.is_equipped == True)
    result = db.execute(query.order_by(PetInstance.acquired_at.desc()))
    return result.scalars().unique().all()


@router.get("/lookup/{instance_id}", response_model=PetInstanceResponse)
def lookup_pet(instance_id: str, db: Session = Depends(get_db_sync)):
    """Look up a specific pet instance by its ID."""
    instance = db.execute(
        select(PetInstance)
        .options(joinedload(PetInstance.pet_type))
        .options(joinedload(PetInstance.skills))
        .options(joinedload(PetInstance.equipment))
        .where(PetInstance.instance_id == instance_id)
    ).scalars().first()

    if not instance or not instance.is_active:
        raise HTTPException(status_code=404, detail="Pet not found")
    return instance


@router.post("", response_model=PetInstanceResponse, status_code=201)
def acquire_pet(req: PetAcquireRequest, db: Session = Depends(get_db_sync)):
    """Acquire a new pet instance for a player."""
    pet_type = db.execute(select(PetType).where(PetType.pet_type_id == req.pet_type_id)).scalars().first()
    if not pet_type or not pet_type.is_active:
        raise HTTPException(status_code=404, detail="Pet type not found")

    instance_id = str(uuid.uuid4())
    instance = PetInstance(
        instance_id=instance_id,
        user_id=req.user_id,
        pet_type_id=req.pet_type_id,
        nickname=req.nickname,
        level=1,
        experience=0.0,
        evolve_level_req=pet_type.pet_metadata.get("evolve_level_req", 10),
        is_equipped=False,
        is_active=True,
    )
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance


# ── Pet Actions ─────────────────────────────────────────────────────────────────

@router.post("/{instance_id}/evolve", response_model=PetInstanceResponse)
def evolve_pet(instance_id: str, req: PetEvolveRequest, db: Session = Depends(get_db_sync)):
    """Evolve a pet if it meets level requirements."""
    instance = db.execute(
        select(PetInstance)
        .options(joinedload(PetInstance.pet_type))
        .where(PetInstance.instance_id == instance_id)
        .where(PetInstance.user_id == req.user_id)
        .where(PetInstance.is_active == True)
    ).scalars().first()

    if not instance:
        raise HTTPException(status_code=404, detail="Pet not found")

    if not instance.pet_type.evolve_to:
        raise HTTPException(status_code=400, detail="This pet cannot evolve")

    if instance.level < instance.evolve_level_req:
        raise HTTPException(
            status_code=400,
            detail=f"Pet must be level {instance.evolve_level_req} to evolve (current: {instance.level})"
        )

    # Check the evolved pet type exists
    evolved_type = db.execute(select(PetType).where(PetType.pet_type_id == instance.pet_type.evolve_to)).scalars().first()
    if not evolved_type or not evolved_type.is_active:
        raise HTTPException(status_code=400, detail="Evolution target not available")

    instance.pet_type_id = evolved_type.pet_type_id
    instance.level = max(1, evolved_type.pet_metadata.get("start_level", 1))
    instance.experience = 0.0
    instance.evolve_level_req = evolved_type.pet_metadata.get("evolve_level_req", instance.evolve_level_req)
    db.commit()
    db.refresh(instance)
    return instance


@router.post("/{instance_id}/equip", response_model=PetEquipResponse)
def equip_pet(instance_id: str, req: PetEquipRequest, db: Session = Depends(get_db_sync)):
    """Equip an item to a pet instance in the specified slot."""
    instance = db.execute(
        select(PetInstance)
        .options(joinedload(PetInstance.equipment))
        .where(PetInstance.instance_id == instance_id)
        .where(PetInstance.user_id == req.user_id)
        .where(PetInstance.is_active == True)
    ).scalars().first()

    if not instance:
        raise HTTPException(status_code=404, detail="Pet not found")

    valid_slots = {"head", "body", "accessory"}
    if req.slot not in valid_slots:
        raise HTTPException(status_code=400, detail=f"Invalid slot. Must be one of: {valid_slots}")

    # Remove existing item in that slot
    for eq in instance.equipment:
        if eq.slot == req.slot and eq.is_active:
            eq.is_active = False

    equipment = PetEquipment(
        instance_id=instance.id,
        equipment_id=req.equipment_id,
        slot=req.slot,
        name=f"Equipment {req.equipment_id}",
        rarity=req.equipment_id.split("_")[0] if "_" in req.equipment_id else None,
        is_active=True,
    )
    db.add(equipment)
    instance.is_equipped = True
    db.commit()
    db.refresh(equipment)
    return PetEquipResponse(instance_id=instance.instance_id, slot=req.slot, equipment=equipment)


@router.post("/{instance_id}/unequip", response_model=PetInstanceResponse)
def unequip_slot(instance_id: str, slot: str, user_id: str = Query(...), db: Session = Depends(get_db_sync)):
    """Remove equipment from a pet slot."""
    instance = db.execute(
        select(PetInstance)
        .options(joinedload(PetInstance.equipment))
        .where(PetInstance.instance_id == instance_id)
        .where(PetInstance.user_id == user_id)
        .where(PetInstance.is_active == True)
    ).scalars().first()

    if not instance:
        raise HTTPException(status_code=404, detail="Pet not found")

    for eq in instance.equipment:
        if eq.slot == slot and eq.is_active:
            eq.is_active = False

    db.commit()
    db.refresh(instance)
    return instance


@router.post("/{instance_id}/rename", response_model=PetInstanceResponse)
def rename_pet(instance_id: str, nickname: str, user_id: str = Query(...), db: Session = Depends(get_db_sync)):
    """Rename a pet instance."""
    instance = db.execute(
        select(PetInstance)
        .where(PetInstance.instance_id == instance_id)
        .where(PetInstance.user_id == user_id)
        .where(PetInstance.is_active == True)
    ).scalars().first()

    if not instance:
        raise HTTPException(status_code=404, detail="Pet not found")

    instance.nickname = nickname
    db.commit()
    db.refresh(instance)
    return instance


@router.delete("/{instance_id}", status_code=204)
def release_pet(instance_id: str, user_id: str = Query(...), db: Session = Depends(get_db_sync)):
    """Soft-delete a pet instance (release/release pet)."""
    instance = db.execute(
        select(PetInstance)
        .where(PetInstance.instance_id == instance_id)
        .where(PetInstance.user_id == user_id)
        .where(PetInstance.is_active == True)
    ).scalars().first()

    if not instance:
        raise HTTPException(status_code=404, detail="Pet not found")

    instance.is_active = False
    db.commit()
