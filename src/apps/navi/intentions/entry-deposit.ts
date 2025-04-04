import { TransactionType } from '@msafe/sui3-utils';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { WalletAccount } from '@mysten/wallet-standard';

import { BaseIntentionLegacy } from '@/apps/interface/sui-js';

import { depositToken } from '../api/incentiveV2';
import { TransactionSubType } from '../types';
import { getTokenObjs } from '../utils/token';
import { getPoolConfigByAssetId } from '../utils/tools';

export interface EntryDepositIntentionData {
  amount: number;
  assetId: number;
}

export class EntryDepositIntention extends BaseIntentionLegacy<EntryDepositIntentionData> {
  txType: TransactionType.Other;

  txSubType: TransactionSubType.EntryDeposit;

  constructor(public readonly data: EntryDepositIntentionData) {
    super(data);
  }

  async build(input: { suiClient: SuiClient; account: WalletAccount }): Promise<TransactionBlock> {
    const { suiClient, account } = input;
    const { assetId, amount } = this.data;
    const tx = new TransactionBlock();
    console.log('build', this.data);

    const pool = getPoolConfigByAssetId(assetId);

    if (assetId === 0) {
      const [toDeposit] = tx.splitCoins(tx.gas, [amount]);
      const txb = await depositToken(tx, pool, toDeposit, amount);
      return txb;
    }

    const tokenInfo = await getTokenObjs(suiClient, account.address, pool.type);
    if (!tokenInfo.data[0]) {
      throw new Error(`Insufficient balance for ${pool.name} Token`);
    }

    const coinObj = tokenInfo.data[0].coinObjectId;

    if (tokenInfo.data.length >= 2) {
      let i = 1;
      while (i < tokenInfo.data.length) {
        tx.mergeCoins(coinObj, [tokenInfo.data[i].coinObjectId]);
        i++;
      }
    }

    const txb = await depositToken(tx, pool, tx.object(coinObj), amount);
    return txb;
  }

  static fromData(data: EntryDepositIntentionData) {
    return new EntryDepositIntention(data);
  }
}
