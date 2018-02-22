import _ from 'lodash';

// ---------------------------------------
const proxied = [
  'InventoryBucket',
  'InventoryItem',
  'Stat',
  'Vendor',
];
const indexed = [
  'Class',
  'Gender',
  'Race',
];

// Manifest Access------------------------
let definitionPromise;
let definitionLanguage;

function getAllRecords(manifest, table) {
  const statement = manifest.prepare(`SELECT json FROM ${table}`);
  const collection = Object.create(null);
  return new Promise((resolve) => {
    while (statement.step()) {
      const definition = JSON.parse(statement.getAsObject().json);
      collection[definition.hash] = definition;
    }
    statement.free();
    resolve(Object.freeze(collection));
  });
}

const createStatement = _.memoize((table, manifest) => manifest.prepare(`SELECT json FROM ${table} WHERE id=?`));

function getRecord(manifest, table, hash) {
  return new Promise((resolve) => {
    const statement = createStatement(table, manifest);
    const { json } = statement.getAsObject([new Int32Array([hash])[0]]);

    statement.reset();
    resolve(json ? JSON.parse(json) : undefined);
  });
}

function addTable(defs, tableName, value) {
  Object.defineProperty(defs, tableName, {
    value,

    configurable: false,
    writable: false,
    enumerable: true,
  });
}

// ---------------------------------------
function retrieveDefinitions(language, manifest) {
  if (!definitionPromise || definitionLanguage !== language) {
    definitionLanguage = language;

    const definitionTables = Object.create(null);
    definitionPromise = new Promise(async (resolve) => {
      const indexedPromises = indexed.map(async (short) => {
        const records = getAllRecords(manifest, `Destiny${short}Definition`);
        addTable(definitionTables, short, await records);
      });

      proxied.forEach((short) => {
        addTable(definitionTables, short, new Proxy({}, {
          get(target, prop) {
            if (prop === 'then') { return undefined; }
            if (Object.prototype.hasOwnProperty.call(target, prop)) { return target[prop]; }

            const propVal = getRecord(manifest, `Destiny${short}Definition`, prop);
            // eslint-disable-next-line no-param-reassign
            target[prop] = propVal;
            return propVal;
          },
        }));
      });

      await Promise.all(indexedPromises);
      resolve(Object.freeze(definitionTables));
    });
  }
  return definitionPromise;
}

const Definitions = {
  retrieve: retrieveDefinitions,
  close: function closeDefinitions() {
    createStatement.cache.clear();
  },
};

export { Definitions as default };
