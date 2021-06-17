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

    // get the action container
    const elem = $(".illandril-npc-quick-actions--outer-container.illandril-npc-quick-actions--active");

    if (elem) {
      //check if the action box is going off the top of the screen
      let rect = elem[0].getBoundingClientRect();
      if (rect) {
        let viewable = rect.top >= 0;
        if (viewable && elem.css('transform')) {
          //if the box is visible, we dont need to transform it downward
          elem[0].style.removeProperty('transform');
        }
        //check again in case we just moved it off of the screen by removing the transform
        rect = elem[0].getBoundingClientRect();
        viewable = rect.top >= 0;
        if (!viewable) {
          //if the box is going off the top of the screen, move it down relative to the tokenHUD element so that it appears underneath
          const offset = token.h * canvas.stage.scale.y * 2.2;
          elem.css('transform', 'translateY(calc(100% + ' + offset + 'px))');
        }
      }
    }
  }
});
