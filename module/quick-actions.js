import * as ItemSystem from './item-system/index.js';

function caseInsensitiveCompare(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

const ACTIVATION_CATEGORY = {
  ACTION: { sort: 1, name: 'illandril-npc-quick-actions.activation_action' },
  BONUS: { sort: 2, name: 'illandril-npc-quick-actions.activation_bonus' },
  REACTION: { sort: 3, name: 'illandril-npc-quick-actions.activation_reaction' },
  LEGENDARY: { sort: 4, name: 'illandril-npc-quick-actions.activation_legendary' },
  LAIR: { sort: 5, name: 'illandril-npc-quick-actions.activation_lair' },
  SPECIAL: { sort: 6, name: 'illandril-npc-quick-actions.activation_special' },
  CREW: { sort: 7, name: 'illandril-npc-quick-actions.activation_crew' },
  NEW_TURN: { sort: 99, name: 'illandril-npc-quick-actions.activation_new-turn' },
};

const TYPE_CATEGORY = {
  WEAPON: { sort: 1 },
  FEATURE: { sort: 2 },
  SPELL: { sort: 3 },
};

export const get = (actor) => {
  if (!actor) {
    return null;
  }
  let newTurnResets = [];
  const actions = [];
  actor.items.forEach((item) => {
    const action = getAction(actor, item);
    if (action) {
      actions.push(action);
      if (action.newTurnReset) {
        newTurnResets.push(action.newTurnReset);
      }
    }
  });
  actions.sort((a, b) => {
    const activationCategorySort = a.activationCategory.sort - b.activationCategory.sort;
    if (activationCategorySort !== 0) {
      return activationCategorySort;
    }
    const typeCategorySort = a.typeCategory.sort - b.typeCategory.sort;
    if (typeCategorySort !== 0) {
      return typeCategorySort;
    }
    const subcategorySort = a.subcategory - b.subcategory;
    if (subcategorySort !== 0) {
      return subcategorySort;
    }
    return caseInsensitiveCompare(a.name, b.name);
  });
  const maxLegendaryActions = getProperty(actor.data, 'data.resources.legact.max');
  const currentLegendaryActions = getProperty(actor.data, 'data.resources.legact.value');
  if (maxLegendaryActions > currentLegendaryActions) {
    newTurnResets.push(() => {
      ChatMessage.create({
        whisper: [game.userId],
        // TODO: Localize
        content: '*Legendary Actions have been reset*',
        speaker: ChatMessage.getSpeaker({ actor }),
      });
      actor.update({ 'data.resources.legact.value': maxLegendaryActions });
    });
  }
  if (newTurnResets.length > 0) {
    actions.push({
      activationCategory: ACTIVATION_CATEGORY.NEW_TURN,
      roll: () => {
        newTurnResets.forEach((newTurnReset) => {
          newTurnReset();
        });
      },
      name: game.i18n.localize('illandril-npc-quick-actions.reset-for-new-turn'),
    });
  }

  return actions;
};

function getAction(actor, item) {
  let roll = () => item.roll();
  let name = item.name;
  let activationCategory;
  const activationType = getProperty(item.data, 'data.activation.type');
  switch (activationType) {
    case 'action':
      activationCategory = ACTIVATION_CATEGORY.ACTION;
      break;
    case 'bonus':
      activationCategory = ACTIVATION_CATEGORY.BONUS;
      break;
    case 'reaction':
      activationCategory = ACTIVATION_CATEGORY.REACTION;
      break;
    case 'legendary':
      activationCategory = ACTIVATION_CATEGORY.LEGENDARY;
      break;
    case 'lair':
      activationCategory = ACTIVATION_CATEGORY.LAIR;
      break;
    case 'crew':
      activationCategory = ACTIVATION_CATEGORY.CREW;
      break;
    case 'special':
      activationCategory = ACTIVATION_CATEGORY.SPECIAL;
      break;
    case 'minute':
    case 'hour':
    case 'day':
    default:
      return null;
  }

  let subcategory = 0;
  let typeCategory;
  switch (item.data.type) {
    case 'feat':
      typeCategory = TYPE_CATEGORY.FEATURE;
      break;
    case 'spell':
      typeCategory = TYPE_CATEGORY.SPELL;
      roll = () => actor.useSpell(item);
      const spellData = item.data.data;
      const preparationMode = (spellData.preparation && spellData.preparation.mode) || 'prepared';
      switch (preparationMode) {
        case 'pact':
        // TODO: Localize
          name = '[P] ' + name;
          subcategory = 0.5;
          break;
        case 'always':
        case 'prepared':
          subcategory = spellData.level;
          if (spellData.level === 0) {
            // TODO: Localize
            name = '[C] ' + name;
          } else {
            name = '[' + spellData.level + '] ' + name;
          }
          break;
        case 'innate':
          subcategory = -10;
          // TODO: Localize
          name = '[I] ' + name;
          break;
        case 'atwill':
          subcategory = -20;
          // TODO: Localize
          name = '[W] ' + name;
          break;
        default:
          subcategory = -30;
          name = '[?] ' + name;
          break;
      }
      break;
    case 'weapon':
      typeCategory = TYPE_CATEGORY.WEAPON;
      break;
    default:
      console.log('Unsupported type: ' + item.data.type);
      return null;
  }

  let newTurnReset = null;
  let uses = ItemSystem.calculateUsesForItem(item);
  if (uses !== null) {
    if(uses.maximum) {
      name = `${name} (${uses.available} / ${uses.maximum})`;
    } else {
      name = `${name} (${uses.available})`;
    }

    const recharge = item.data.type === 'feat' ? item.data.data.recharge : null;
    if (recharge && recharge.value && !recharge.charged) {
      newTurnReset = () => {
        const resetRoll = new Roll('1d6');
        resetRoll.roll();
        // TODO: Localize
        let flavor = item.name + ' - Recharge Roll: ';
        if (resetRoll.total >= recharge.value) {
          item.update({ 'data.recharge.charged': true });
          // TODO: Localize
          flavor += '☑';
        } else {
          // TODO: Localize
          flavor += '☒';
        }
        resetRoll.toMessage({ flavor, speaker: ChatMessage.getSpeaker({ actor }) });
      };
    }
  }
  if (uses === 0 && newTurnReset === null) {
    return null;
  }
  return {
    roll,
    name,
    activationCategory,
    typeCategory,
    subcategory,
    newTurnReset,
  };
}
