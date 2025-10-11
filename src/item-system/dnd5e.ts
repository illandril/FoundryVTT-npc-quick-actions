import module from '../module';

type CalculatedUses = {
  available: number;
  maximum?: number | null;
};

export const calculateUsesForItem = (item: dnd5e.documents.Item5e): CalculatedUses | null => {
  module.logger.debug('calculateUsesForItem()', item);
  if (!item.actor) {
    module.logger.error('Could not calculate uses for item - no associated actor', item);
    return null;
  }

  // Use the augmented ItemSystemData interface for local checks
  const itemData = item.system as dnd5e.documents.ItemSystemData;

  // If this item consumes another resource (attribute/ammo/charges/material), handle that first
  const consume = (itemData as dnd5e.documents.ItemSystemData.ActivatedEffect).consume;
  if (consume?.target) return calculateConsumeUses(item.actor, consume);

  // Limited uses defined on consumables (uses.value / uses.max)
  const uses = (itemData as dnd5e.documents.ItemSystemData.Consumable).uses;
  if ((typeof uses?.max === 'number' && uses.max > 0) || (typeof uses?.value === 'number' && uses.value > 0)) {
    return calculateLimitedUses(itemData as dnd5e.documents.ItemSystemData.Consumable);
  }

  // Route by item type
  switch (item.type) {
    case 'feat':
      return calculateFeatUses(itemData as dnd5e.documents.ItemSystemData.Feat);
    case 'consumable':
      return { available: (itemData as dnd5e.documents.ItemSystemData.PhysicalItem).quantity ?? 0 };
    case 'spell':
      return calculateSpellUses(itemData as dnd5e.documents.ItemSystemData.Spell, item.actor);
    case 'weapon':
      return calculateWeaponUses(itemData as dnd5e.documents.ItemSystemData.Weapon);
    default:
      return null;
  }
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Legacy
function calculateConsumeUses(
  actor: dnd5e.documents.Actor5e,
  consume: NonNullable<dnd5e.documents.ItemSystemData.ActivatedEffect['consume']>,
) {
  module.logger.debug('calculateConsumeUses()', actor, consume);

  let available: number | null = null;
  let maximum: number | null = null;

  if (consume.type === 'attribute') {
    const value = foundry.utils.getProperty(actor.system, consume.target ?? 'INVALID');
    module.logger.debug('calculateConsumeUses - attribute', consume.target, value);
    available = typeof value === 'number' ? value : 0;
  } else if (consume.type === 'ammo' || consume.type === 'material') {
    const targetItem = actor.items.get(consume.target ?? 'INVALID');
    module.logger.debug('calculateConsumeUses - ammo/material', targetItem);
    if (targetItem && 'quantity' in targetItem.system) {
      available = targetItem.system.quantity ?? 0;
    } else {
      available = 0;
    }
  } else if (consume.type === 'charges') {
    const targetItem = actor.items.get(consume.target ?? 'INVALID');
    module.logger.debug('calculateConsumeUses - charges', targetItem);
    if (targetItem) {
      ({ available, maximum } = calculateLimitedUses(targetItem.system));
    } else {
      available = 0;
    }
  }

  if (available === null) {
    module.logger.debug('calculateConsumeUses result', null);
    return null;
  }

  if (consume.amount && consume.amount > 1) {
    module.logger.debug('calculateConsumeUses divide by amount', available, maximum, consume.amount);
    available = Math.floor(available / consume.amount);
    if (maximum !== null) maximum = Math.floor(maximum / consume.amount);
  }

  module.logger.debug('calculateConsumeUses result', available, maximum);
  return { available, maximum };
}

function getNumericalMax(max: string | number | undefined): number {
    if (typeof max === 'string') {
        const parsed = Number.parseInt(max, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    return typeof max === 'number' ? max : 0;
}

function calculateLimitedUses(itemData: dnd5e.documents.ItemSystemData.Consumable) {
  let available = itemData.uses?.value ?? 0;
  let maximum = getNumericalMax(itemData.uses?.max);

  // If the item has a quantity > 1, scale available/maximum by quantity
  const quantity = itemData.quantity ?? 0;
  if (quantity > 0) {
    available = available + (quantity - 1) * maximum;
    maximum = maximum * quantity;
  }
  return { available, maximum };
}

function calculateFeatUses(itemData: dnd5e.documents.ItemSystemData.Feat) {
  if (itemData.recharge?.value) {
    return { available: itemData.recharge.charged ? 1 : 0, maximum: 1 };
  }
  return null;
}

/**
 * Calculate uses for a spell item.
 * Returns null when the spell does not consume limited resources (at-will/innate)
 * or when the actor doesn't expose spell data for the relevant method/level.
 */
function calculateSpellUses(itemData: dnd5e.documents.ItemSystemData.Spell, actor: dnd5e.documents.Actor5e) {
  const actorData = actor.system as dnd5e.documents.ActorSystemData;

  // Helper to build the result object when values are known.
  const makeResult = (available: number, maximum: number | null = null) => ({ available, maximum });

  const method = itemData.method;

  // Pact magic uses the actor's pact slot pool
  if (method === 'pact') {
    const pact = actorData.spells?.pact;
    if (pact) return makeResult(pact.value ?? 0, pact.max ?? 0);
    return makeResult(0, 0);
  }

  // Innate and at-will spells do not consume limited resources
  if (method === 'innate' || method === 'atwill') {
    return null;
  }

  // Spell-like abilities that consume spell slots: use the item's level to index actor.spells
  const level = itemData.level ?? 0;
  if (typeof level !== 'number' || level <= 0) return null;

  const pool = actorData.spells?.[`spell${level}`];
  if (!pool) return null;
  return makeResult(pool.value ?? 0, pool.max ?? 0);
}

function calculateWeaponUses(itemData: dnd5e.documents.ItemSystemData.Weapon) {
  // If the weapon is a thrown weapon, but not a returning weapon, show quantity
  if (foundry.utils.getProperty(itemData.properties, 'thr') && !foundry.utils.getProperty(itemData.properties, 'ret')) {
    return { available: itemData.quantity ?? 0, maximum: null };
  }
  return null;
}
