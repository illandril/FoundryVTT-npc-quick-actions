import './styles.scss';
import * as ui from './ui';

let shownToken: Token | null = null;

Hooks.on('init', () => {
  const originalClear = TokenHUD.prototype.clear;
  TokenHUD.prototype.clear = function () {
    originalClear.call(this);
    shownToken = null;
    ui.hide();
  };
});

Hooks.on('updateToken', (token) => {
  if (shownToken && shownToken.document.id === token.id) {
    setTimeout(() => {
      ui.show(shownToken);
    }, 1);
  }
});

Hooks.on('updateItem', (item) => {
  if (shownToken && shownToken.actor === item.parent) {
    setTimeout(() => {
      ui.show(shownToken);
    }, 1);
  }
});

Hooks.on('updateActor', (actor) => {
  if (shownToken && shownToken.actor === actor) {
    setTimeout(() => {
      ui.show(shownToken);
    }, 1);
  }
});

Hooks.on('renderTokenHUD', (tokenHUD) => {
  const token = tokenHUD.object;
  if (ui.show(token)) {
    shownToken = token ?? null;
  }
});
