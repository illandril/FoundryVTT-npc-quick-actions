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
  item: dnd5e.documents.Item5e;
  activityId: string; // Identifier for the specific activity being used (the prioritized one)
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
 * Uses a map lookup to convert the activation type string (from an activity) to an ActivationCategory object.
 */
const getActivationCategoryFromType = (activationType: string | undefined): ActivationCategory | null => {
    if (!activationType) {
        return null;
    }
    const activationMap: Record<string, ActivationCategory> = {
        action: ACTIVATION_CATEGORY.action,
        bonus: ACTIVATION_CATEGORY.bonus,
        reaction: ACTIVATION_CATEGORY.reaction,
        legendary: ACTIVATION_CATEGORY.legendary,
        lair: ACTIVATION_CATEGORY.lair,
        crew: ACTIVATION_CATEGORY.crew,
        special: ACTIVATION_CATEGORY.special,
    };
    return activationMap[activationType] ?? null;
};

// Kept for consistency, though not strictly used in the new item-to-action logic
const getActivationCategory = (item: Item): ActivationCategory | null => {
  const activationType = foundry.utils.getProperty(item.system, 'activation.type');
  return getActivationCategoryFromType(activationType);
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
 */
const getDefaultTypeCategory = (item: Item): Pick<Action, 'typeCategory' | 'subcategory'> | null => {
    const itemType = item.type;
    const subcategory = 0;

    const typeMap: Record<string, TypeCategory> = {
        weapon: TYPE_CATEGORY.weapon,
        equipment: TYPE_CATEGORY.equipment,
        consumable: TYPE_CATEGORY.consumable,
    };
    
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
 * Creates a single action for the item, choosing the highest priority (lowest sort) viable activity.
 */
const getActionsForItem = (actor: dnd5e.documents.Actor5e, item: dnd5e.documents.Item5e): Action[] => {
  // 1. Filter by Favorites Setting
  if (ShowOnlyFavorites.get() && !hasNoFavoritesOrIsInFavorites(actor, item)) {
    return [];
  }
  module.logger.debug('getActionsForItem()', actor, item);
  
  // 2. Determine base Item Type Categories
  const typeCategoryData = getTypeCategory(item);
  if (!typeCategoryData) {
      module.logger.debug('getActionsForItem() - no item type category');
      return [];
  }

  // 3. Determine Name and Filter by Uses
  const baseName = `${typeCategoryData.typeCategory?.prefix ?? ''}${item.name}`;
  const finalName = getActionNameWithUses(item, baseName);
  
  if (!finalName) {
      module.logger.debug('getActionsForItem() - filtered by zero uses');
      return [];
  }
  
  // 4. Find the highest priority viable activity
  let bestActivationCategory: ActivationCategory | null = null;
  let bestActivityId: string | null = null;
  
  const activities = item.system.activities instanceof foundry.utils.Collection 
        ? item.system.activities.entries()
        : [];
        
  for (const [activityId, activity] of activities) {
      const activationType = activity.activation?.type;
      const currentCategory = getActivationCategoryFromType(activationType);

      if (!currentCategory) {
          continue; // Skip non-action activities
      }

      // Prioritize the category with the lower sort number
      if (!bestActivationCategory || currentCategory.sort < bestActivationCategory.sort) {
          bestActivationCategory = currentCategory;
          bestActivityId = activityId;
      }
  }

  // 5. If no viable activity was found, return nothing
  if (!bestActivityId || !bestActivationCategory) {
      console.error('getActionsForItem() - item had no viable activities after filtering.');
      return [];
  }
  
  // 6. Construct the single Action
  const roll = () => {
      // Roll using the highest priority activity found
      void item.use(bestActivityId!); 
  };

  const action: Action = {
      roll,
      actor,
      item,
      activityId: bestActivityId, // Store the chosen activity ID
      name: finalName,
      activationCategory: bestActivationCategory, // Store the chosen category
      ...typeCategoryData,
      newTurnReset: null,
  };

  module.logger.debug('getActionsForItem() added SINGLE action for item, using activity:', bestActivityId, action);

  return [action]; // Return an array with only one action
};

// --- Main Exported Function ---

export const getTokenActions = (actor: dnd5e.documents.Actor5e) => {
  if (!actor) {
    return null;
  }
  const actions: Action[] = [];
  
  for (const item of actor.items) {
    const itemActions = getActionsForItem(actor, item);
    actions.push(...itemActions);
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