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

Hooks.on('renderTokenHUD', (tokenHUD, tokenHUDElem, data) => {
  const token = tokenHUD.object;
  if (token.owner && game.user.hasRole(Settings.MinimumRole.get())) {
    UI.show(token);
    shownToken = token;
  }

  // get the action container
  const el = $('.illandril-npc-quick-actions--outer-container.illandril-npc-quick-actions--active');

  //check if the action box is going off the top of the screen
  let rect = el[0].getBoundingClientRect();
  let viewable = rect.top >= 0;
  if (viewable) {
      //if the box is visible, we dont need to transform it downward
      el[0].style.removeProperty('transform');
  }
  //check again in case we just accidentally moved it off of the screen by removing the transform
  rect = el[0].getBoundingClientRect();
  viewable = rect.top >= 0;
  if (!viewable) {
      //if the box is going off the top of the scree, move it down relative to the tokenHUD element so that it appears underneath instead.
      let offset = tokenHUDElem[0].style.height.split(/(\d+)/)[1] * 2;
      let unit = tokenHUDElem[0].style.height.split(/(\d+)/)[2];
      el.css('transform', 'translateY(calc(100% + ' + offset + unit + '))');
  }
});
