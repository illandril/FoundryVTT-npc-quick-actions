import module from './module';
import { Action, ActivationCategory, get } from './quick-actions';
import {
  MinimumRole,
  ShowForNPCActors,
  ShowForPCActors,
  ShowForVehicleActors,
} from './settings';

const CSS_ACTIVE = module.cssPrefix.child('active');
const CSS_OUTER_CONTAINER = module.cssPrefix.child('outer-container');
const CSS_CONTAINER = module.cssPrefix.child('container');
const CSS_ACTIVATION_CATEGORY = module.cssPrefix.child('activationCategory');
const CSS_ACTIVATION_CATEGORY_NAME = module.cssPrefix.child('activationCategory-name');
const CSS_ENTRY = module.cssPrefix.child('entry');

const actionsOuterContainer = document.createElement('div');
actionsOuterContainer.classList.add(CSS_OUTER_CONTAINER);

const actionsContainer = document.createElement('div');
actionsContainer.classList.add(CSS_CONTAINER);
actionsOuterContainer.appendChild(actionsContainer);

Hooks.once('ready', () => {
  document.body.appendChild(actionsOuterContainer);
});

export const hide = () => {
  module.logger.debug('hide');
  actionsOuterContainer.classList.remove(CSS_ACTIVE);
  emptyNode(actionsContainer);
};

const createCategoryContainer = (activationCategory: ActivationCategory) => {
  const activationCategoryContainer = document.createElement('div');
  activationCategoryContainer.classList.add(CSS_ACTIVATION_CATEGORY);

  const categoryTitle = game.i18n.localize(activationCategory.name);
  const titleElement = document.createElement('div');
  titleElement.classList.add(CSS_ACTIVATION_CATEGORY_NAME);
  titleElement.appendChild(document.createTextNode(categoryTitle));
  activationCategoryContainer.appendChild(titleElement);
  actionsContainer.appendChild(activationCategoryContainer);

  return activationCategoryContainer;
};

export const show = (token?: Token | null) => {
  hide();
  module.logger.debug('show()', token);
  if (!token || !token.owner || !game.user?.hasRole(MinimumRole.get())) {
    module.logger.debug('show() -> false, not owner or insufficient role');
    return false;
  }

  const actor = token.actor;
  if (actor.type === 'character' && !ShowForPCActors.get()) {
    module.logger.debug('show() -> false, not shown for actor.type === character');
    return false;
  }
  if (actor.type === 'npc' && !ShowForNPCActors.get()) {
    module.logger.debug('show() -> false, not shown for actor.type === npc');
    return false;
  }
  if (actor.type === 'vehicle' && !ShowForVehicleActors.get()) {
    module.logger.debug('show() -> false, not shown for actor.type === vehicle');
    return false;
  }

  const actions = get(actor);
  if (!actions || actions.length === 0) {
    module.logger.debug('show() -> false, no actions');
    return false;
  }

  module.logger.debug('show() -> true', actions);
  let lastActivationCategory: ActivationCategory | null = null;
  let activationCategoryContainer: HTMLElement | null = null;
  for (const action of actions) {
    if (action.activationCategory !== lastActivationCategory || !activationCategoryContainer) {
      lastActivationCategory = action.activationCategory;
      activationCategoryContainer = createCategoryContainer(action.activationCategory);
    }
    activationCategoryContainer.appendChild(getActionRow(action));
  }

  repositionActionsOuterContainer(token);

  return true;
};

const repositionActionsOuterContainer = (token: Token) => {
  const lrOffset = 200;
  const tokenWidth = token.w * (game.canvas.stage?.scale?.x ?? 1);
  const leftOffset = Math.floor(token.worldTransform.tx - lrOffset);
  const rightOffset = Math.ceil(token.worldTransform.tx + tokenWidth + lrOffset);
  const bottomOffset = getTokenHUDTop() - 6;
  actionsOuterContainer.style.left = `${leftOffset}px`;
  actionsOuterContainer.style.right = `calc(100% - ${rightOffset}px)`;
  actionsOuterContainer.style.top = '';
  actionsOuterContainer.style.bottom = `calc(100% - ${bottomOffset}px)`;
  actionsOuterContainer.classList.add(CSS_ACTIVE);

  const rect = actionsOuterContainer.getBoundingClientRect();
  if (rect && rect.top <= 0) {
    // If the box is going off the top of the screen, move it down relative to the tokenHUD element so that it appears underneath
    const topOffset = getTokenHUDBottom() + 6;
    actionsOuterContainer.style.bottom = '';
    actionsOuterContainer.style.top = `${topOffset}px`;
  }
};

function getTokenHUDTop() {
  // Why not just get the offset().top of the token HUD element, or the columns?
  // Because the columns flow outside the HUD element, and often have lots of empty space in them
  const tokenHUDColumns = game.canvas.hud?.token?.element?.children();
  const tokenHUDElements = tokenHUDColumns?.children();
  let bestTop = 99999;
  tokenHUDElements?.each((_index, child) => {
    bestTop = Math.min(bestTop, $(child).offset()?.top ?? bestTop);
  });
  return bestTop;
}

function getTokenHUDBottom() {
  // Why not just get the offset().top + outerHeight() of the token HUD element, or the columns?
  // Because the columns flow outside the HUD element, and often have lots of empty space in them
  const tokenHUDColumns = game.canvas.hud?.token?.element?.children();
  const tokenHUDElements = tokenHUDColumns?.children();
  let bestBottom = 0;
  tokenHUDElements?.each((_index, child) => {
    const jqChild = $(child);
    const top = jqChild.offset()?.top;
    const height = jqChild.outerHeight();
    if (typeof top === 'number' && typeof height === 'number') {
      const bottom = top + height;
      bestBottom = Math.max(bestBottom, bottom);
    }
  });
  return bestBottom;
}

declare global {
  interface HookCallbacks {
    ['illandril-npc-quick-actions.ActionClick']: (event: Event, action: Action) => void
    ['illandril-npc-quick-actions.ActionHoverOn']: (event: Event, action: Action) => void
    ['illandril-npc-quick-actions.ActionHoverOff']: (event: Event, action: Action) => void
  }
}

function getActionRow(action: Action) {
  const row = document.createElement('div');
  row.classList.add(CSS_ENTRY);
  row.addEventListener('click', (event) => {
    Hooks.callAll(`${module.id}.ActionClick`, event, action);
    action.roll();
  });
  row.addEventListener('mouseenter', (event) => {
    Hooks.callAll(`${module.id}.ActionHoverOn`, event, action);
  });
  row.addEventListener('mouseleave', (event) => {
    Hooks.callAll(`${module.id}.ActionHoverOff`, event, action);
  });
  row.appendChild(document.createTextNode(action.name));
  return row;
}

function emptyNode(node: Node) {
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
}
