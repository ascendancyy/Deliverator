import Storage from 'src/Storage';
import { raceTimeout } from 'src/utils';

const SPEC_PATH = process.env.NODE_ENV === 'development' ?
  'https://rawgit.com/Bungie-net/api/master/openapi.json' :
  'https://cdn.rawgit.com/Bungie-net/api/4c0e5dd6/openapi.json';

function retrieveSpec() {
  return raceTimeout([new Promise(async (resolve) => {
    const localSpec = Storage.get('B.Net:spec', 'session');
    if (localSpec) {
      resolve(localSpec);
    } else {
      const resp = await fetch(SPEC_PATH);
      if (resp.ok) {
        const json = await resp.json();
        resolve(json);
        Storage.set('B.Net:spec', json, 'session');
      }
    }
  })], 4000);
}

export { retrieveSpec as default };
