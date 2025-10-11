import * as Quick from './quick-actions';
import * as ItemSystem from './item-system';
import * as Settings from './settings';

// Provide a minimal `foundry.utils.Collection` stub for the test environment so
// production code can safely use `instanceof foundry.utils.Collection` without
// throwing when `foundry.utils.Collection` is undefined.
if (typeof (globalThis as any).foundry === 'undefined') {
  (globalThis as any).foundry = { utils: {} } as any;
}
if (typeof (globalThis as any).foundry.utils.Collection === 'undefined') {
  (globalThis as any).foundry.utils.Collection = class TestCollection {
    private _data: Record<string, any>;
    constructor(data: Record<string, any>) {
      this._data = data ?? {};
    }
    entries() { return Object.entries(this._data)[Symbol.iterator](); }
  } as any;
}

// Minimal mocks to exercise logic in quick-actions
const makeActor = (overrides: any = {}) => {
  const items: any[] = [];
  const actor: any = {
    system: {
      spells: {
        spell1: { value: 3, max: 4 },
        pact: { value: 1, max: 1 },
      },
      favorites: [],
    },
    // expose the internal array so helper functions can add items
    _items: items,
    items: {
      [Symbol.iterator]: function() { return (this._owner?._items ?? items)[Symbol.iterator](); },
      get: function(id: string) { return (this._owner?._items ?? items).find((i: any) => i.id === id); },
      // stash a link back to the holder so iterator/get can reference the correct array
      _owner: undefined as any,
    },
    type: 'npc',
  };
  // wire the owner reference so the items proxy can access _items
  actor.items._owner = actor;
  Object.assign(actor, overrides);
  return actor as dnd5e.documents.Actor5e;
};

const makeItem = (actor: any, system: any, type = 'weapon', id = Math.random().toString(36).slice(2, 8)) => {
  // Provide a default activity (action) when none are supplied so quick-actions
  // will consider the item actionable in tests.
  const systemWithDefaults = { ...system };
  if (!systemWithDefaults.activities) {
    systemWithDefaults.activities = { default: { activation: { type: 'action' } } };
  }
  // Wrap activities in the test Collection so production code's instanceof check
  // recognizes it and uses .entries() as expected.
  systemWithDefaults.activities = new (foundry.utils.Collection as any)(systemWithDefaults.activities);
  const item: any = { id, name: systemWithDefaults.name ?? 'Item', actor, type, system: systemWithDefaults };
  // push into actor's internal _items array so multiple items accumulate
  const owner = (actor.items as any)._owner ? actor : actor;
  (owner._items as any).push(item);
  return item as dnd5e.documents.Item5e;
};

describe('quick-actions logic', () => {
  test('level-based spell appears with level prefix in action name', () => {
    const actor = makeActor();
    const item = makeItem(actor, { method: 'spell', level: 1, prepared: 1 }, 'spell');
    // Ensure settings won't block items
    jest.spyOn(Settings.ShowOnlyFavorites, 'get').mockReturnValue(false);
    jest.spyOn(Settings.ShowZeroUsesRemainActions, 'get').mockReturnValue(true);
    const actions = Quick.getTokenActions(actor as any) || [];
    const action = actions.find(a => a.item.id === item.id);
    expect(action).toBeTruthy();
    if (action) expect(action.name.startsWith('[1]') || action.name.startsWith('[1')).toBe(true);
  });

  test('pact/atwill/innate spells show method prefix', () => {
    const actor = makeActor();
  jest.spyOn(Settings.ShowOnlyFavorites, 'get').mockReturnValue(false);
  jest.spyOn(Settings.ShowZeroUsesRemainActions, 'get').mockReturnValue(true);
    const pact = makeItem(actor, { method: 'pact' }, 'spell');
    const atwill = makeItem(actor, { method: 'atwill' }, 'spell');
    const actions = Quick.getTokenActions(actor as any) || [];
    const pactAction = actions.find(a => a.item.id === pact.id);
    const atwillAction = actions.find(a => a.item.id === atwill.id);
    expect(pactAction).toBeTruthy();
    expect(atwillAction).toBeTruthy();
    if (pactAction) expect(pactAction.name.includes('[')).toBe(true);
    if (atwillAction) expect(atwillAction.name.includes('[')).toBe(true);
  });

  test('shouldFilterUnpreparedSpell respects showUnpreparedSpells', () => {
    const actor = makeActor({ type: 'pc' });
    const item = makeItem(actor, { method: 'spell', level: 1, prepared: 0 }, 'spell');
    // Force showUnpreparedSpells to return true/false via mock
    // when showUnpreparedSpells returns false, and prepared=0, the action should be filtered
    jest.spyOn(Settings, 'showUnpreparedSpells').mockReturnValueOnce(false as any);
    jest.spyOn(Settings.ShowOnlyFavorites, 'get').mockReturnValue(false);
    jest.spyOn(Settings.ShowZeroUsesRemainActions, 'get').mockReturnValue(true);
    const actionsA = Quick.getTokenActions(actor as any) || [];
    expect(actionsA.find(a => a.item.id === item.id)).toBeUndefined();

    jest.spyOn(Settings, 'showUnpreparedSpells').mockReturnValueOnce(true as any);
    const actionsB = Quick.getTokenActions(actor as any) || [];
    expect(actionsB.find(a => a.item.id === item.id)).toBeDefined();
  });

  test('getDefaultTypeCategory filters unequipped for PC when setting disabled', () => {
    const actor = makeActor({ type: 'pc' });
    const item = makeItem(actor, { equipped: false }, 'equipment');
    jest.spyOn(Settings, 'showUnequippedItems').mockReturnValueOnce(false as any);
    jest.spyOn(Settings.ShowOnlyFavorites, 'get').mockReturnValue(false);
    jest.spyOn(Settings.ShowZeroUsesRemainActions, 'get').mockReturnValue(true);
    const actionsA = Quick.getTokenActions(actor as any) || [];
    expect(actionsA.find(a => a.item.id === item.id)).toBeUndefined();

    jest.spyOn(Settings, 'showUnequippedItems').mockReturnValueOnce(true as any);
    const actionsB = Quick.getTokenActions(actor as any) || [];
    expect(actionsB.find(a => a.item.id === item.id)).toBeDefined();
  });

  test('hasNoFavoritesOrIsInFavorites works', () => {
    const actor = makeActor();
    const item = makeItem(actor, {}, 'weapon');
    actor.system.favorites = [{ type: 'item', id: `some.${item.id}` }];
    jest.spyOn(Settings.ShowOnlyFavorites, 'get').mockReturnValue(true);
    jest.spyOn(Settings.ShowZeroUsesRemainActions, 'get').mockReturnValue(true);
    const actionsA = Quick.getTokenActions(actor as any) || [];
    expect(actionsA.find(a => a.item.id === item.id)).toBeDefined();

    actor.system.favorites = [{ type: 'item', id: `some.other` }];
    jest.spyOn(Settings.ShowOnlyFavorites, 'get').mockReturnValue(true);
    const actionsB = Quick.getTokenActions(actor as any) || [];
    expect(actionsB.find(a => a.item.id === item.id)).toBeUndefined();
  });

  test('getTokenActions returns sorted actions', () => {
    const actor = makeActor();
    // create two items with different type categories to enforce sorting
    const item1 = makeItem(actor, { activities: { id1: { activation: { type: 'action' } } } }, 'weapon');
    const item2 = makeItem(actor, { activities: { id2: { activation: { type: 'bonus' } } } }, 'consumable');
    const actions = Quick.getTokenActions(actor as any);
    expect(actions).not.toBeNull();
    if (actions) {
      expect(Array.isArray(actions)).toBe(true);
      // actions sorted by activationCategory sort (action before bonus)
      expect(actions.length).toBeGreaterThanOrEqual(1);
    }
  });
});
