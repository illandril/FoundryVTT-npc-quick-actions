import * as UI from './ui.js';

let shownToken = null;

Hooks.on('init', () => {
  TokenHUD.prototype.clear = function() {
    BasePlaceableHUD.prototype.clear.call(this);
    shownToken = null;
    UI.hide();
  };
});

Hooks.on('updateToken', (scene, tokenData) => {
  if(shownToken && shownToken.id === tokenData._id) {
    UI.show(shownToken);
  }
});

Hooks.on('updateOwnedItem', (actor) => {
  if(shownToken && shownToken.actor === actor) {
    UI.show(shownToken);
  }
});

Hooks.on('renderTokenHUD', (tokenHUD) => {
  const token = tokenHUD.object;
  if (game.user.isGM) {
    UI.show(token);
    shownToken = token;
  }
});
