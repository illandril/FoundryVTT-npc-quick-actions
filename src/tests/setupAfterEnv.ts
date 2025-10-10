import '@testing-library/dom';
import { unflatten } from 'flat';
import jquery from 'jquery';
import en from '../lang/en.json';

window.jQuery = jquery;

class MockTokenHUD {
  async clear() {
    // Do nothing - satisfies
  }
}

(globalThis as any).foundry = {
  ...((globalThis as any).foundry || {}),
  applications: {
    ...((globalThis as any).foundry?.applications || {}),
    hud: {
      ...((globalThis as any).foundry?.applications?.hud || {}),
      TokenHUD: MockTokenHUD,
    },
  },
};

(
  game.user as {
    hasRole: User['hasRole'];
  }
).hasRole = jest.fn(() => true);

(
  game as {
    system: Game['system'];
  }
).system = {
  id: 'dnd5e',
} as System;

const translations = unflatten(en);
jest.spyOn(game.i18n, 'localize').mockImplementation((key) => {
  return (foundry.utils.getProperty(translations, key) as string) || `mock-localize[${key}]`;
});
