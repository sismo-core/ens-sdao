import { expect } from 'chai';
import { ContractReceipt } from '@ethersproject/contracts';

export function expectEvent(
  receipt: ContractReceipt,
  name: string,
  argsCondition: (args: any) => boolean
): void {
  const index = receipt.events?.findIndex((e) => {
    return e.event === name && argsCondition(e?.args);
  });
  expect(Number(index) >= 0);
}
