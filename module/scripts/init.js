import Settings from './settings.js';
import * as UI from './ui.js';

let shownToken = null;

Hooks.on('init', () => {
  TokenHUD.prototype.clear = function () {
    BasePlaceableHUD.prototype.clear.call(this);
    shownToken = null;
    UI.hide();
  };
});

Hooks.on('updateToken', (token) => {
  if (shownToken && shownToken.id === token.id) {
    setTimeout(() => {
      UI.show(shownToken);
    }, 1);
  }
});

Hooks.on('updatItem', (item) => {
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
  if (token.owner && game.user.hasRole(Settings.MinimumRole.get())) {
    UI.show(token);
    shownToken = token;
  }
});
