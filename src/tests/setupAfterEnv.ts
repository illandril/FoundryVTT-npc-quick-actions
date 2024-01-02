import '@testing-library/dom';
import { unflatten } from 'flat';
import jquery from 'jquery';
import en from '../lang/en.json';

window.jQuery = jquery;

class MockTokenHUD {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async clear() {}
}

(globalThis as unknown as {
  TokenHUD: typeof MockTokenHUD
}).TokenHUD = MockTokenHUD;

(game.user as {
  hasRole: User['hasRole']
}).hasRole = jest.fn(() => true);

(game as {
  system: Game['system']
}).system = {
  id: 'dnd5e',
} as System;

const translations = unflatten(en);
jest.spyOn(game.i18n, 'localize').mockImplementation((key) => {
  return foundry.utils.getProperty(translations, key) as string || `mock-localize[${key}]`;
});
