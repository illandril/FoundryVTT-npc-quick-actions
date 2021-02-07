import { log, KEY as MODULE_KEY } from './module.js';

const settingsList = [];

class Setting {
  constructor(type, key, defaultValue, options = {}) {
    this.type = type;
    this.key = key;
    this.hasHint = !!options.hasHint;
    this.defaultValue = defaultValue;
    this.choices = options.choices || undefined;
    this.scope = options.scope || 'world';
    settingsList.push(this);
  }

  register() {
    const name = game.i18n.localize(`${MODULE_KEY}.setting.${this.key}.label`);
    const hint = this.hasHint ? game.i18n.localize(`${MODULE_KEY}.setting.${this.key}.hint`) : null;
    game.settings.register(MODULE_KEY, this.key, {
      name,
      hint,
      scope: this.scope,
      config: true,
      default: this.defaultValue,
      type: this.type,
      choices: this.choices,
    });
  }

  get() {
    return game.settings.get(MODULE_KEY, this.key);
  }
}

class BooleanSetting extends Setting {
  constructor(key, defaultValue, options = {}) {
    super(Boolean, key, defaultValue, options);
  }
}

const minimumRoleChoices = Object.keys(CONST.USER_ROLES).reduce((choices, roleKey) => {
  if (roleKey !== 'NONE') {
    choices[roleKey] = `USER.Role${roleKey.titleCase()}`;
  }
  return choices;
}, {});

class ChoiceSetting extends Setting {
  constructor(key, defaultValue, choices, options = {}) {
    super(
      String,
      key,
      defaultValue,
      mergeObject(
        options,
        {
          choices,
        },
        {
          inplace: false,
        }
      )
    );
  }
}

const Settings = {
  // Core Settings
  MinimumRole: new ChoiceSetting('minimumRole', 'GAMEMASTER', minimumRoleChoices, {
    hasHint: true,
  }),
  ShowUnpreparedNPCSpells: new BooleanSetting('showUnpreparedNPCSpells', false, { hasHint: true } ),
  ShowUnpreparedPCSpells: new BooleanSetting('showUnpreparedPCSpells', false, { hasHint: true } ),
  ShowUnequippedNPCItems: new BooleanSetting('showUnequippedNPCItems', false, { hasHint: true } ),
  ShowUnequippedPCItems: new BooleanSetting('showUnequippedPCItems', false, { hasHint: true } ),
  ShowZeroUsesRemainActions: new BooleanSetting('showZeroUsesRemainActions', false, { hasHint: true } ),
};

Object.freeze(Settings);
export default Settings;

Hooks.once('init', () => {
  settingsList.forEach((setting) => {
    setting.register();
  });
});
