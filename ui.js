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
  if(!token) {
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
  const leftOffset = Math.floor(token.worldTransform.tx - lrOffset)
  const rightOffset = Math.ceil(token.worldTransform.tx + tokenWidth + lrOffset);
  const bottomOffset = canvas.tokens.hud.element.children().offset().top - 6;
  actionsOuterContainer.style.left = leftOffset + 'px';
  actionsOuterContainer.style.right = 'calc(100% - ' + rightOffset + 'px)';
  actionsOuterContainer.style.bottom = 'calc(100% - ' + bottomOffset + 'px)';
  actionsOuterContainer.classList.add(CSS_ACTIVE);
};

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
