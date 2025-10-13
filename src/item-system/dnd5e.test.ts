import { calculateUsesForItem } from './dnd5e';

// Minimal helpers to construct mock actor/items consistent with usage in dnd5e.ts
const makeActor = (overrides: any = {}) => {
  const defaultActor: any = {
    system: {
      spells: {
        spell1: { value: 4, max: 4 },
        pact: { value: 1, max: 1 },
      },
      resources: {},
      favorites: [],
    },
    items: {
      get: (id: string) => undefined,
      [Symbol.iterator]: function* () {},
    },
    type: 'npc',
  };
  return Object.assign(defaultActor, overrides);
};

const makeItem = (actor: any, system: any, type = 'consumable', id = 'item1') => {
  return ({ id, name: 'Test', actor, type, system } as unknown) as dnd5e.documents.Item5e;
};

describe('dnd5e.calculateUsesForItem', () => {
  test('limited uses (uses.value/max)', () => {
    const actor = makeActor();
    const item = makeItem(actor, { uses: { value: 2, max: 3 } }, 'consumable');
    const res = calculateUsesForItem(item);
    expect(res).toEqual({ available: 2, maximum: 3 });
  });

  test('limited uses with string max and quantity', () => {
    const actor = makeActor();
    const item = makeItem(actor, { uses: { value: 1, max: '2' }, quantity: 3 }, 'consumable');
    const res = calculateUsesForItem(item);
    // available = 1 + (3-1)*2 = 5, maximum = 2*3 = 6
    expect(res).toEqual({ available: 5, maximum: 6 });
  });

  test('physical consumable quantity', () => {
    const actor = makeActor();
    const item = makeItem(actor, { quantity: 5 }, 'consumable');
    const res = calculateUsesForItem(item);
    expect(res).toEqual({ available: 5 });
  });

  test('feat with recharge', () => {
    const actor = makeActor();
    const item = makeItem(actor, { recharge: { value: true, charged: false } }, 'feat');
    const res = calculateUsesForItem(item);
    expect(res).toEqual({ available: 0, maximum: 1 });
  });

  test('spell pact uses from actor pact pool', () => {
    const actor = makeActor();
    actor.system.spells.pact = { value: 2, max: 2 };
    const item = makeItem(actor, { method: 'pact' }, 'spell');
    const res = calculateUsesForItem(item);
    expect(res).toEqual({ available: 2, maximum: 2 });
  });

  test('spell atwill/innate returns null', () => {
    const actor = makeActor();
    let item = makeItem(actor, { method: 'atwill' }, 'spell');
    expect(calculateUsesForItem(item)).toBeNull();
    item = makeItem(actor, { method: 'innate' }, 'spell');
    expect(calculateUsesForItem(item)).toBeNull();
  });

  test('spell level-based uses from actor spell pool', () => {
    const actor = makeActor();
    actor.system.spells.spell1 = { value: 3, max: 4 };
    const item = makeItem(actor, { method: 'spell', level: 1 }, 'spell');
    const res = calculateUsesForItem(item);
    expect(res).toEqual({ available: 3, maximum: 4 });
  });

  test('weapon thrown shows quantity when thr and not ret', () => {
    const actor = makeActor();
    const item = makeItem(actor, { properties: { thr: true, ret: false }, quantity: 7 }, 'weapon');
    const res = calculateUsesForItem(item);
    expect(res).toEqual({ available: 7, maximum: null });
  });

  test('consume attribute uses actor property via foundry.utils.getProperty', () => {
    const actor = makeActor();
    actor.system.resources.legact = { value: 9 };
    const item = makeItem(actor, { consume: { type: 'attribute', target: 'resources.legact.value' } } as any, 'consumable');
    const res = calculateUsesForItem(item);
  expect(res).toEqual({ available: 9, maximum: null });
  });

  test('consume ammo uses quantity of referenced item', () => {
    const target = { system: { quantity: 12 } } as any;
    const actor = makeActor({ items: { get: (id: string) => target } });
    const item = makeItem(actor, { consume: { type: 'ammo', target: 'ammoId' } } as any, 'consumable');
    const res = calculateUsesForItem(item);
  expect(res).toEqual({ available: 12, maximum: null });
  });

  test('consume charges uses calculateLimitedUses on target item and divides by amount', () => {
    const target = { system: { uses: { value: 8, max: 8 } } } as any;
    const actor = makeActor({ items: { get: (id: string) => target } });
    const item = makeItem(actor, { consume: { type: 'charges', target: 'chargesId', amount: 2 } } as any, 'consumable');
    const res = calculateUsesForItem(item);
    // calculateLimitedUses returns {available:8, maximum:8} then dividing amount 2 -> available 4, maximum 4
    expect(res).toEqual({ available: 4, maximum: 4 });
  });
});
