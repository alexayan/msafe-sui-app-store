import { CancelStreamIntentionData, TransactionType } from '@msafe/sui3-utils';
import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { WalletAccount } from '@mysten/wallet-standard';

import { SuiNetworks } from '@/types';

import { StreamIntention } from './intention';
import { StreamTransactionType } from './types/decode';

export class CancelStreamIntention extends StreamIntention<CancelStreamIntentionData> {
  txType = TransactionType.Stream;

  txSubType = StreamTransactionType.CANCEL;

  constructor(public readonly data: CancelStreamIntentionData) {
    super(data);
  }

  async build(input: {
    network: SuiNetworks;
    suiClient: SuiClient;
    account: WalletAccount;
  }): Promise<TransactionBlock> {
    const { network, account } = input;
    const mpayClient = this.getClient(network, account);
    const stream = await mpayClient.getStream(this.data.streamId);
    return stream.cancel();
  }
}
