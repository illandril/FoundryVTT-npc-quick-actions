import * as QuickActions from './quick-actions.js';

const CSS_PREFIX = 'illandril-npc-quick-actions--';
const CSS_ACTIVE = CSS_PREFIX + 'active';
const CSS_OUTER_CONTAINER = CSS_PREFIX + 'outer-container';
const CSS_CONTAINER = CSS_PREFIX + 'container';
const CSS_ACTIVATION_CATEGORY = CSS_PREFIX + 'activationCategory';
const CSS_ACTIVATION_CATEGORY_NAME = CSS_ACTIVATION_CATEGORY + '-name';
const CSS_ENTRY = CSS_PREFIX + 'entry';

const actionsOuterContainer = document.createElement('div');
actionsOuterContainer.classList.add(CSS_OUTER_CONTAINER);

const actionsContainer = document.createElement('div');
actionsContainer.classList.add(CSS_CONTAINER);
actionsOuterContainer.appendChild(actionsContainer);

Hooks.once('ready', () => {
  document.body.appendChild(actionsOuterContainer);
});

export const hide = () => {
  actionsOuterContainer.classList.remove(CSS_ACTIVE);
  emptyNode(actionsContainer);
};

export const show = (token) => {
  hide();
  if (!token) {
    return;
  }
  const actor = token.actor;
  const actions = QuickActions.get(actor);
  if (!actions || actions.length === 0) {
    return;
  }

  let lastActivationCategory = null;
  let activationCategoryContainer = null;
  actions.forEach((action) => {
    if (action.activationCategory !== lastActivationCategory) {
      lastActivationCategory = action.activationCategory;
      activationCategoryContainer = document.createElement('div');
      activationCategoryContainer.classList.add(CSS_ACTIVATION_CATEGORY);

      const categoryTitle = game.i18n.localize(lastActivationCategory.name);
      const titleElement = document.createElement('div');
      titleElement.classList.add(CSS_ACTIVATION_CATEGORY_NAME);
      titleElement.appendChild(document.createTextNode(categoryTitle));
      activationCategoryContainer.appendChild(titleElement);
      actionsContainer.appendChild(activationCategoryContainer);
    }
    activationCategoryContainer.appendChild(getActionRow(action));
  });

  const lrOffset = 200;
  const tokenWidth = token.w * canvas.stage.scale.x;
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
  const tokenHUDColumns = canvas.tokens.hud.element.children();
  const tokenHUDElements = tokenHUDColumns.children();
  let bestTop = 99999;
  Array.prototype.forEach.call(tokenHUDElements, (child) => {
    bestTop = Math.min(bestTop, $(child).offset().top);
  });
  return bestTop;
}

function getTokenHUDBottom() {
  // Why not just get the offset().top of the token HUD element, or the columns?
  // Because the columns flow outside the HUD element, and often have lots of empty space in them
  const tokenHUDColumns = canvas.tokens.hud.element.children();
  const tokenHUDElements = tokenHUDColumns.children();
  let bestBottom = 0;
  Array.prototype.forEach.call(tokenHUDElements, (child) => {
    const jqChild = $(child);
    const top = jqChild.offset().top;
    const height = jqChild.outerHeight();
    const bottom = top + height;
    bestBottom = Math.max(bestBottom, bottom);
  });
  return bestBottom;
}

function getActionRow(action) {
  const row = document.createElement('div');
  row.classList.add(CSS_ENTRY);
  row.addEventListener('click', () => {
    action.roll();
  });
  row.appendChild(document.createTextNode(action.name));
  return row;
}

function emptyNode(node) {
  while (node.firstChild) {
    node.removeChild(node.lastChild);
  }
}
