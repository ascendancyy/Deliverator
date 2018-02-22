import _ from 'lodash';

import Paths from 'B.Net/Paths';
import Identifiers from 'B.Net/Identifiers';

import { prefixURL } from 'src/utils';

async function processItem({
  definitions,
  components,
  item,
  owner,
}) {
  const uniqueId = _.uniqueId('item_');
  const itemDef = await definitions.InventoryItem[item.itemHash];

  const {
    instances: { data: instances },
  } = components;
  const instance = instances[item.itemInstanceId] || {};

  let { icon } = itemDef.displayProperties;
  if (!itemDef.displayProperties.hasIcon) {
    icon = 'https://www.bungie.net/img/misc/missing_icon_d2.png';
  } else {
    icon = prefixURL(icon, Paths.BASE);
  }

  const bucket = await definitions.InventoryBucket[itemDef.inventory.bucketTypeHash];
  const currentBucket = await definitions.InventoryBucket[item.bucketHash];

  let damageType;
  ({ damageType } = instance);
  if (!damageType) {
    [damageType = 0] = itemDef.damageTypes || [];
  }

  const newItem = {
    id: item.itemInstanceId,
    uniqueId,
    hash: item.itemHash,

    owner,
    location: item.location,

    name: itemDef.displayProperties.name,
    description: itemDef.displayProperties.description,
    icon,

    canEquip: instance.canEquip || false,
    equippable: itemDef.equippable,
    transferStatus: item.transferStatus,
    nonTransferrable: itemDef.nonTransferrable,

    stackSize: item.quantity,

    bucket,
    currentBucket,

    inventory: Object.assign(itemDef.inventory, { bucket }),
    typeName: itemDef.itemTypeDisplayName,

    damageType,
  };

  const { primaryStat } = instance;
  if (primaryStat && bucket.hash !== Identifiers.BUCKET_BUILD) {
    newItem.primaryStat = primaryStat;
  }

  if (item.inventory && item.inventory.maxStackSize) {
    newItem.maxStackSize = item.inventory.maxStackSize;
  }

  if (bucket.scope === 1) {
    if (bucket.hash === currentBucket.hash && bucket.location === 0) {
      newItem.owner = 'account';
    }
  }

  return Object.seal(newItem);
}

export { processItem as default };
