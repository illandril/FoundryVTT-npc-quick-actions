import Settings from './settings.js';
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
  EQUIPMENT: { sort: 2 },
  CONSUMABLE: { sort: 3 },
  OTHER: { sort: 4 },
  FEATURE: { sort: 5 },
  SPELL: { sort: 6 },
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
  const maxLegendaryActions = getProperty(actor.system, 'resources.legact.max');
  const currentLegendaryActions = getProperty(actor.system, 'resources.legact.value');
  if (maxLegendaryActions > currentLegendaryActions) {
    newTurnResets.push(() => {
      ChatMessage.create({
        whisper: [game.userId],
        content: game.i18n.localize('illandril-npc-quick-actions.legendary-actions-reset'),
        speaker: ChatMessage.getSpeaker({ actor }),
      });
      actor.update({ 'system.resources.legact.value': maxLegendaryActions });
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
  const roll = () => item.use();
  let name = item.name;
  let activationCategory;
  const activationType = getProperty(item.system, 'activation.type');
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
  const itemType = item.type;
  switch (itemType) {
    case 'feat':
      typeCategory = TYPE_CATEGORY.FEATURE;
      break;
    case 'spell':
      typeCategory = TYPE_CATEGORY.SPELL;
      const spellData = item.system;
      const preparationMode = (spellData.preparation && spellData.preparation.mode) || 'prepared';
      let prefix;
      switch (preparationMode) {
        case 'pact':
          prefix = game.i18n.localize("illandril-npc-quick-actions.spell-abbr.pact");
          subcategory = 0.5;
          break;
        case 'prepared':
          if (actor.type !== 'npc' && !spellData.preparation.prepared) {
            if (actor.hasPlayerOwner) {
              if (!Settings.ShowUnpreparedPCSpells.get()) {
                return null;
              }
            } else {
              if (!Settings.ShowUnpreparedNPCSpells.get()) {
                return null;
              }
            }
          }
        // No break
        case 'always':
          subcategory = spellData.level;
          if (spellData.level === 0) {
            prefix = game.i18n.localize("illandril-npc-quick-actions.spell-abbr.cantrip");
          } else {
            prefix = `${spellData.level}`;
          }
          break;
        case 'innate':
          subcategory = -10;
          prefix = game.i18n.localize("illandril-npc-quick-actions.spell-abbr.innate");
          break;
        case 'atwill':
          subcategory = -20;
          prefix = game.i18n.localize("illandril-npc-quick-actions.spell-abbr.atwill");
          break;
        default:
          subcategory = -30;
          prefix = game.i18n.localize("illandril-npc-quick-actions.spell-abbr.unknown");
          break;
      }
      name =  `[${prefix}] ${name}`;
      break;
    default:
      if (itemType === 'weapon') {
        typeCategory = TYPE_CATEGORY.WEAPON;
      } else if (itemType === 'equipment') {
        typeCategory = TYPE_CATEGORY.EQUIPMENT;
      } else if (itemType === 'consumable') {
        typeCategory = TYPE_CATEGORY.CONSUMABLE;
      } else {
        typeCategory = TYPE_CATEGORY.OTHER;
      }
      if (actor.type !== 'npc' && !getProperty(item.system, 'equipped')) {
        if (actor.hasPlayerOwner) {
          if (!Settings.ShowUnequippedPCItems.get()) {
            return null;
          }
        } else {
          if (!Settings.ShowUnequippedNPCItems.get()) {
            return null;
          }
        }
      }
      break;
  }

  let newTurnReset = null;
  let uses = ItemSystem.calculateUsesForItem(item);
  if (uses) {
    if (uses.maximum) {
      name = `${name} (${uses.available} / ${uses.maximum})`;
    } else {
      name = `${name} (${uses.available})`;
    }

    const recharge = item.type === 'feat' ? item.system.recharge : null;
    if (recharge && recharge.value && !recharge.charged) {
      newTurnReset = async () => {
        const resetRoll = new Roll('1d6');
        await resetRoll.evaluate({ async: true });
        let flavor = `${item.name} - ${game.i18n.localize("illandril-npc-quick-actions.recharge-roll")}: `;
        if (resetRoll.total >= recharge.value) {
          item.update({ 'system.recharge.charged': true });
          flavor += game.i18n.localize("illandril-npc-quick-actions.recharge-success");
        } else {
          flavor += game.i18n.localize("illandril-npc-quick-actions.recharge-fail");
        }
        resetRoll.toMessage({ flavor, speaker: ChatMessage.getSpeaker({ actor }) });
      };
    } else if (uses.available === 0 && !Settings.ShowZeroUsesRemainActions.get()) {
      return null;
    }
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
