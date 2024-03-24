import type { SerializedBcs } from '@mysten/bcs';
import { ObjectArg, SharedObjectRef } from '@mysten/sui.js/bcs';
import type { SuiObjectRef } from '@mysten/sui.js/client';
import type { TransactionArgument, TransactionObjectArgument } from '@mysten/sui.js/transactions';

import type { SupportAssetCoins } from './constant';

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type CoinPrices = OptionalKeys<Record<SupportAssetCoins, number>>;

export type PriceMap = Map<
  SupportAssetCoins,
  {
    price: number;
    publishTime: number;
  }
>;

export type PureCallArg = {
  Pure: number[];
};

export type ObjectCallArg = {
  Object: ObjectArg;
};

export type SuiAddressArg = TransactionArgument | SerializedBcs<any> | string | PureCallArg;
export type SuiObjectArg = TransactionObjectArgument | string | SharedObjectRef | SuiObjectRef | ObjectCallArg;
export type SuiTxArg = SuiAddressArg | number | bigint | boolean;
