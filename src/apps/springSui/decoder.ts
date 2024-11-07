import { TransactionType } from '@msafe/sui3-utils';
import { DevInspectResults } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

import { SpringSuiIntentionData } from './helper';
import { MintIntentionData } from './intentions/mint';
import { RedeemIntentionData } from './intentions/redeem';
import { TransactionSubType } from './types';

type DecodeResult = {
  txType: TransactionType;
  type: TransactionSubType;
  intentionData: SpringSuiIntentionData;
};

export class Decoder {
  constructor(
    public readonly transaction: Transaction,
    public readonly simResult: DevInspectResults,
  ) {}

  decode() {
    if (this.isMintTransaction()) {
      return this.decodeMint();
    }
    if (this.isRedeemTransaction()) {
      return this.decodeRedeem();
    }

    throw new Error(`Unknown transaction type`);
  }

  private get commands() {
    return this.transaction.getData().commands;
  }

  private getMoveCallCommand(fn: string) {
    return this.commands.find((command) => command.$kind === 'MoveCall' && command.MoveCall.function === fn);
  }

  // is*
  private isMintTransaction() {
    return !!this.getMoveCallCommand('mint');
  }

  private isRedeemTransaction() {
    return !!this.getMoveCallCommand('redeem');
  }

  // decode*
  private decodeMint(): DecodeResult {
    const events = {
      MintEvent: this.simResult.events.find((event) => event.type.endsWith('liquid_staking::MintEvent')),
    };

    const amount = (events.MintEvent.parsedJson as any).sui_amount_in as string;
    console.log('Decoder.decodeMint', amount);

    return {
      txType: TransactionType.Other,
      type: TransactionSubType.MINT,
      intentionData: {
        amount,
      } as MintIntentionData,
    };
  }

  private decodeRedeem(): DecodeResult {
    const events = {
      RedeemEvent: this.simResult.events.find((event) => event.type.endsWith('liquid_staking::RedeemEvent')),
    };

    const amount = (events.RedeemEvent.parsedJson as any).lst_amount_in as string;
    console.log('Decoder.decodeRedeem', amount);

    return {
      txType: TransactionType.Other,
      type: TransactionSubType.REDEEM,
      intentionData: {
        amount,
      } as RedeemIntentionData,
    };
  }
}
