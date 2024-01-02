
import * as UI from './ui';

let shownToken: Token | null = null;

Hooks.on('init', () => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originalClear = TokenHUD.prototype.clear;
  TokenHUD.prototype.clear = function() {
    originalClear.call(this);
    shownToken = null;
    UI.hide();
  };
});

Hooks.on('updateToken', (token) => {
  if (shownToken && shownToken.document.id === token.id) {
    setTimeout(() => {
      UI.show(shownToken);
    }, 1);
  }
});

Hooks.on('updateItem', (item) => {
  if (shownToken && shownToken.actor === item.parent) {
    setTimeout(() => {
      UI.show(shownToken);
    }, 1);
  }
});

Hooks.on('updateActor', (actor) => {
  if (shownToken && shownToken.actor === actor) {
    setTimeout(() => {
      UI.show(shownToken);
    }, 1);
  }
});

Hooks.on('renderTokenHUD', (tokenHUD) => {
  const token = tokenHUD.object;
  if (UI.show(token)) {
    shownToken = token ?? null;
  }
});
