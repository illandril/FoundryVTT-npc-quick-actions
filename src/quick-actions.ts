import * as ItemSystem from './item-system';
import module from './module';
import { ShowOnlyFavorites, ShowZeroUsesRemainActions, showUnequippedItems, showUnpreparedSpells } from './settings';

// --- Utility Functions ---

function caseInsensitiveCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

// --- Action and Category Types & Constants ---

export type Action = {
  roll: () => void;
  actor: dnd5e.documents.Actor5e;
  item?: dnd5e.documents.Item5e;
  name: string;
  activationCategory: ActivationCategory;
  typeCategory: TypeCategory;
  subcategory: number;
  newTurnReset?: (() => Promise<void>) | null;
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

// --- Category Logic Helpers ---

/**
 * Uses a map lookup to convert the item's activation type string to an ActivationCategory object.
 * This replaces the verbose switch statement with a single lookup and null check.
 */
const getActivationCategory = (item: Item): ActivationCategory | null => {
  const activationType = foundry.utils.getProperty(item.system, 'activation.type');
  if (activationType) {
    const activationMap: Record<string, ActivationCategory> = {
        action: ACTIVATION_CATEGORY.action,
        bonus: ACTIVATION_CATEGORY.bonus,
        reaction: ACTIVATION_CATEGORY.reaction,
        legendary: ACTIVATION_CATEGORY.legendary,
        lair: ACTIVATION_CATEGORY.lair,
        crew: ACTIVATION_CATEGORY.crew,
        special: ACTIVATION_CATEGORY.special,
    };
    // The keys 'minute', 'hour', and 'day' will correctly fall to 'null'
    return activationMap[activationType] ?? null;
  }
  return null;
};

const getSpellTypeCategory = (item: Item): Pick<Action, 'typeCategory' | 'subcategory'> | null => {
  let subcategory = 0;
  const spellData = item.system as dnd5e.documents.ItemSystemData.Spell;
  let prefix: string;
  switch (spellData.method ?? 'prepared') {
    case 'pact':
      prefix = module.localize('spell-abbr.pact');
      subcategory = 0.5;
      break;
    // biome-ignore lint/suspicious/noFallthroughSwitchClause: 'prepared' intentionally falls through
    case 'prepared':
      if (item.actor?.type !== 'npc' && !spellData.prepared) {
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

/**
 * Handles non-feat and non-spell item types (weapon, equipment, consumable, other).
 * Contains the logic for filtering unequipped items.
 */
const getDefaultTypeCategory = (item: Item): Pick<Action, 'typeCategory' | 'subcategory'> | null => {
    const itemType = item.type;
    const subcategory = 0;

    // Use a map for the item type lookup
    const typeMap: Record<string, TypeCategory> = {
        weapon: TYPE_CATEGORY.weapon,
        equipment: TYPE_CATEGORY.equipment,
        consumable: TYPE_CATEGORY.consumable,
    };
    
    // Get category from map, or fall back to 'other'
    const typeCategory = typeMap[itemType] ?? TYPE_CATEGORY.other;

    // Apply filtering for unequipped items (only for non-NPCs)
    if (item.actor?.type !== 'npc' && !foundry.utils.getProperty(item.system, 'equipped')) {
        if (!showUnequippedItems(item.actor)) {
            return null;
        }
    }
    
    return { typeCategory, subcategory };
};

/**
 * Simplifies the main type switch by calling helper functions for complex paths.
 */
const getTypeCategory = (item: Item): Pick<Action, 'typeCategory' | 'subcategory'> | null => {
  switch (item.type) {
    case 'feat':
      return { typeCategory: TYPE_CATEGORY.feature, subcategory: 0 };
    case 'spell':
      return getSpellTypeCategory(item);
    default:
      return getDefaultTypeCategory(item);
  }
};

// --- Filtering Helpers ---

const hasNoFavoritesOrIsInFavorites = (actor: dnd5e.documents.Actor5e, item: dnd5e.documents.Item5e): boolean => {
  if (!('favorites' in actor.system)) {
    return true;
  }
  if (!actor.system.favorites?.length) {
    return true;
  }

  for (const favorite of actor.system.favorites) {
    if (favorite.type === 'item') {
      if (favorite.id.endsWith(`.${item.id}`)) {
        return true;
      }
    }
  }
  return false;
};

// --- Action Construction Helpers ---

/**
 * Calculates item uses and applies the use count/max to the action name.
 * Also applies filtering for zero-use items.
 * @returns The formatted name string, or null if the item should be filtered out.
 */
const getActionNameWithUses = (item: dnd5e.documents.Item5e, baseName: string): string | null => {
    const uses = ItemSystem.calculateUsesForItem(item);

    if (!uses) {
        return baseName;
    }

    module.logger.debug('getActionNameWithUses() - uses', uses);

    // Filter out zero-use items if the setting is disabled
    if (uses.available === 0) {
        if (!ShowZeroUsesRemainActions.get()) {
            return null;
        }
        // Retain the item if ShowZeroUsesRemainActions is true
    }

    let name = baseName;
    if (uses.maximum) {
        name = `${name} (${uses.available} / ${uses.maximum})`;
    } else {
        name = `${name} (${uses.available})`;
    }
    module.logger.debug('getActionNameWithUses() - name', name);
    return name;
};


/**
 * Core function to attempt to build an Action object for a given Item.
 */
const getAction = (actor: dnd5e.documents.Actor5e, item: dnd5e.documents.Item5e): Action | null => {
  // 1. Filter by Favorites Setting
  if (ShowOnlyFavorites.get() && !hasNoFavoritesOrIsInFavorites(actor, item)) {
    return null;
  }
  module.logger.debug('getAction()', actor, item);
  
  // 2. Determine Categories
  const activationCategory = getActivationCategory(item);
  if (!activationCategory) {
    module.logger.debug('getAction() - no activation category');
    return null;
  }
  const typeCategoryData = getTypeCategory(item);
  if (!typeCategoryData) {
    module.logger.debug('getAction() - no type category');
    return null;
  }

  // 3. Determine Name and Filter by Uses
  const baseName = `${typeCategoryData.typeCategory?.prefix ?? ''}${item.name}`;
  const finalName = getActionNameWithUses(item, baseName);
  
  if (!finalName) {
      module.logger.debug('getAction() - filtered by zero uses');
      return null;
  }
  
  // 4. Construct the Action
  const roll = () => {
    void item.use();
  };
  
  const action: Action = {
    roll,
    actor,
    item,
    name: finalName,
    activationCategory,
    ...typeCategoryData,
    newTurnReset: null,
  };
  
  module.logger.debug('getAction() return', action);
  return action;
};

// --- Main Exported Function ---

export const getTokenActions = (actor: dnd5e.documents.Actor5e) => {
  if (!actor) {
    return null;
  }
  const actions: Action[] = [];
  for (const item of actor.items) {
    const action = getAction(actor, item);
    if (action) {
      actions.push(action);
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

  return actions;
};