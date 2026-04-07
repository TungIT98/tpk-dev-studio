/**
 * PetClient.ts
 * Typed HTTP client for the FastAPI pet backend endpoints.
 * All methods return plain objects (not raw fetch Response).
 */

import type {
  PetTypeDefinition,
  PetFullInstance,
  PetInstance,
} from "../shared/types";
import { getPetDef } from "./petDefinitions";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// ── Low-level fetch wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new PetApiError(res.status, path, body);
  }
  return res.json() as Promise<T>;
}

export class PetApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly body: string,
  ) {
    super(`PetAPI ${status} ${path}: ${body}`);
    this.name = "PetApiError";
  }
}

// ── Response shape helpers ─────────────────────────────────────────────────────

interface PetTypeResponse {
  pet_type_id: string;
  name: string;
  description: string;
  rarity: string;
  base_cost: number;
  unlock_level: number;
  evolve_to: string | null;
  pet_metadata: {
    evolve_level_req?: number;
    start_level?: number;
    [key: string]: unknown;
  };
  is_active: boolean;
}

function hydratePetType(raw: PetTypeResponse): PetTypeDefinition {
  const def = getPetDef(raw.pet_type_id);
  if (def) return def;
  // Fallback: construct from API (shouldn't happen often with static defs)
  return {
    pet_type_id: raw.pet_type_id,
    name: raw.name,
    description: raw.description,
    rarity: raw.rarity as PetTypeDefinition["rarity"],
    base_cost: raw.base_cost,
    unlock_level: raw.unlock_level,
    evolve_to: raw.evolve_to,
    stage: 1,
    base_stats: { hp: 50, atk: 40, def: 30, spd: 30 },
    growth_stats: { hp: 8, atk: 7, def: 5, spd: 6 },
    max_level: 100,
    color: 0xffffff,
    shape: "circle",
    icon_emoji: "❓",
  };
}

interface PetInstanceResponse {
  instance_id: string;
  pet_type_id: string;
  nickname: string | null;
  level: number;
  experience: number;
  evolve_level_req: number;
  is_equipped: boolean;
  is_active: boolean;
  acquired_at: string;
  pet_type?: PetTypeResponse;
  skills?: Array<{
    skill_id: string;
    name: string;
    level: number;
    cooldown_remaining: number;
    is_active: boolean;
  }>;
  equipment?: Array<{
    equipment_id: string;
    slot: string;
    name: string;
    rarity: string | null;
    bonus_type: string | null;
    bonus_value: number;
    is_active: boolean;
  }>;
}

function hydratePetInstance(raw: PetInstanceResponse): PetFullInstance {
  return {
    instance_id: raw.instance_id,
    pet_type_id: raw.pet_type_id,
    nickname: raw.nickname,
    level: raw.level,
    experience: raw.experience,
    evolve_level_req: raw.evolve_level_req,
    is_equipped: raw.is_equipped,
    is_active: raw.is_active,
    acquired_at: raw.acquired_at,
    pet_type: raw.pet_type ? hydratePetType(raw.pet_type) : getPetDef(raw.pet_type_id),
    skills: (raw.skills ?? []) as PetFullInstance["skills"],
    equipment: (raw.equipment ?? []) as PetFullInstance["equipment"],
  };
}

// ── PetClient ──────────────────────────────────────────────────────────────────

export class PetClient {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /** Fetch all pet types (optionally filtered by rarity). */
  async listPetTypes(rarity?: string): Promise<PetTypeDefinition[]> {
    const params = rarity ? `?rarity=${rarity}` : "";
    const raw = await apiFetch<PetTypeResponse[]>(`/api/pets/types${params}`);
    return raw.map(hydratePetType);
  }

  /** Fetch a single pet type. */
  async getPetType(petTypeId: string): Promise<PetTypeDefinition> {
    const raw = await apiFetch<PetTypeResponse>(`/api/pets/types/${petTypeId}`);
    return hydratePetType(raw);
  }

  /** List all pets owned by the current user. */
  async listMyPets(equippedOnly = false): Promise<PetFullInstance[]> {
    const params = `?user_id=${encodeURIComponent(this.userId)}&equipped_only=${equippedOnly}`;
    const raw = await apiFetch<PetInstanceResponse[]>(`/api/pets${params}`);
    return raw.map(hydratePetInstance);
  }

  /** Look up a specific pet instance. */
  async lookupPet(instanceId: string): Promise<PetFullInstance> {
    const raw = await apiFetch<PetInstanceResponse>(`/api/pets/lookup/${instanceId}`);
    return hydratePetInstance(raw);
  }

  /** Acquire a new pet (mint a pet instance). */
  async acquirePet(petTypeId: string, nickname?: string): Promise<PetFullInstance> {
    const raw = await apiFetch<PetInstanceResponse>("/api/pets", {
      method: "POST",
      body: JSON.stringify({ pet_type_id: petTypeId, user_id: this.userId, nickname }),
    });
    return hydratePetInstance(raw);
  }

  /** Evolve a pet if level requirements are met. */
  async evolvePet(instanceId: string): Promise<PetFullInstance> {
    const raw = await apiFetch<PetInstanceResponse>(`/api/pets/${instanceId}/evolve`, {
      method: "POST",
      body: JSON.stringify({ user_id: this.userId }),
    });
    return hydratePetInstance(raw);
  }

  /** Equip an item to a pet slot. */
  async equipPet(
    instanceId: string,
    slot: "head" | "body" | "accessory",
    equipmentId: string,
  ): Promise<unknown> {
    return apiFetch(`/api/pets/${instanceId}/equip`, {
      method: "POST",
      body: JSON.stringify({ user_id: this.userId, slot, equipment_id: equipmentId }),
    });
  }

  /** Unequip a pet slot. */
  async unequipPet(instanceId: string, slot: string): Promise<PetFullInstance> {
    const raw = await apiFetch<PetInstanceResponse>(
      `/api/pets/${instanceId}/unequip?user_id=${encodeURIComponent(this.userId)}&slot=${slot}`,
      { method: "POST" },
    );
    return hydratePetInstance(raw);
  }

  /** Rename a pet. */
  async renamePet(instanceId: string, nickname: string): Promise<PetFullInstance> {
    const raw = await apiFetch<PetInstanceResponse>(
      `/api/pets/${instanceId}/rename?user_id=${encodeURIComponent(this.userId)}&nickname=${encodeURIComponent(nickname)}`,
      { method: "POST" },
    );
    return hydratePetInstance(raw);
  }

  /** Release (soft-delete) a pet. */
  async releasePet(instanceId: string): Promise<void> {
    await apiFetch(`/api/pets/${instanceId}?user_id=${encodeURIComponent(this.userId)}`, {
      method: "DELETE",
    });
  }
}
