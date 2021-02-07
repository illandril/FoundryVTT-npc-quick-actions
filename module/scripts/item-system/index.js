import * as dnd5e from './dnd5e.js';

const getItemSystem = () => {
  switch (game.system.id) {
    case 'dnd5e':
      return dnd5e;
    default:
      return null;
  }
};

export const calculateUsesForItem = (item) => {
  const itemSystem = getItemSystem();
  return itemSystem === null ? null : itemSystem.calculateUsesForItem(item);
};
