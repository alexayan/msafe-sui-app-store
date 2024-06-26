import type { SuiObjectResponse, SuiObjectData } from '@mysten/sui.js/client';
import BigNumber from 'bignumber.js';

import type { ScallopQuery } from '../models';
import { Vesca } from '../types';

/**
 * Query all owned veSca key.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - The owner address.
 * @return Owned veSca key.
 */
export const getVescaKeys = async (query: ScallopQuery, ownerAddress?: string) => {
  const owner = ownerAddress;
  const veScaPkgId = query.address.get('vesca.id');
  const veScaKeyType = `${veScaPkgId}::ve_sca::VeScaKey`;
  const keyObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;
  do {
    const paginatedKeyObjectsResponse = await query.client.getOwnedObjects({
      owner,
      filter: {
        StructType: veScaKeyType,
      },
      cursor: nextCursor,
    });
    keyObjectsResponse.push(...paginatedKeyObjectsResponse.data);
    if (paginatedKeyObjectsResponse.hasNextPage && paginatedKeyObjectsResponse.nextCursor) {
      hasNextPage = true;
      nextCursor = paginatedKeyObjectsResponse.nextCursor;
    } else {
      hasNextPage = false;
    }
  } while (hasNextPage);

  const keyObjectDatas = keyObjectsResponse
    .map((objResponse) => objResponse.data)
    .filter((data) => !!data) as SuiObjectData[];
  return keyObjectDatas;
};

/**
 * Query all owned veSca.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - The owner address.
 * @return Owned veScas.
 */
export const getVeScas = async (query: ScallopQuery, ownerAddress?: string) => {
  const keyObjectDatas = await getVescaKeys(query, ownerAddress);
  const keyObjectId: string[] = keyObjectDatas.map((data) => data.objectId);

  const veScas: Vesca[] = [];
  for (let i = 0; i < keyObjectId.length; i++) {
    const veSca = await getVeSca(query, keyObjectId[i]);
    if (veSca) {
      veScas.push(veSca);
    }
  }
  return veScas;
};

/**
 * Get veSca data.
 *
 * @param query - The Scallop query instance.
 * @param veScaKeyId - The vesca key id.
 * @param ownerAddress - The owner address.
 * @returns Vesca data.
 */
export const getVeSca = async (query: ScallopQuery, veScaKeyId?: string, ownerAddress?: string) => {
  const tableId = query.address.get(`vesca.tableId`);
  const veScaKeyIdValue = veScaKeyId || (await getVescaKeys(query, ownerAddress))[0].objectId;

  let vesca: Vesca | undefined;

  const veScaDynamicFieldObjectResponse = await query.client.getDynamicFieldObject({
    parentId: tableId,
    name: {
      type: '0x2::object::ID',
      value: veScaKeyIdValue,
    },
  });
  const veScaDynamicFieldObject = veScaDynamicFieldObjectResponse.data;
  if (
    veScaDynamicFieldObject &&
    veScaDynamicFieldObject.content &&
    veScaDynamicFieldObject.content.dataType === 'moveObject' &&
    'fields' in veScaDynamicFieldObject.content
  ) {
    const dynamicFields = (veScaDynamicFieldObject.content.fields as any).value.fields;
    vesca = {
      id: veScaDynamicFieldObject.objectId,
      keyId: veScaKeyIdValue,
      lockedScaAmount: BigNumber(dynamicFields.locked_sca_amount).toNumber(),
      lockedScaCoin: BigNumber(dynamicFields.locked_sca_amount).shiftedBy(-9).toNumber(),
      unlockAt: BigNumber(dynamicFields.unlock_at).toNumber(),
    } as Vesca;
  }

  return vesca;
};
