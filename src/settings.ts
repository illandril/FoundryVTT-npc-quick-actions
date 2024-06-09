import module from './module';

type UserRole = Exclude<keyof typeof foundry.CONST.USER_ROLES, 'NONE'>;
const allUserRoles = Object.keys(foundry.CONST.USER_ROLES) as (keyof typeof foundry.CONST.USER_ROLES)[];
const minimumRoleChoices = allUserRoles.reduce(
  (choices, roleKey) => {
    if (roleKey !== 'NONE') {
      choices[roleKey] = `USER.Role${roleKey.titleCase()}`;
    }
    return choices;
  },
  {} as Record<UserRole, string>,
);

export const MinimumRole = module.settings.register<UserRole>('minimumRole', String, 'GAMEMASTER', {
  choices: minimumRoleChoices,
  hasHint: true,
});

const showFor = (
  actor: Actor | null,
  showForPC: typeof ShowUnpreparedPCSpells,
  showForNPC: typeof ShowUnpreparedNPCSpells,
) => {
  if (actor?.hasPlayerOwner) {
    return showForPC.get();
  }
  return showForNPC.get();
};

export const ShowOnlyFavorites = module.settings.register('showOnlyFavorites', Boolean, false, {
  hasHint: true,
});

const ShowUnpreparedNPCSpells = module.settings.register('showUnpreparedNPCSpells', Boolean, false, {
  hasHint: true,
});
const ShowUnpreparedPCSpells = module.settings.register('showUnpreparedPCSpells', Boolean, false, {
  hasHint: true,
});
export const showUnpreparedSpells = (actor: Actor | null) =>
  showFor(actor, ShowUnpreparedPCSpells, ShowUnpreparedNPCSpells);

const ShowUnequippedNPCItems = module.settings.register('showUnequippedNPCItems', Boolean, false, {
  hasHint: true,
});
const ShowUnequippedPCItems = module.settings.register('showUnequippedPCItems', Boolean, false, {
  hasHint: true,
});
export const showUnequippedItems = (actor: Actor | null) =>
  showFor(actor, ShowUnequippedPCItems, ShowUnequippedNPCItems);

export const ShowZeroUsesRemainActions = module.settings.register('showZeroUsesRemainActions', Boolean, false, {
  hasHint: true,
});

export const ShowForPCActors = module.settings.register('showForPCActors', Boolean, false, {
  hasHint: true,
});
export const ShowForNPCActors = module.settings.register('showForNPCActors', Boolean, false, {
  hasHint: true,
});
export const ShowForVehicleActors = module.settings.register('showForVehicleActors', Boolean, false, {
  hasHint: true,
});
