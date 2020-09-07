export const calculateUsesForItem = (item) => {
  const itemData = item.data.data;
  const consume = itemData.consume;
  if (consume && consume.target) {
    return calculateConsumeUses(item.actor, consume);
  }
  const uses = itemData.uses;
  if (uses && (uses.max > 0 || uses.value > 0)) {
    return calculateLimitedUses(itemData);
  }

  const itemType = item.data.type;
  if (itemType === 'feat') {
    return calculateFeatUses(itemData);
  } else if (itemType === 'consumable') {
    return itemData.quantity;
  } else if (itemType === 'spell') {
    return calculateSpellUses(item);
  } else if (itemType === 'weapon') {
    return calculateWeaponUses(itemData);
  }
  return null;
};

function calculateConsumeUses(actor, consume) {
  let consumeRemaining = null;
  if (consume.type === 'attribute') {
    const value = getProperty(actor.data.data, consume.target);
    if (typeof value === 'number') {
      consumeRemaining = value;
    } else {
      consumeRemaining = 0;
    }
  } else if (consume.type === 'ammo' || consume.type === 'material') {
    const targetItem = actor.items.get(consume.target);
    if (targetItem) {
      consumeRemaining = targetItem.data.data.quantity;
    } else {
      consumeRemaining = 0;
    }
  } else if (consume.type === 'charges') {
    const targetItem = actor.items.get(consume.target);
    if (targetItem) {
      consumeRemaining = calculateLimitedUses(targetItem.data.data);
    } else {
      consumeRemaining = 0;
    }
  }
  if(consumeRemaining !== null) {
    if(consume.amount > 1) {
      return Math.floor(consumeRemaining / consume.amount);
    } else {
      return consumeRemaining;
    }
  }
  return null;
}

function calculateLimitedUses(itemData) {
  let uses = itemData.uses.value;
  let maxUses = itemData.uses.max;
  const quantity = itemData.quantity;
  if (quantity) {
    return uses + (quantity - 1) * maxUses;
  } else {
    return uses;
  }
}

function calculateFeatUses(itemData) {
  if (itemData.recharge && itemData.recharge.value) {
    return itemData.recharge.charged ? 1 : 0;
  }
  return null;
}

function calculateSpellUses(item) {
  const itemData = item.data.data;
  const actorData = item.actor.data.data;
  let slots;
  const preparationMode = itemData.preparation.mode;
  if (preparationMode === 'pact') {
    slots = actorData.spells['pact'].value;
  } else if (preparationMode === 'innate' || preparationMode === 'atwill') {
    slots = null;
  } else {
    let level = itemData.level;
    if (level > 0) {
      slots = actorData.spells['spell' + level].value;
    } else {
      slots = null;
    }
  }
  return slots;
}

function calculateWeaponUses(itemData) {
  // If the weapon is a thrown weapon, but not a returning weapon, show quantity
  if (itemData.properties.thr && !itemData.properties.ret) {
    return itemData.quantity;
  }
  return null;
}
