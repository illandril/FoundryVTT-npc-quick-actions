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

Hooks.on('updateToken', (scene, tokenData) => {
  if (shownToken && shownToken.id === tokenData._id) {
    setTimeout(() => {
      UI.show(shownToken);
    }, 1);
  }
});

Hooks.on('updateOwnedItem', (actor) => {
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
