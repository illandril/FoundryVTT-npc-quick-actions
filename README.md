# Illandril's Token Quick Actions (5e)
![Latest Release Download Count](https://img.shields.io/github/downloads/illandril/FoundryVTT-npc-quick-actions/latest/module.zip?color=4b0000&label=Downloads)
![Forge Installs](https://img.shields.io/badge/dynamic/json?color=4b0000&label=Forge%20Installs&query=package.installs&url=http%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fillandril-npc-quick-actions&suffix=%25)
![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json?color=4b0000&label=Foundry%20Version&query=$.compatibleCoreVersion&url=https%3A%2F%2Fgithub.com%2Fillandril%2FFoundryVTT-npc-quick-actions%2Freleases%2Flatest%2Fdownload%2Fmodule.json)

This is a module for Foundry Virtual Tabletop that adds a "Quick Actions" menu above the Token HUD when right-clicking on tokens. This menu shows all Features, Spells, and Items for the actor that has an Activation Cost of Action, Bonus Action, Reaction, Legendary Action, Lair Action, Special, or Crew Action. If the action has limited uses, the menu indicates how many uses the actor has for that action. This menu can optionally be made available to other players.

![Screenshot showing a Quick Actions list for an Ice Mephit](/screenshots/example-a.png?raw=true)

For actors with features with an "Action Recharge" that are not currently charged, or Legendary Actions where the available Legendary Actions is less than the maximum, a special "Reset Actions" quick action is also provided. Clicking this special action resets the token's available Legendary Actions to the maximum, and rolls each rechargeable action to see if it is recharged.

This currently only supports the DnD5e System.
