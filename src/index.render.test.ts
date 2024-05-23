import { getAllByTestId, screen } from '@testing-library/dom';
import { ShowZeroUsesRemainActions } from './settings';
import tuckerthranx from './tests/data/tokens/tuckertrhanx';
import './index';

beforeAll(() => {
  SIMULATE.mockSavedSetting('illandril-npc-quick-actions', 'minimumRole', 'GAMEMASTER');
  SIMULATE.mockSavedSetting('illandril-npc-quick-actions', 'showForPCActors', true);
  SIMULATE.mockSavedSetting('illandril-npc-quick-actions', 'showForNPCActors', true);
  SIMULATE.mockSavedSetting('illandril-npc-quick-actions', 'showForVehicleActors', true);
  SIMULATE.mockSavedSetting('illandril-npc-quick-actions', 'showZeroUsesRemainActions', true);
  Hooks.callAll('init');
  Hooks.callAll('ready');
});

beforeEach(() => {
  ShowZeroUsesRemainActions.set(true);
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('renders the correct actions for Tuckerthranx', () => {
  it('with showZeroUsesRemaining = false', async () => {
    ShowZeroUsesRemainActions.set(false);

    Hooks.callAll(
      'renderTokenHUD',
      {
        object: tuckerthranx,
      } as TokenHUD,
      null as unknown as JQuery<HTMLElement>,
    );

    await jest.runAllTimersAsync();

    const categoryTitles = screen.getAllByTestId('categoryTitle');

    expect(categoryTitles).toHaveLength(5);
    expect(categoryTitles[0].textContent).toBe('Actions');
    expect(getAllByTestId(categoryTitles[0].parentElement!, 'action').map((action) => action.textContent)).toEqual([
      'Bite',
      'Claws',
      'Tail',
      'Fire Breath (1 / 1)',
      '[C] Mage Hand',
      '[C] Message',
      '[C] Prestidigitation',
      '[1] Charm Person (4 / 4)',
      '[1] Fog Cloud (4 / 4)',
      '[2] Darkness (3 / 3)',
      '[2] Detect Thoughts (3 / 3)',
      '[3] Dispel Magic (2 / 3)',
      '[5] Seeming (1 / 1)',
    ]);

    expect(categoryTitles[1].textContent).toBe('Reactions');
    expect(getAllByTestId(categoryTitles[1].parentElement!, 'action').map((action) => action.textContent)).toEqual([
      '[1] Shield (4 / 4)',
      '[3] Counterspell (2 / 3)',
    ]);

    expect(categoryTitles[2].textContent).toBe('Legendary Actions');
    expect(getAllByTestId(categoryTitles[2].parentElement!, 'action').map((action) => action.textContent)).toEqual([
      'Detect (1)',
      'Legendary Resistance (2)',
      'Tail Attack (1)',
    ]);

    expect(categoryTitles[3].textContent).toBe('Special Actions');
    expect(getAllByTestId(categoryTitles[3].parentElement!, 'action').map((action) => action.textContent)).toEqual([
      'Frightful Presence',
    ]);

    expect(categoryTitles[4].textContent).toBe('Start of Turn');
    expect(getAllByTestId(categoryTitles[4].parentElement!, 'action').map((action) => action.textContent)).toEqual([
      'Reset Actions for New Turn',
    ]);
  });

  it('with showZeroUsesRemaining = true', async () => {
    ShowZeroUsesRemainActions.set(true);

    Hooks.callAll(
      'renderTokenHUD',
      {
        object: tuckerthranx,
      } as TokenHUD,
      null as unknown as JQuery<HTMLElement>,
    );

    await jest.advanceTimersByTimeAsync(10);

    const categoryTitles = screen.getAllByTestId('categoryTitle');

    expect(categoryTitles).toHaveLength(5);
    expect(categoryTitles[0].textContent).toBe('Actions');
    expect(getAllByTestId(categoryTitles[0].parentElement!, 'action').map((action) => action.textContent)).toEqual([
      'Bite',
      'Claws',
      'Tail',
      'Fire Breath (1 / 1)',
      '[C] Mage Hand',
      '[C] Message',
      '[C] Prestidigitation',
      '[1] Charm Person (4 / 4)',
      '[1] Fog Cloud (4 / 4)',
      '[2] Darkness (3 / 3)',
      '[2] Detect Thoughts (3 / 3)',
      '[3] Dispel Magic (2 / 3)',
      '[4] Dimension Door (0 / 3)',
      '[5] Seeming (1 / 1)',
    ]);

    expect(categoryTitles[1].textContent).toBe('Reactions');
    expect(getAllByTestId(categoryTitles[1].parentElement!, 'action').map((action) => action.textContent)).toEqual([
      '[1] Shield (4 / 4)',
      '[3] Counterspell (2 / 3)',
    ]);

    expect(categoryTitles[2].textContent).toBe('Legendary Actions');
    expect(getAllByTestId(categoryTitles[2].parentElement!, 'action').map((action) => action.textContent)).toEqual([
      'Detect (1)',
      'Legendary Resistance (2)',
      'Tail Attack (1)',
      'Wing Attack (0)',
    ]);

    expect(categoryTitles[3].textContent).toBe('Special Actions');
    expect(getAllByTestId(categoryTitles[3].parentElement!, 'action').map((action) => action.textContent)).toEqual([
      'Frightful Presence',
    ]);

    expect(categoryTitles[4].textContent).toBe('Start of Turn');
    expect(getAllByTestId(categoryTitles[4].parentElement!, 'action').map((action) => action.textContent)).toEqual([
      'Reset Actions for New Turn',
    ]);
  });
});
