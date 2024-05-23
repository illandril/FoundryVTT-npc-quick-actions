// This is a subset of data from the Tuckerthranx Actor
// from "Clash at the Kobold Cauldron"
// https://www.patreon.com/posts/clash-at-kobold-30366726

const items: dnd5e.documents.Item5e[] = [
  {
    use: jest.fn(),
    _id: 'dqSmCLipvv2H7hAQ',
    name: 'Minion Resistances',
    type: 'feat',
    system: {
      activation: {
        type: null,
        cost: 0,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      recharge: {
        value: null,
        charged: false,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'ujFnysl968hamQII',
    name: 'Seeming',
    type: 'spell',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 5,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'ig5Ghvsa8szOyf1U',
    name: 'Mage Hand',
    type: 'spell',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 0,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'cYY4mxgSeif0l560',
    name: 'Mending',
    type: 'spell',
    system: {
      activation: {
        type: 'minute',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 0,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'P7OIYIsdBRkSW6uI',
    name: 'Message',
    type: 'spell',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 0,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'fdLNlhp0mtusVd3N',
    name: 'Prestidigitation',
    type: 'spell',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 0,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: '56YCv7yP8NEYDlfd',
    name: 'Charm Person',
    type: 'spell',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 1,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'Uz2kznUGPNSUKTgT',
    name: 'Fog Cloud',
    type: 'spell',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 1,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'GeKz4pmyjzC6pzP5',
    name: 'Shield',
    type: 'spell',
    system: {
      activation: {
        type: 'reaction',
        cost: 1,
        condition: 'Which you take when you are hit by an attack or targeted by the magic missile spell',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 1,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'R5ATjaeCZifTi2mY',
    name: 'Darkness',
    type: 'spell',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 2,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'ni4gG3oIieaaZUbq',
    name: 'Detect Thoughts',
    type: 'spell',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 2,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'IaUq2QWRAQ1kifaR',
    name: 'Counterspell',
    type: 'spell',
    system: {
      activation: {
        type: 'reaction',
        cost: 1,
        condition: 'which you take when you see a creature within 60 feet of you casting a spell',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 3,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'KamSms9U0AFcr9SF',
    name: 'Dispel Magic',
    type: 'spell',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 3,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: '880TwUOhqqhRhdom',
    name: 'Dimension Door',
    type: 'spell',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      level: 4,
      preparation: {
        mode: 'prepared',
        prepared: true,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'gHcOOJhgvqthMv9g',
    name: 'Bite',
    type: 'weapon',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: '',
        amount: null,
        scale: false,
      },
      equipped: true,
      quantity: 1,
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'hbklCO31MxJgtcoB',
    name: 'Claws',
    type: 'weapon',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: '',
        amount: null,
        scale: false,
      },
      equipped: true,
      quantity: 1,
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'QeR4HvZwPqhQm33m',
    name: 'Tail',
    type: 'weapon',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: '',
        amount: null,
        scale: false,
      },
      equipped: true,
      quantity: 1,
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: '61N1A7iSLc1IBbzO',
    name: 'Fire Breath',
    type: 'feat',
    system: {
      activation: {
        type: 'action',
        cost: 1,
        condition: '',
      },
      consume: {
        type: '',
        target: '',
        amount: null,
        scale: false,
      },
      recharge: {
        value: 5,
        charged: true,
      },
      uses: {
        value: null,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: '1Q4W0o0hYygdNNBB',
    name: 'Frightful Presence',
    type: 'feat',
    system: {
      activation: {
        type: 'special',
        cost: null,
        condition: '',
      },
      consume: {
        type: '',
        target: '',
        amount: null,
        scale: false,
      },
      recharge: {
        value: null,
        charged: false,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'DcmBi4DMGMwBxrB7',
    name: 'Legendary Resistance',
    type: 'feat',
    system: {
      activation: {
        type: 'legendary',
        cost: null,
        condition: '',
      },
      consume: {
        type: 'attribute',
        target: 'resources.legres.value',
        amount: 1,
        scale: false,
      },
      recharge: {
        value: null,
        charged: false,
      },
      uses: {
        value: null,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'oqWPl8ufgHI1XdPS',
    name: 'Tail Attack',
    type: 'feat',
    system: {
      activation: {
        type: 'legendary',
        cost: 1,
        condition: '',
      },
      consume: {
        type: 'attribute',
        target: 'resources.legact.value',
        amount: 1,
        scale: false,
      },
      recharge: {
        value: null,
        charged: false,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'r3rrlwiTeWXOySX8',
    name: 'Wing Attack',
    type: 'feat',
    system: {
      activation: {
        type: 'legendary',
        cost: 2,
        condition: '',
      },
      consume: {
        type: 'attribute',
        target: 'resources.legact.value',
        amount: 2,
        scale: false,
      },
      recharge: {
        value: null,
        charged: false,
      },
      uses: {
        value: null,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'pON3d0ChwSTNKDw3',
    name: 'Detect',
    type: 'feat',
    system: {
      activation: {
        type: 'legendary',
        cost: 1,
        condition: '',
      },
      consume: {
        type: 'attribute',
        target: 'resources.legact.value',
        amount: 1,
        scale: false,
      },
      recharge: {
        value: null,
        charged: false,
      },
      uses: {
        value: null,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'e9sSyG5EAy6RWobD',
    name: 'Multiattack',
    type: 'feat',
    system: {
      activation: {
        type: null,
        cost: 0,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      recharge: {
        value: null,
        charged: false,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'enCDuQt9FQTId2oc',
    name: 'Legendary Actions',
    type: 'feat',
    system: {
      activation: {
        type: null,
        cost: 0,
        condition: '',
      },
      consume: {
        type: '',
        target: '',
        amount: null,
        scale: false,
      },
      recharge: {
        value: null,
        charged: false,
      },
      uses: {
        value: 3,
        max: 3,
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'MQ5wx9osMgne632y',
    name: 'Lair Actions',
    type: 'feat',
    system: {
      activation: {
        type: null,
        cost: 0,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      recharge: {
        value: null,
        charged: false,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
  {
    use: jest.fn(),
    _id: 'PFTJp0wse7tVklvS',
    name: 'Regional Effects',
    type: 'feat',
    system: {
      activation: {
        type: null,
        cost: 0,
        condition: '',
      },
      consume: {
        type: '',
        target: null,
        amount: null,
        scale: false,
      },
      recharge: {
        value: null,
        charged: false,
      },
      uses: {
        value: 0,
        max: '',
        per: null,
        recovery: '',
        prompt: true,
      },
    },
  } as Partial<dnd5e.documents.Item5e> as dnd5e.documents.Item5e,
];

const actor = {
  name: 'Tuckerthranx',
  type: 'npc',
  update: jest.fn(),
  items: {
    [Symbol.iterator]: () => items[Symbol.iterator](),
    get: (key) => items.find(({ id }) => id === key),
  } as dnd5e.documents.Actor5e['items'],
  system: {
    spells: {
      spell1: {
        value: 4,
        max: 4,
      },
      spell2: {
        value: 3,
        max: 3,
      },
      spell3: {
        value: 2,
        max: 3,
      },
      spell4: {
        value: 0,
        max: 3,
      },
      spell5: {
        value: 1,
        max: 1,
      },
      spell6: {
        value: 0,
        max: 0,
      },
      spell7: {
        value: 0,
        max: 0,
      },
      spell8: {
        value: 0,
        max: 0,
      },
      spell9: {
        value: 0,
        max: 0,
      },
      pact: {
        value: 0,
        max: 0,
      },
    },
    resources: {
      legact: {
        value: 1,
        max: 3,
      },
      legres: {
        value: 2,
        max: 2,
      },
      lair: {
        value: true,
        initiative: 20,
      },
    },
  },
} as Partial<dnd5e.documents.Actor5e> as dnd5e.documents.Actor5e;

for (const item of items) {
  (item as { actor: typeof item.actor }).actor = actor;
}

const tuckerthranx = {
  document: {
    isOwner: true,
  } as TokenDocument,
  actor,
  w: 420,
  worldTransform: {
    tx: 611.2219033713372,
    ty: 258.40388020061675,
  } as Token['worldTransform'],
} as Partial<Token> as Token;
export default tuckerthranx;
