import './styles.scss';
import * as ui from './ui';

let shownToken: Token | null = null;

Hooks.on('init', () => {
    const originalClose = foundry.applications.hud.TokenHUD.prototype.close;
    foundry.applications.hud.TokenHUD.prototype.close = function () {
    originalClose.call(this);
    shownToken = null;
    ui.hideTokenActions();
  }
});

Hooks.on('updateToken', (token) => {
  if (shownToken && shownToken.document.id === token.id) {
    setTimeout(() => {
      ui.showTokenActions(shownToken);
    }, 1);
  }
});

Hooks.on('updateItem', (item) => {
  if (shownToken && shownToken.actor === item.parent) {
    setTimeout(() => {
      ui.showTokenActions(shownToken);
    }, 1);
  }
});

Hooks.on('updateActor', (actor) => {
  if (shownToken && shownToken.actor === actor) {
    setTimeout(() => {
      ui.showTokenActions(shownToken);
    }, 1);
  }
});

Hooks.on('renderTokenHUD', (tokenHUD) => {
  const token = tokenHUD.object;
  if (ui.showTokenActions(token)) {
    shownToken = token ?? null;
  }
});
