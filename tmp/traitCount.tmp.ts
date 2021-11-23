#!/usr/bin/env node
const R = require('ramda');


const traits = {
  "Hand Items": {
    "thanos gauntlet - the power stone (purple)": 12,
    "claws 1": 37,
    "lp katana": 41,
    "bomb": 28,
    "thanos gauntlet - the soul stone (orange)": 11,
    "wylie mallet": 59,
    "super soak xp100": 50,
    "maul saber": 24,
    "switchblade": 37,
    "thanos gauntlet - the time stone (green)": 10,
    "thanos gauntlet - the space stone (blue)": 15,
    "thanos gauntlet - the reality stone (red)": 10,
    "cleaver": 65,
    "rpg": 28,
    "weaponized baseball bat": 36,
    "wolverine knuckle knives": 33,
    "malware attack": 38,
    "hand cannon": 28,
    "thanos gauntlet - the mind stone (yellow)": 6
  },
  "Mouth": {
    "tongue out": 110,
    "gold sabertooth": 15,
    "yikes mouth": 77,
    "saw tooth": 133,
    "cheshire grin": 46,
    "rows": 39,
    "sabertooth": 87,
    "lime slime mouth": 37,
    "pink slime mouth": 84
  },
  "Speech Bubbles": {
    "fomo": 40,
    "grrr": 19,
    "knock knock": 21,
    "outside": 23,
    "grumble": 24,
    "lookin at": 19,
    "getcha!": 30,
    "ahhhh!": 53,
    "total domination": 31,
    "burp": 22,
    "none": 1,
    "lucky punk": 14
  },
  "Lethality": {
    "4 (super rare)": 46,
    "5 (legendaries)": 3,
    "1 (common)": 485,
    "2 (uncommon)": 142,
    "3 (rare)": 101
  },
  "Chest Items": {
    "cotton guts": 1,
    "bullet belt": 109,
    "none": 1,
    "kamakazee": 90
  },
  "Fur Color": {
    "albino ": 47,
    "oger": 92,
    "steel": 72,
    "infected yellow": 72,
    "oatmeal": 49,
    "rusty": 76,
    "slate blue": 88,
    "sage": 72,
    "anthracite": 62,
    "artery red": 89,
    "rotten plum": 56
  },
  "Horns": {
    "goat horns": 78,
    "bonehorn": 52,
    "tusky horns": 57
  },
  "Undies": {
    "skull undies": 45
  },
  "Head": {
    "boneface": 10,
    "batcave mouth": 18,
    "none": 1,
    "bonehead (anthracite)": 12,
    "tv head (hypno)": 9,
    "tv head (poltergeist)": 12,
    "friday mask": 26,
    "imposter": 7,
    "tv head (broken heart)": 7,
    "tv head (selfie)": 7,
    "face hugger": 10,
    "bonehead (oatmeal)": 9
  },
  "Background": {
    "albino": 82,
    "steel": 74,
    "oatmeal": 82,
    "artery red": 38,
    "oger": 33,
    "sage": 73,
    "anthracite": 86,
    "rotten plum": 76,
    "slate blue": 96,
    "infected yellow": 68,
    "rusty": 67
  },
  "Hands-Feet Color": {
    "infected yellow": 74,
    "oger": 87,
    "oatmeal": 51,
    "artery red": 67,
    "slate blue": 102,
    "albino": 34,
    "steel": 110,
    "rotten plum": 68,
    "rusty": 73,
    "sage": 79,
    "anthracite": 30
  },
  "Eyes": {
    "original": 174,
    "lazer eyes": 9,
    "hollow eyes": 125,
    "evil eyes": 63,
    "red evil eyes": 44,
    "all eyes on me (angry)": 48,
    "cyclops 2045": 44,
    "angry eyes": 160
  },
  "Back Items": {
    "doctopus": 118,
    "black eagle": 33,
    "gargoyle": 61,
    "artery gargoyle": 34
  }
}

const assets = [{
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:21",
  "traits": [{
    "traitScore": 16.89130435,
    "traitStat": 0.059202059202059204,
    "trait_count": 46,
    "value": "4 (Super Rare)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 10.79166667,
    "traitStat": 0.09266409266409266,
    "trait_count": 72,
    "value": "Infected Yellow",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 111,
    "traitStat": 0.009009009009009009,
    "trait_count": 7,
    "value": "TV Head (Broken Heart)",
    "trait_type": "Head"
  }, {
    "traitScore": 27.75,
    "traitStat": 0.036036036036036036,
    "trait_count": 28,
    "value": "Hand Cannon",
    "trait_type": "Hand Items"
  }, {
    "traitScore": 10.5,
    "traitStat": 0.09523809523809523,
    "trait_count": 74,
    "value": "Infected Yellow",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 10.22368421,
    "traitStat": 0.0978120978120978,
    "trait_count": 76,
    "value": "Rotten Plum",
    "trait_type": "Background"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:17",
  "traits": [{
    "traitScore": 10.79166667,
    "traitStat": 0.09266409266409266,
    "trait_count": 72,
    "value": "Sage",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 7.61764706,
    "traitStat": 0.13127413127413126,
    "trait_count": 102,
    "value": "Slate Blue",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 4.85625,
    "traitStat": 0.2059202059202059,
    "trait_count": 160,
    "value": "Angry Eyes",
    "trait_type": "Eyes"
  }, {
    "traitScore": 10.5,
    "traitStat": 0.09523809523809523,
    "trait_count": 74,
    "value": "Steel",
    "trait_type": "Background"
  }, {
    "traitScore": 1.60206186,
    "traitStat": 0.6241956241956242,
    "trait_count": 485,
    "value": "1 (Common)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 11.95384615,
    "traitStat": 0.08365508365508366,
    "trait_count": 65,
    "value": "Cleaver",
    "trait_type": "Hand Items"
  }, {
    "traitScore": 9.25,
    "traitStat": 0.10810810810810811,
    "trait_count": 84,
    "value": "Pink Slime Mouth",
    "trait_type": "Mouth"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:12",
  "traits": [{
    "traitScore": 4.85625,
    "traitStat": 0.2059202059202059,
    "trait_count": 160,
    "value": "Angry Eyes",
    "trait_type": "Eyes"
  }, {
    "traitScore": 9.03488372,
    "traitStat": 0.11068211068211069,
    "trait_count": 86,
    "value": "Anthracite",
    "trait_type": "Background"
  }, {
    "traitScore": 8.93103448,
    "traitStat": 0.11196911196911197,
    "trait_count": 87,
    "value": "Oger",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 10.22368421,
    "traitStat": 0.0978120978120978,
    "trait_count": 76,
    "value": "Rusty",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 25.9,
    "traitStat": 0.03861003861003861,
    "trait_count": 30,
    "value": "Getcha!",
    "trait_type": "Speech Bubbles"
  }, {
    "traitScore": 19.92307692,
    "traitStat": 0.05019305019305019,
    "trait_count": 39,
    "value": "Rows",
    "trait_type": "Mouth"
  }, {
    "traitScore": 21,
    "traitStat": 0.047619047619047616,
    "trait_count": 37,
    "value": "Claws 1",
    "trait_type": "Hand Items"
  }, {
    "traitScore": 5.47183099,
    "traitStat": 0.18275418275418276,
    "trait_count": 142,
    "value": "2 (Uncommon)",
    "trait_type": "Lethality"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:2",
  "traits": [{
    "traitScore": 10.79166667,
    "traitStat": 0.09266409266409266,
    "trait_count": 72,
    "value": "Sage",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 18.95121951,
    "traitStat": 0.05276705276705277,
    "trait_count": 41,
    "value": "LP Katana",
    "trait_type": "Hand Items"
  }, {
    "traitScore": 10.5,
    "traitStat": 0.09523809523809523,
    "trait_count": 74,
    "value": "Steel",
    "trait_type": "Background"
  }, {
    "traitScore": 1.60206186,
    "traitStat": 0.6241956241956242,
    "trait_count": 485,
    "value": "1 (Common)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 6.216,
    "traitStat": 0.16087516087516088,
    "trait_count": 125,
    "value": "Hollow Eyes",
    "trait_type": "Eyes"
  }, {
    "traitScore": 9.83544304,
    "traitStat": 0.10167310167310167,
    "trait_count": 79,
    "value": "Sage",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 19.92307692,
    "traitStat": 0.05019305019305019,
    "trait_count": 39,
    "value": "Rows",
    "trait_type": "Mouth"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:27",
  "traits": [{
    "traitScore": 20.44736842,
    "traitStat": 0.0489060489060489,
    "trait_count": 38,
    "value": "Artery Red",
    "trait_type": "Background"
  }, {
    "traitScore": 10.64383562,
    "traitStat": 0.09395109395109395,
    "trait_count": 73,
    "value": "Rusty",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 7.12844037,
    "traitStat": 0.1402831402831403,
    "trait_count": 109,
    "value": "Bullet Belt",
    "trait_type": "Chest Items"
  }, {
    "traitScore": 6.58474576,
    "traitStat": 0.15186615186615188,
    "trait_count": 118,
    "value": "Doctopus",
    "trait_type": "Back Items"
  }, {
    "traitScore": 5.84210526,
    "traitStat": 0.17117117117117117,
    "trait_count": 133,
    "value": "Saw Tooth",
    "trait_type": "Mouth"
  }, {
    "traitScore": 8.82954545,
    "traitStat": 0.11325611325611326,
    "trait_count": 88,
    "value": "Slate Blue",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 1.60206186,
    "traitStat": 0.6241956241956242,
    "trait_count": 485,
    "value": "1 (Common)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 4.46551724,
    "traitStat": 0.22393822393822393,
    "trait_count": 174,
    "value": "Original",
    "trait_type": "Eyes"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:24",
  "traits": [{
    "traitScore": 21,
    "traitStat": 0.047619047619047616,
    "trait_count": 37,
    "value": "Lime Slime Mouth",
    "trait_type": "Mouth"
  }, {
    "traitScore": 10.79166667,
    "traitStat": 0.09266409266409266,
    "trait_count": 72,
    "value": "Infected Yellow",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 15.54,
    "traitStat": 0.06435006435006435,
    "trait_count": 50,
    "value": "Super Soak XP100",
    "trait_type": "Hand Items"
  }, {
    "traitScore": 9.03488372,
    "traitStat": 0.11068211068211069,
    "trait_count": 86,
    "value": "Anthracite",
    "trait_type": "Background"
  }, {
    "traitScore": 12.33333333,
    "traitStat": 0.08108108108108109,
    "trait_count": 63,
    "value": "Evil Eyes",
    "trait_type": "Eyes"
  }, {
    "traitScore": 10.5,
    "traitStat": 0.09523809523809523,
    "trait_count": 74,
    "value": "Infected Yellow",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 5.47183099,
    "traitStat": 0.18275418275418276,
    "trait_count": 142,
    "value": "2 (Uncommon)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 14.66037736,
    "traitStat": 0.0682110682110682,
    "trait_count": 53,
    "value": "Ahhhh!",
    "trait_type": "Speech Bubbles"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:16",
  "traits": [{
    "traitScore": 27.75,
    "traitStat": 0.036036036036036036,
    "trait_count": 28,
    "value": "Bomb",
    "trait_type": "Hand Items"
  }, {
    "traitScore": 5.84210526,
    "traitStat": 0.17117117117117117,
    "trait_count": 133,
    "value": "Saw Tooth",
    "trait_type": "Mouth"
  }, {
    "traitScore": 8.09375,
    "traitStat": 0.12355212355212356,
    "trait_count": 96,
    "value": "Slate Blue",
    "trait_type": "Background"
  }, {
    "traitScore": 15.23529412,
    "traitStat": 0.06563706563706563,
    "trait_count": 51,
    "value": "Oatmeal",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 12.33333333,
    "traitStat": 0.08108108108108109,
    "trait_count": 63,
    "value": "Evil Eyes",
    "trait_type": "Eyes"
  }, {
    "traitScore": 8.73033708,
    "traitStat": 0.11454311454311454,
    "trait_count": 89,
    "value": "Artery Red",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 5.47183099,
    "traitStat": 0.18275418275418276,
    "trait_count": 142,
    "value": "2 (Uncommon)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 40.89473684,
    "traitStat": 0.02445302445302445,
    "trait_count": 19,
    "value": "Grrr",
    "trait_type": "Speech Bubbles"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:9",
  "traits": [{
    "traitScore": 9.47560976,
    "traitStat": 0.10553410553410554,
    "trait_count": 82,
    "value": "Oatmeal",
    "trait_type": "Background"
  }, {
    "traitScore": 13.16949153,
    "traitStat": 0.07593307593307594,
    "trait_count": 59,
    "value": "Wylie Mallet",
    "trait_type": "Hand Items"
  }, {
    "traitScore": 16.89130435,
    "traitStat": 0.059202059202059204,
    "trait_count": 46,
    "value": "Cheshire Grin",
    "trait_type": "Mouth"
  }, {
    "traitScore": 1.60206186,
    "traitStat": 0.6241956241956242,
    "trait_count": 485,
    "value": "1 (Common)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 10.5,
    "traitStat": 0.09523809523809523,
    "trait_count": 74,
    "value": "Infected Yellow",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 8.73033708,
    "traitStat": 0.11454311454311454,
    "trait_count": 89,
    "value": "Artery Red",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 4.46551724,
    "traitStat": 0.22393822393822393,
    "trait_count": 174,
    "value": "Original",
    "trait_type": "Eyes"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:3",
  "traits": [{
    "traitScore": 10.64383562,
    "traitStat": 0.09395109395109395,
    "trait_count": 73,
    "value": "Rusty",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 5.84210526,
    "traitStat": 0.17117117117117117,
    "trait_count": 133,
    "value": "Saw Tooth",
    "trait_type": "Mouth"
  }, {
    "traitScore": 13.875,
    "traitStat": 0.07207207207207207,
    "trait_count": 56,
    "value": "Rotten Plum",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 1.60206186,
    "traitStat": 0.6241956241956242,
    "trait_count": 485,
    "value": "1 (Common)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 11.95384615,
    "traitStat": 0.08365508365508366,
    "trait_count": 65,
    "value": "Cleaver",
    "trait_type": "Hand Items"
  }, {
    "traitScore": 11.59701493,
    "traitStat": 0.08622908622908623,
    "trait_count": 67,
    "value": "Rusty",
    "trait_type": "Background"
  }, {
    "traitScore": 4.46551724,
    "traitStat": 0.22393822393822393,
    "trait_count": 174,
    "value": "Original",
    "trait_type": "Eyes"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:25",
  "traits": [{
    "traitScore": 21,
    "traitStat": 0.047619047619047616,
    "trait_count": 37,
    "value": "Switchblade",
    "trait_type": "Hand Items"
  }, {
    "traitScore": 9.47560976,
    "traitStat": 0.10553410553410554,
    "trait_count": 82,
    "value": "Albino",
    "trait_type": "Background"
  }, {
    "traitScore": 11.42647059,
    "traitStat": 0.08751608751608751,
    "trait_count": 68,
    "value": "Rotten Plum",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 8.63333333,
    "traitStat": 0.11583011583011583,
    "trait_count": 90,
    "value": "Kamakazee",
    "trait_type": "Chest Items"
  }, {
    "traitScore": 1.60206186,
    "traitStat": 0.6241956241956242,
    "trait_count": 485,
    "value": "1 (Common)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 10.22368421,
    "traitStat": 0.0978120978120978,
    "trait_count": 76,
    "value": "Rusty",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 6.216,
    "traitStat": 0.16087516087516088,
    "trait_count": 125,
    "value": "Hollow Eyes",
    "trait_type": "Eyes"
  }, {
    "traitScore": 51.8,
    "traitStat": 0.019305019305019305,
    "trait_count": 15,
    "value": "Gold Sabertooth",
    "trait_type": "Mouth"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:23",
  "traits": [{
    "traitScore": 9.03488372,
    "traitStat": 0.11068211068211069,
    "trait_count": 86,
    "value": "Anthracite",
    "trait_type": "Background"
  }, {
    "traitScore": 15.85714286,
    "traitStat": 0.06306306306306306,
    "trait_count": 49,
    "value": "Oatmeal",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 5.84210526,
    "traitStat": 0.17117117117117117,
    "trait_count": 133,
    "value": "Saw Tooth",
    "trait_type": "Mouth"
  }, {
    "traitScore": 1.60206186,
    "traitStat": 0.6241956241956242,
    "trait_count": 485,
    "value": "1 (Common)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 9.83544304,
    "traitStat": 0.10167310167310167,
    "trait_count": 79,
    "value": "Sage",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 20.44736842,
    "traitStat": 0.0489060489060489,
    "trait_count": 38,
    "value": "Malware Attack",
    "trait_type": "Hand Items"
  }, {
    "traitScore": 4.46551724,
    "traitStat": 0.22393822393822393,
    "trait_count": 174,
    "value": "Original",
    "trait_type": "Eyes"
  }, {
    "traitScore": 14.66037736,
    "traitStat": 0.0682110682110682,
    "trait_count": 53,
    "value": "Ahhhh!",
    "trait_type": "Speech Bubbles"
  }]
}, {
  "id": "0x457e089448b41903a3778f592e7f4a0b87d2f2a8:22",
  "traits": [{
    "traitScore": 16.89130435,
    "traitStat": 0.059202059202059204,
    "trait_count": 46,
    "value": "4 (Super Rare)",
    "trait_type": "Lethality"
  }, {
    "traitScore": 21,
    "traitStat": 0.047619047619047616,
    "trait_count": 37,
    "value": "Lime Slime Mouth",
    "trait_type": "Mouth"
  }, {
    "traitScore": 7.12844037,
    "traitStat": 0.1402831402831403,
    "trait_count": 109,
    "value": "Bullet Belt",
    "trait_type": "Chest Items"
  }, {
    "traitScore": 10.79166667,
    "traitStat": 0.09266409266409266,
    "trait_count": 72,
    "value": "Sage",
    "trait_type": "Fur Color"
  }, {
    "traitScore": 6.58474576,
    "traitStat": 0.15186615186615188,
    "trait_count": 118,
    "value": "Doctopus",
    "trait_type": "Back Items"
  }, {
    "traitScore": 17.65909091,
    "traitStat": 0.05662805662805663,
    "trait_count": 44,
    "value": "Red Evil Eyes",
    "trait_type": "Eyes"
  }, {
    "traitScore": 37,
    "traitStat": 0.02702702702702703,
    "trait_count": 21,
    "value": "Knock Knock",
    "trait_type": "Speech Bubbles"
  }, {
    "traitScore": 7.06363636,
    "traitStat": 0.14157014157014158,
    "trait_count": 110,
    "value": "Steel",
    "trait_type": "Hands-Feet Color"
  }, {
    "traitScore": 10.64383562,
    "traitStat": 0.09395109395109395,
    "trait_count": 73,
    "value": "Sage",
    "trait_type": "Background"
  }, {
    "traitScore": 14.94230769,
    "traitStat": 0.06692406692406692,
    "trait_count": 52,
    "value": "Bonehorn",
    "trait_type": "Horns"
  }]
}]
  .map(a => ({ ...a, traitsCount: a.traits?.length || 0 }))

const collectionTraitKeys = Object.keys(traits);

const allTraits = collectionTraitKeys.map(key => ({
  trait_type: `${key}`,
  trait_count: assets.filter(a => !a.traits.find(t => t.trait_type == key)).length,
  value: null//'Missing trait'
}))

// const fullTraitAssets = assets.map((asset: any) => ({
//   ...asset,
//   traits: [
//     ...asset.traits,
//     ...[
//       ...difference(collectionTraitKeys, asset.traits.map((t: any) => t.trait_type)).map((t: any) => missingTraits.find((m) => m.trait_type === t)),
//       {
//         trait_type: 'traitCount',
//         trait_count: assets.filter((a: any) => a.traitsCount === asset.traitsCount).length,
//         value: asset.traitsCount // 'Missing trait'
//       }
//     ]
//   ]
// }))


for (const asset of assets) {
  const assetTraitKeys = asset.traits.map(t => t.trait_type);
  const diff = R.difference(collectionTraitKeys, assetTraitKeys);
  const extraTraits = [
    ...diff.map((t: any) => allTraits.find((m) => m.trait_type === t)),
    {
      trait_type: 'traitCount',
      trait_count: assets.filter(a => a.traitsCount === asset.traitsCount).length,
      value: asset.traitsCount//'Missing trait'
    }];
  asset.traits = [...asset.traits as any, ...extraTraits as any];
}
// for (const asset of assets) {
//   const assetTraitKeys = asset.traits.map(t => t.trait_type);
//   const diff = R.difference(collectionTraitKeys, assetTraitKeys);
//   const missingTraits = [
//     ...diff.map((t: any) => missingTraits.find((m) => m.trait_type === t)),
//     {
//       trait_type: 'traitCount',
//       trait_count: assets.filter(a => a.traitsCount === asset.traitsCount).length,
//       value: asset.traitsCount//'Missing trait'
//     }];
//   asset.traits = [...asset.traits as any, ...missingTraits as any];
// }

console.log(JSON.stringify(assets, null, 3));
