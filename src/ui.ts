import module from './module';
import { type Action, type ActivationCategory, getTokenActions } from './quick-actions';
import { MinimumRole, ShowForNPCActors, ShowForPCActors, ShowForVehicleActors } from './settings';

const CSS_ACTIVE = module.cssPrefix.child('active');
const CSS_OUTER_CONTAINER = module.cssPrefix.child('outer-container');
const CSS_CONTAINER = module.cssPrefix.child('container');
const CSS_ACTIVATION_CATEGORY = module.cssPrefix.child('activationCategory');
const CSS_ACTIVATION_CATEGORY_NAME = module.cssPrefix.child('activationCategory-name');
const CSS_ENTRY = module.cssPrefix.child('entry');
const CSS_NO_ACTIONS = module.cssPrefix.child('no-actions');

const actionsOuterContainer = document.createElement('div');
actionsOuterContainer.classList.add(CSS_OUTER_CONTAINER);

const actionsContainer = document.createElement('div');
actionsContainer.classList.add(CSS_CONTAINER);
actionsOuterContainer.appendChild(actionsContainer);

Hooks.once('ready', () => {
  document.body.appendChild(actionsOuterContainer);
});

export const hideTokenActions = () => {
  module.logger.debug('hide');
  actionsOuterContainer.classList.remove(CSS_ACTIVE);
  emptyNode(actionsContainer);
};

const createCategoryContainer = (activationCategory: ActivationCategory) => {
  const activationCategoryContainer = document.createElement('div');
  activationCategoryContainer.classList.add(CSS_ACTIVATION_CATEGORY);

  const categoryTitle = game.i18n.localize(activationCategory.name);
  const titleElement = document.createElement('div');
  titleElement.setAttribute('data-testid', 'categoryTitle');
  titleElement.classList.add(CSS_ACTIVATION_CATEGORY_NAME);
  titleElement.appendChild(document.createTextNode(categoryTitle));
  activationCategoryContainer.appendChild(titleElement);
  actionsContainer.appendChild(activationCategoryContainer);

  return activationCategoryContainer;
};

const isShownForActorType = (actor: dnd5e.documents.Actor5e) => {
  if (actor.type === 'character') {
    return ShowForPCActors.get();
  }
  if (actor.type === 'npc') {
    return ShowForNPCActors.get();
  }
  if (actor.type === 'vehicle') {
    return ShowForVehicleActors.get();
  }
  module.logger.debug('isShownForActorType saw a type it does not recognize:', actor.type);
  return true;
};

export const showTokenActions = (token?: Token | null) => {
  hideTokenActions();
  module.logger.debug('showTokenActions()', token);

  if (!game?.canvas?.hud?.token?.element?.children) {
    module.logger.debug('showTokenActions() -> false, no token HUD on token:', token);
    return false;
  }

  if (!(token?.document?.isOwner && game.user?.hasRole(MinimumRole.get()))) {
    module.logger.debug('showTokenActions() -> false, not owner or insufficient role for token:', token);
    return false;
  }

  const actor = token.actor as dnd5e.documents.Actor5e;
  if (!isShownForActorType(actor)) {
    module.logger.debug('showTokenActions() -> false, not shown for actor.type:', actor.type);
    return false;
  }

  const actions = getTokenActions(actor);
  if (!actions || actions.length === 0) {
    module.logger.debug('showTokenActions() -> true... but no actions:', actions);
    const noActions = document.createElement('div');
    noActions.classList.add(CSS_NO_ACTIONS);
    noActions.appendChild(document.createTextNode(module.localize('no-actions')));
    actionsContainer.appendChild(noActions);
  } else {
    module.logger.debug('showTokenActions() -> true:', actions);
    let lastActivationCategory: ActivationCategory | null = null;
    let activationCategoryContainer: HTMLElement | null = null;
    for (const action of actions) {
      if (action.activationCategory !== lastActivationCategory || !activationCategoryContainer) {
        lastActivationCategory = action.activationCategory;
        activationCategoryContainer = createCategoryContainer(action.activationCategory);
      }
      activationCategoryContainer.appendChild(getActionRow(action));
    }
  }

  repositionActionsOuterContainer(token);

  return true;
};

const repositionActionsOuterContainer = (token: Token) => {
    // Phase 1: Calculate coordinates that DO NOT depend on the HUD's final position
    const lrOffset = 200;

    // Get world coordinates and dimensions of the token
    const tokenWidth = token.w * (game.canvas.stage?.scale?.x ?? 1);
    const leftOffset = Math.floor(token.worldTransform.tx - lrOffset);
    const rightOffset = Math.ceil(token.worldTransform.tx + tokenWidth + lrOffset);

    // Apply the horizontal positioning immediately
    actionsOuterContainer.style.left = `${leftOffset}px`;
    actionsOuterContainer.style.right = `calc(100% - ${rightOffset}px)`;
    actionsOuterContainer.classList.add(CSS_ACTIVE);

    // Phase 2: Defer vertical positioning until the HUD coordinates are stable
    // Use setTimeout(0) or requestAnimationFrame for stable coordinates
    setTimeout(() => {
        // 1. Calculate the desired default position (above the HUD)
        const hudTop = getTokenHUDTop();
        let bottomOffset = hudTop - 6;

        // 2. Apply the default positioning (Above Token HUD)
        actionsOuterContainer.style.top = ''; // Clear 'top' style
        actionsOuterContainer.style.bottom = `calc(100% - ${bottomOffset}px)`;

        // 3. Check for boundary collision (runs AFTER position is set)
        const rect = actionsOuterContainer.getBoundingClientRect();

        // If the box is going off the top of the screen (rect.top <= 0), move it underneath
        if (rect && rect.top <= 0) {
            const hudBottom = getTokenHUDBottom();
            const topOffset = hudBottom + 6;
            actionsOuterContainer.style.bottom = '';
            actionsOuterContainer.style.top = `${topOffset}px`;
        }
    }, 0);
};

function getTokenHUDTop() {
  // Why not just get the offset().top of the token HUD element, or the columns?
  // Because the columns flow outside the HUD element, and often have lots of empty space in them
  let bestTop = Number.POSITIVE_INFINITY;
  const collection = game?.canvas?.hud?.token?.element?.children;
  if (collection?.length) {
    Array.from(collection).forEach(element => {
        const rect = element.getBoundingClientRect();
        bestTop = Math.min(bestTop, rect.top ?? bestTop);
    });
  }

  module.logger.debug('getTokenHUDTop() ->', bestTop);
  return bestTop;
}

function getTokenHUDBottom() {
  // Why not just get the offset().top + outerHeight() of the token HUD element, or the columns?
  // Because the columns flow outside the HUD element, and often have lots of empty space in them
  let bestBottom = Number.NEGATIVE_INFINITY;
  const collection = game?.canvas?.hud?.token?.element?.children;
  if (collection?.length) {
    Array.from(collection).forEach(element => {
        const rect = element.getBoundingClientRect();
        bestBottom = Math.max(bestBottom, rect.bottom ?? bestBottom);
    });
  }
  module.logger.debug('getTokenHUDBottom() ->', bestBottom);
  return bestBottom;
}

declare global {
  interface HookCallbacks {
    'illandril-npc-quick-actions.ActionClick': (event: Event, action: Action) => void;
    'illandril-npc-quick-actions.ActionHoverOn': (event: Event, action: Action) => void;
    'illandril-npc-quick-actions.ActionHoverOff': (event: Event, action: Action) => void;
  }
}

function getActionRow(action: Action) {
  const row = document.createElement('div');
  row.classList.add(CSS_ENTRY);
  row.setAttribute('data-testid', 'action');
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
