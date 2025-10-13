import * as ItemSystem from './item-system';
import module from './module';
import { ShowOnlyFavorites, ShowZeroUsesRemainActions, showUnequippedItems, showUnpreparedSpells } from './settings';

// --- Utility Functions ---

/**
 * Compares two strings case-insensitively for sorting.
 * @param a The first string.
 * @param b The second string.
 * @returns A number indicating sort order.
 */
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
  legendaryResistance: { sort: 5, name: 'illandril-npc-quick-actions.activation_legendaryResistance' },
  lair: { sort: 6, name: 'illandril-npc-quick-actions.activation_lair' },
  special: { sort: 7, name: 'illandril-npc-quick-actions.activation_special' },
  crew: { sort: 8, name: 'illandril-npc-quick-actions.activation_crew' },
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

/**
 * Maps Foundry's item 'type' strings to the internal TypeCategory objects.
 */
const ITEM_TYPE_MAPPING: Record<string, TypeCategory> = {
    weapon: TYPE_CATEGORY.weapon,
    equipment: TYPE_CATEGORY.equipment,
    consumable: TYPE_CATEGORY.consumable,
    // Note: 'feat' and 'spell' are handled directly in getTypeCategory
};

// --- Category Logic Helpers ---

/**
 * Maps a Foundry D&D 5e activation type string (e.g., 'action', 'bonus') to a categorized object.
 * @param activationType The string type from an Item's activity activation.
 * @returns The matching ActivationCategory object, or null if the type is not a quick action.
 */
const getActivationCategoryFromType = (activationType: string | undefined): ActivationCategory | null => {
    if (!activationType) { return null; }
    // Look up directly, checking if the key exists on the ACTIVATION_CATEGORY object
    // This is safer than an explicit map that duplicates the object's contents
    const key = activationType.toLowerCase(); 
    return ACTIVATION_CATEGORY[key as keyof typeof ACTIVATION_CATEGORY] ?? null;
};

const getActivationCategoryFromActivity = (activity: any): ActivationCategory | null => {
  if (activity?.consumption?.targets?.some((target: any) => target?.target === 'resources.legres.value')) {
    return ACTIVATION_CATEGORY.legendaryResistance;
  }
  return getActivationCategoryFromType(activity?.activation?.type);
};

// --- Spell Type Helpers (Retained from previous cleanup) ---

/**
 * Checks if a prepared spell should be filtered out based on actor type and settings.
 */
const shouldFilterUnpreparedSpell = (item: dnd5e.documents.Item5e, spellData: dnd5e.documents.ItemSystemData.Spell): boolean => {
    return (
        item.actor?.type !== 'npc' && 
        !spellData.prepared && 
        !showUnpreparedSpells(item.actor)
    );
};

/**
 * Calculates the subcategory and prefix for level-based spells (prepared/always).
 */
const getSpellLevelCategory = (spellData: dnd5e.documents.ItemSystemData.Spell): Pick<Action, 'subcategory' | 'typeCategory'> => {
    const subcategory = spellData.level ?? 0;
    let prefix = (subcategory === 0) ? module.localize('spell-abbr.cantrip') : `${spellData.level}`;

    return {
        subcategory,
        typeCategory: {
            ...TYPE_CATEGORY.spell,
            prefix: `[${prefix}] `,
        },
    };
};

/**
 * Calculates the subcategory and prefix for non-level-based spell methods (pact, innate, atwill, unknown).
 */
const getSpellMethodCategory = (method: string): Pick<Action, 'subcategory' | 'typeCategory'> => {
    const methodMap: Record<string, { subcategory: number, prefixKey: string }> = {
        'pact': { subcategory: 0.5, prefixKey: 'spell-abbr.pact' },
        'ritual': { subcategory: 0.6, prefixKey: 'spell-abbr.ritual' },
        'innate': { subcategory: -10, prefixKey: 'spell-abbr.innate' },
        'atwill': { subcategory: -20, prefixKey: 'spell-abbr.atwill' },
    };

    const data = methodMap[method];
    const subcategory = data?.subcategory ?? -30;
    const prefixKey = data?.prefixKey ?? 'spell-abbr.unknown';
    const prefix = module.localize(prefixKey);

    return {
        subcategory,
        typeCategory: {
            ...TYPE_CATEGORY.spell,
            prefix: `[${prefix}] `,
        },
    };
};

/**
 * Determines the specific TypeCategory and subcategory for spell items.
 * @param item The Item5e document (assumed to be a spell).
 * @returns Category and subcategory data, or null if the spell is filtered out.
 */
const getSpellTypeCategory = (item: dnd5e.documents.Item5e): Pick<Action, 'typeCategory' | 'subcategory'> | null => {
    const spellData = item.system as dnd5e.documents.ItemSystemData.Spell;
    const method = spellData.method ?? '';

    // --- Phase 1: Determine if this is a LEVEL-BASED spell ---
    if (method === 'spell') {
        if (shouldFilterUnpreparedSpell(item, spellData)) { return null; }
        return getSpellLevelCategory(spellData);
    }
    
    // --- Phase 2: Handle special METHODS (Pact, Ritual Only, Innate, At Will) ---
    return getSpellMethodCategory(method);
};


/**
 * Determines the TypeCategory and subcategory for non-feat, non-spell items.
 * Applies filtering for unequipped items based on settings.
 *
 * (Refactored to use the consolidated ITEM_TYPE_MAPPING.)
 * * @param item The Item5e document.
 * @returns Category and subcategory data, or null if the item is filtered out.
 */
const getDefaultTypeCategory = (item: dnd5e.documents.Item5e): Pick<Action, 'typeCategory' | 'subcategory'> | null => {
    const itemType = item.type;
    const subcategory = 0;
    
    // Use the consolidated mapping, falling back to 'other'
    const typeCategory = ITEM_TYPE_MAPPING[itemType] ?? TYPE_CATEGORY.other;

    // Apply filtering for unequipped items (only for non-NPCs)
    if (item.actor?.type !== 'npc' && !foundry.utils.getProperty(item.system, 'equipped')) {
        if (!showUnequippedItems(item.actor)) { return null; }
    }
    
    return { typeCategory, subcategory };
};

/**
 * Determines the TypeCategory and subcategory for any given Item.
 * Acts as a router to specific type category helpers.
 * @param item The Item5e document.
 * @returns Category and subcategory data, or null if the item is filtered out.
 */
const getTypeCategory = (item: dnd5e.documents.Item5e): Pick<Action, 'typeCategory' | 'subcategory'> | null => {
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

/**
 * Checks if the item should be displayed based on the actor's favorites and the module's settings.
 * @param actor The parent actor.
 * @param item The item to check.
 * @returns True if the item is a favorite or if the actor has no favorites, false otherwise.
 */
const hasNoFavoritesOrIsInFavorites = (actor: dnd5e.documents.Actor5e, item: dnd5e.documents.Item5e): boolean => {
  // Check 1: If the actor system doesn't support favorites, always include.
  if (!('favorites' in actor.system)) return true;

  // Check 2: If there are no favorites defined, always include.
  const favorites = actor.system.favorites;
  if (!favorites?.length) return true;

  // Check 3: Does ANY favorite entry match this item ID?
  return favorites.some(favorite => favorite.type === 'item' && favorite.id.endsWith(`.${item.id}`));
};

// --- Action Construction Helpers ---

/**
 * Calculates item uses and formats the action name to include available/maximum counts.
 * Also applies filtering for items with zero uses remaining based on settings.
 * @param item The item being processed.
 * @param baseName The base name of the item.
 * @returns The formatted name string, or null if the item should be filtered out due to zero uses.
 */
const getActionNameWithUses = (item: dnd5e.documents.Item5e, baseName: string): string | null => {
    const uses = ItemSystem.calculateUsesForItem(item);

    if (!uses) { 
        module.logger.debug(`getActionNameWithUses() - no uses on item:`, item);
        return baseName;
    }
    module.logger.debug('getActionNameWithUses() - uses', uses);

    // Filter out zero-use items if the setting is disabled
    if (uses.available === 0) {
        if (!ShowZeroUsesRemainActions.get()) { 
            module.logger.debug(`getActionNameWithUses() - filtered by zero uses for item:`, item);
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
 * Creates a single Action object for an item with multiple Activities
 * @param actor The parent actor document.
 * @param item The Item5e document.
 * @returns An array containing a single Action object, or an empty array if the item/activity is filtered.
 */
const getActionsForItem = (actor: dnd5e.documents.Actor5e, item: dnd5e.documents.Item5e): Action[] => {
  // 1. Filter by Favorites Setting
  if (ShowOnlyFavorites.get() && !hasNoFavoritesOrIsInFavorites(actor, item)) {
    module.logger.debug(`getActionsForItem(actor, ${item.name}) - filtered by favorites when setting is enabled`);
    return [];
  }
  module.logger.debug('getActionsForItem()', actor, item);
  
  // 2. Determine base Item Type Categories
  const typeCategoryData = getTypeCategory(item);
  if (!typeCategoryData) {
      module.logger.debug(`getActionsForItem() - no item type category for item:`, item);
      return [];
  }

  // 3. Determine Name and Filter by Uses
  const prefix = typeCategoryData.typeCategory.prefix ?? '';
  const baseName = `${prefix}${item.name}`;
  const finalName = getActionNameWithUses(item, baseName);
  
  if (!finalName) {
      module.logger.debug(`getActionsForItem() - filtered by zero uses for item:`, item);
      return [];
  }
  
  // 4. Find any viable activity (prioritizing the one with the highest sort order)
  let itemActivationCategory: ActivationCategory | null = null;
  let itemActivityId: string | null = null;

  const activities =
    item.system.activities instanceof foundry.utils.Collection ? item.system.activities.entries() : [];

  let highestPrioActivity: { category: ActivationCategory; id: string } | null = null;

  for (const [activityId, activity] of activities) {
    const currentCategory = getActivationCategoryFromActivity(activity);

    if (currentCategory) {
      if (!highestPrioActivity || currentCategory.sort > highestPrioActivity.category.sort) {
        highestPrioActivity = { category: currentCategory, id: activityId };
      }
    }
  }

  if (highestPrioActivity) {
    itemActivationCategory = highestPrioActivity.category;
    itemActivityId = highestPrioActivity.id;
  }

  // 5. If no viable activity was found, return nothing
  if (!itemActivityId || !itemActivationCategory) {
    module.logger.debug(`getActionsForItem() - item had no viable activities after filtering for item ${item.name}.`);
    return [];
  }
  
  // 6. Construct the single Action
  const roll = () => { void item.use(); };
  const action: Action = {
      roll,
      actor,
      item,
      activityId: itemActivityId, // Store the chosen activity ID
      name: finalName,
      activationCategory: itemActivationCategory, // Store the chosen category
      ...typeCategoryData,
      newTurnReset: null,
  };

  module.logger.debug('getActionsForItem() added SINGLE action for item, using activity:', itemActivityId, action);
  return [action]; // Return an array with only one action
};

// --- Main Exported Function ---

/**
 * Generates a sorted list of executable actions for a given actor's token quick-action menu.
 * * This function iterates through all of the actor's items, applies various module-specific
 * filtering logic (e.g., favorites, unequipped, zero uses), and attempts to convert each 
 * item into a single executable Action object based on its activities.
 *
 * @param {dnd5e.documents.Actor5e} actor The actor document for which to generate actions.
 * @returns {Action[] | null} A sorted array of Action objects, or null if no actor is provided.
 * * **Resulting List Structure and Sort Order:**
 * 1.  **Activation Category:** Primary sort by category priority (lowest 'sort' value first):
 * Action (1) > Bonus Action (2) > Reaction (3) > Legendary (4) > ...
 * 2.  **Item Type Category:** Secondary sort by type (lowest 'sort' value first):
 * Weapon (1) > Equipment (2) > Consumable (3) > Other (4) > Feature (5) > Spell (6)
 * 3.  **Subcategory:** Tertiary sort, primarily used for sorting Spells (e.g., Cantrip, Level 1, Level 2).
 * 4.  **Item Name:** Final sort alphabetically (case-insensitive) by the calculated action name.
 */
export const getTokenActions = (actor: dnd5e.documents.Actor5e) => {
  if (!actor) { return null;}
  const actions: Action[] = [];
  
  for (const item of actor.items) {
    const itemActions = getActionsForItem(actor, item);
    actions.push(...itemActions);
  }
  
  actions.sort((a, b) => {
    const activationCategoryDelta = a.activationCategory.sort - b.activationCategory.sort;
    if (activationCategoryDelta !== 0) { return activationCategoryDelta; }
    const typeCategoryDelta = a.typeCategory.sort - b.typeCategory.sort;
    if (typeCategoryDelta !== 0) { return typeCategoryDelta; }
    const subcategoryDelta = a.subcategory - b.subcategory;
    if (subcategoryDelta !== 0) { return subcategoryDelta; }
    return caseInsensitiveCompare(a.name, b.name);
  });

  return actions;
};