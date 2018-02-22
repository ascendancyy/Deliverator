import Paths from 'B.Net/Paths';

import { prefixURL } from 'src/utils';
import { rgbToHex } from 'src/utils/color';

async function processCharacter({ definitions, character }) {
  const classDef = definitions.Class[character.classHash];
  const raceDef = definitions.Race[character.raceHash];
  const genderDef = definitions.Gender[character.genderHash];
  const { displayProperties: { name: class_ } } = await classDef;
  const { displayProperties: { name: race } } = await raceDef;
  const { displayProperties: { name: gender } } = await genderDef;

  return Object.seal({
    id: character.characterId,
    dateLastPlayed: character.dateLastPlayed,

    race,
    gender,
    class: class_,

    light: character.light,
    baseCharacterLevel: character.baseCharacterLevel,

    emblemPath: prefixURL(character.emblemPath, Paths.BASE),
    backgroundPath: prefixURL(character.emblemBackgroundPath, Paths.BASE),
    emblemColor: rgbToHex(character.emblemColor),
  });
}

export { processCharacter as default };
