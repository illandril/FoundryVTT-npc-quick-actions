import * as ItemSystem from './item-system';
import module from './module';
import { ShowZeroUsesRemainActions, showUnequippedItems, showUnpreparedSpells } from './settings';

function caseInsensitiveCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

export type Action = {
  roll: () => void;
  actor: Actor;
  item?: Item;
  name: string;
  activationCategory: ActivationCategory;
  typeCategory: TypeCategory;
  subcategory: number;
  newTurnReset?: (() => Promise<void>) | null;
};

export const get = (actor: Actor) => {
  if (!actor) {
    return null;
  }
  const newTurnResets: (() => Promise<void>)[] = [];
  const actions: Action[] = [];
  for (const item of actor.items) {
    const action = getAction(actor, item as dnd5e.documents.Item5e);
    if (action) {
      actions.push(action);
      if (action.newTurnReset) {
        newTurnResets.push(action.newTurnReset);
      }
    }
  }
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
  const maxLegendaryActions = foundry.utils.getProperty(actor.system, 'resources.legact.max');
  const currentLegendaryActions = foundry.utils.getProperty(actor.system, 'resources.legact.value');
  if (
    typeof maxLegendaryActions === 'number' &&
    typeof currentLegendaryActions === 'number' &&
    maxLegendaryActions > currentLegendaryActions
  ) {
    newTurnResets.push(async () => {
      if (!game.userId) {
        throw new Error('game.userId was not set - this is unexpected');
      }

      ChatMessage.create({
        whisper: [game.userId],
        content: module.localize('legendary-actions-reset'),
        speaker: { actor },
      });
      await actor.update({ 'system.resources.legact.value': maxLegendaryActions });
    });
  }
  if (newTurnResets.length > 0) {
    actions.push({
      roll: () => {
        for (const newTurnReset of newTurnResets) {
          void newTurnReset();
        }
      },
      actor,
      name: module.localize('reset-for-new-turn'),
      activationCategory: ACTIVATION_CATEGORY.newTurn,
      typeCategory: TYPE_CATEGORY.other,
      subcategory: 0,
    });
  }

  return actions;
};

export type ActivationCategory = {
  sort: number;
  name: string;
};
const ACTIVATION_CATEGORY = {
  action: { sort: 1, name: 'illandril-npc-quick-actions.activation_action' },
  bonus: { sort: 2, name: 'illandril-npc-quick-actions.activation_bonus' },
  reaction: { sort: 3, name: 'illandril-npc-quick-actions.activation_reaction' },
  legendary: { sort: 4, name: 'illandril-npc-quick-actions.activation_legendary' },
  lair: { sort: 5, name: 'illandril-npc-quick-actions.activation_lair' },
  special: { sort: 6, name: 'illandril-npc-quick-actions.activation_special' },
  crew: { sort: 7, name: 'illandril-npc-quick-actions.activation_crew' },
  newTurn: { sort: 99, name: 'illandril-npc-quick-actions.activation_new-turn' },
};

const getActivationCategory = (item: Item) => {
  let activationCategory: ActivationCategory | null;
  const activationType = foundry.utils.getProperty(item.system, 'activation.type');
  switch (activationType) {
    case 'action':
      activationCategory = ACTIVATION_CATEGORY.action;
      break;
    case 'bonus':
      activationCategory = ACTIVATION_CATEGORY.bonus;
      break;
    case 'reaction':
      activationCategory = ACTIVATION_CATEGORY.reaction;
      break;
    case 'legendary':
      activationCategory = ACTIVATION_CATEGORY.legendary;
      break;
    case 'lair':
      activationCategory = ACTIVATION_CATEGORY.lair;
      break;
    case 'crew':
      activationCategory = ACTIVATION_CATEGORY.crew;
      break;
    case 'special':
      activationCategory = ACTIVATION_CATEGORY.special;
      break;
    // minute, hour, and day intentionally included in default
    default:
      activationCategory = null;
  }
  return activationCategory;
};

type TypeCategory = {
  sort: number;
  prefix?: string;
};
const TYPE_CATEGORY = {
  weapon: { sort: 1 },
  equipment: { sort: 2 },
  consumable: { sort: 3 },
  other: { sort: 4 },
  feature: { sort: 5 },
  spell: { sort: 6 },
};

const getSpellTypeCategory = (item: Item): Pick<Action, 'typeCategory' | 'subcategory'> | null => {
  let subcategory = 0;
  const spellData = item.system as dnd5e.documents.ItemSystemData.Spell;
  let prefix: string;
  switch (spellData.preparation?.mode ?? 'prepared') {
    case 'pact':
      prefix = module.localize('spell-abbr.pact');
      subcategory = 0.5;
      break;
    // biome-ignore lint/suspicious/noFallthroughSwitchClause: 'prepared' intentionally falls through
    case 'prepared':
      if (item.actor?.type !== 'npc' && !spellData.preparation?.prepared) {
        if (!showUnpreparedSpells(item.actor)) {
          return null;
        }
      }
    case 'always':
      subcategory = spellData.level ?? 0;
      if (subcategory === 0) {
        prefix = module.localize('spell-abbr.cantrip');
      } else {
        prefix = `${spellData.level}`;
      }
      break;
    case 'innate':
      subcategory = -10;
      prefix = module.localize('spell-abbr.innate');
      break;
    case 'atwill':
      subcategory = -20;
      prefix = module.localize('spell-abbr.atwill');
      break;
    default:
      subcategory = -30;
      prefix = module.localize('spell-abbr.unknown');
      break;
  }

  return {
    subcategory,
    typeCategory: {
      ...TYPE_CATEGORY.spell,
      prefix: `[${prefix}] `,
    },
  };
};

const getTypeCategory = (item: Item): Pick<Action, 'typeCategory' | 'subcategory'> | null => {
  const subcategory = 0;
  let typeCategory: TypeCategory;
  const itemType = item.type;
  switch (itemType) {
    case 'feat':
      typeCategory = TYPE_CATEGORY.feature;
      break;
    case 'spell':
      return getSpellTypeCategory(item);
    default:
      if (itemType === 'weapon') {
        typeCategory = TYPE_CATEGORY.weapon;
      } else if (itemType === 'equipment') {
        typeCategory = TYPE_CATEGORY.equipment;
      } else if (itemType === 'consumable') {
        typeCategory = TYPE_CATEGORY.consumable;
      } else {
        typeCategory = TYPE_CATEGORY.other;
      }
      if (item.actor?.type !== 'npc' && !foundry.utils.getProperty(item.system, 'equipped')) {
        if (!showUnequippedItems(item.actor)) {
          return null;
        }
      }
      break;
  }
  return { typeCategory, subcategory };
};

const getNewTurnReset = (item: dnd5e.documents.Item5e, formula: string, rechargeValue: number) => {
  return async () => {
    const resetRoll = new Roll(formula);
    await resetRoll.evaluate({ async: true });
    let flavor = `${item.name} - ${module.localize('recharge-roll')}: `;
    if (resetRoll.total >= rechargeValue) {
      void item.update({ 'system.recharge.charged': true });
      flavor += module.localize('recharge-success');
    } else {
      flavor += module.localize('recharge-fail');
    }
    void resetRoll.toMessage({ flavor, speaker: { actor: item.actor || undefined } });
  };
};
const getAction = (actor: Actor, item: dnd5e.documents.Item5e): Action | null => {
  module.logger.debug('getAction()', actor, item);
  const roll = () => {
    void item.use();
  };
  const activationCategory = getActivationCategory(item);
  if (!activationCategory) {
    module.logger.debug('getAction() - no activation category');
    return null;
  }
  const typeCategory = getTypeCategory(item);
  if (!typeCategory) {
    module.logger.debug('getAction() - no type category');
    return null;
  }
  let name = `${typeCategory.typeCategory?.prefix ?? ''}${item.name}`;
  module.logger.debug('getAction() - name', name);

  let newTurnReset: (() => Promise<void>) | null = null;
  const uses = ItemSystem.calculateUsesForItem(item);
  if (uses) {
    module.logger.debug('getAction() - uses', uses);
    if (uses.maximum) {
      name = `${name} (${uses.available} / ${uses.maximum})`;
    } else {
      name = `${name} (${uses.available})`;
    }
    module.logger.debug('getAction() - name', name);

    const recharge = item.type === 'feat' ? (item.system as dnd5e.documents.ItemSystemData.Feat).recharge : null;
    if (recharge && typeof recharge.value === 'number' && !recharge.charged) {
      module.logger.debug('getAction() - has newTurnReset');
      newTurnReset = getNewTurnReset(item, '1d6', recharge.value);
    } else if (uses.available === 0 && !ShowZeroUsesRemainActions.get()) {
      return null;
    }
  }
  const action = {
    roll,
    actor,
    item,
    name,
    activationCategory,
    ...typeCategory,
    newTurnReset,
  };
  module.logger.debug('getAction() return', action);
  return action;
};
