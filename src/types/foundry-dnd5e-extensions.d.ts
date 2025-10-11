// Minimal augmentations for Foundry dnd5e types used in this project.
// Keep this file small and focused to avoid mismatching the full dnd5e typings.

declare global {
  namespace dnd5e {
    namespace documents {
      interface SpellPool {
        value?: number;
        max?: number;
      }

      // Augment Actor system spells to include numbered spell pools and pact
      interface ActorSystemSpells {
        pact?: SpellPool;
        spell1?: SpellPool;
        spell2?: SpellPool;
        spell3?: SpellPool;
        spell4?: SpellPool;
        spell5?: SpellPool;
        spell6?: SpellPool;
        spell7?: SpellPool;
        spell8?: SpellPool;
        spell9?: SpellPool;
        // allow other dynamic entries
        [key: string]: any;
      }

      // Minimal Actor system character shape used in this repo
      interface ActorSystemData {
        // Character-specific system data (many properties exist in full typings)
        spells?: ActorSystemSpells;
        resources?: Record<string, any>;
        favorites?: Array<{ type: string; id: string }>;
        // keep other fields open
        [key: string]: any;
      }

      // Minimal Item and Activity augmentations used in code
      interface ItemSystemActivities {
        // Foundry uses a Collection-like structure for activities; entries() returns [id, activity]
        entries?: () => IterableIterator<[string, any]>;
        [key: string]: any;
      }

      // An interface for the item.system root object so code can reference dnd5e.documents.ItemSystemData
      interface ItemSystemData {
        activities?: ItemSystemActivities | any;
        // other system shapes are represented in the nested namespace below
        [key: string]: any;
      }

      // Provide a namespace for more specific item system shapes (accessed as dnd5e.documents.ItemSystemData.Spell etc.)
      namespace ItemSystemData {
        interface Spell {
          method?: '' | 'spell' | 'pact' | 'atwill' | 'innate' | 'ritual';
          level?: number;
          // prepared: 0 = unprepared, 1 = prepared, 2 = always
          prepared?: 0 | 1 | 2 | undefined;
          // keep other fields open
          [key: string]: any;
        }

        interface Consumable {
          uses?: { value?: number; max?: number | string };
          quantity?: number;
          [key: string]: any;
        }

        interface Feat {
          recharge?: { value?: boolean; charged?: boolean };
          [key: string]: any;
        }

        interface PhysicalItem {
          quantity?: number;
          [key: string]: any;
        }

        interface Weapon {
          properties?: Record<string, unknown>;
          quantity?: number;
          [key: string]: any;
        }

        interface ActivatedEffect {
          consume?: {
            type?: 'attribute' | 'ammo' | 'material' | 'charges';
            target?: string;
            amount?: number;
          } | null;
          [key: string]: any;
        }
      }

      interface Item5e {
        id?: string;
        name?: string;
        type: string;
        actor: Actor5e | null;
        system: ItemSystemData | any;
        use?: (options?: any) => Promise<void>;
        items?: any;
        [key: string]: any;
      }

      interface Actor5e extends Actor {
        system: ActorSystemData;
        items: any;
        type: string;
        [key: string]: any;
      }
    }
  }
}

export {};
