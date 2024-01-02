import module from '../module';

type CalculatedUses = {
  available: number
  maximum?: number | null
};

export const calculateUsesForItem = (item: dnd5e.documents.Item5e): CalculatedUses | null => {
  module.logger.debug('calculateUsesForItem()', item);
  if (!item.actor) {
    module.logger.error('Could not calculate uses for item - no associated actor', item);
    return null;
  }
  const itemData = item.system;
  const consume = (itemData as dnd5e.documents.ItemSystemData.ActivatedEffect).consume;
  if (consume && consume.target) {
    return calculateConsumeUses(item.actor, consume);
  }
  const uses = (itemData as dnd5e.documents.ItemSystemData.Consumable).uses;
  if (typeof uses?.max === 'number' && uses.max > 0 || typeof uses?.value === 'number' && uses.value > 0) {
    return calculateLimitedUses(itemData);
  }

  const itemType = item.type;
  if (itemType === 'feat') {
    return calculateFeatUses(itemData);
  }
  if (itemType === 'consumable') {
    return {
      available: (itemData as dnd5e.documents.ItemSystemData.PhysicalItem).quantity ?? 0,
    };
  }
  if (itemType === 'spell') {
    return calculateSpellUses(itemData as dnd5e.documents.ItemSystemData.Spell, item.actor);
  }
  if (itemType === 'weapon') {
    return calculateWeaponUses(itemData as dnd5e.documents.ItemSystemData.Weapon);
  }
  return null;
};

function calculateConsumeUses(actor: dnd5e.documents.Actor5e, consume: NonNullable<dnd5e.documents.ItemSystemData.ActivatedEffect['consume']>) {
  module.logger.debug('calculateConsumeUses()', actor, consume);
  let available: number | null = null;
  let maximum: number | null = null;
  if (consume.type === 'attribute') {
    const value = foundry.utils.getProperty(actor.system, consume.target ?? 'INVALID');
    module.logger.debug('calculateConsumeUses - attribute', consume.target, value);
    if (typeof value === 'number') {
      available = value;
    } else {
      available = 0;
    }
  } else if (consume.type === 'ammo' || consume.type === 'material') {
    const targetItem = actor.items.get(consume.target ?? 'INVALID');
    module.logger.debug('calculateConsumeUses - ammot', targetItem);
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
  if (available !== null) {
    if (consume.amount && consume.amount > 1) {
      module.logger.debug('calculateConsumeUses divide by amount', available, maximum, consume.amount);
      available = Math.floor(available / consume.amount);
      if (maximum !== null) {
        maximum = Math.floor(maximum / consume.amount);
      }
    }
    module.logger.debug('calculateConsumeUses result', available, maximum);
    return { available, maximum };
  }
  module.logger.debug('calculateConsumeUses result', null);
  return null;
}

function calculateLimitedUses(itemData: dnd5e.documents.ItemSystemData.Consumable) {
  let available = itemData.uses?.value ?? 0;
  let maximum = itemData.uses?.max ?? 0;
  if (typeof maximum === 'string') {
    maximum = parseInt(maximum, 10);
    if (isNaN(maximum)) {
      maximum = 0;
    }
  }
  const quantity = itemData.quantity;
  if (quantity) {
    available = available + (quantity - 1) * maximum;
    maximum = maximum * quantity;
  }
  return { available, maximum };
}

function calculateFeatUses(itemData: dnd5e.documents.ItemSystemData.Feat) {
  if (itemData.recharge && itemData.recharge.value) {
    return { available: itemData.recharge.charged ? 1 : 0, maximum: 1 };
  }
  return null;
}

function calculateSpellUses(itemData: dnd5e.documents.ItemSystemData.Spell, actor: dnd5e.documents.Actor5e) {
  const actorData = actor.system as dnd5e.documents.ActorSystemData.Character;
  let available: number | null = null;
  let maximum: number | null = null;
  const preparationMode = itemData.preparation?.mode;
  if (preparationMode === 'pact') {
    available = actorData.spells?.pact?.value ?? 0;
    maximum = actorData.spells?.pact?.max ?? 0;
  } else if (preparationMode === 'innate' || preparationMode === 'atwill') {
    // None
  } else {
    const level = itemData.level ?? 0;
    if (level > 0) {
      const spellLevelData = actorData.spells?.[`spell${level}` as 'spell1'];
      available = spellLevelData?.value ?? 0;
      maximum = spellLevelData?.max ?? 0;
    }
  }
  if (available === null) {
    return null;
  }
  return { available, maximum };
}

function calculateWeaponUses(itemData: dnd5e.documents.ItemSystemData.Weapon) {
  // If the weapon is a thrown weapon, but not a returning weapon, show quantity
  if (foundry.utils.getProperty(itemData.properties, 'thr') && !foundry.utils.getProperty(itemData.properties, 'ret')) {
    return { available: itemData.quantity ?? 0, maximum: null };
  }
  return null;
}
