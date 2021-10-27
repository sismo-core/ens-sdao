import { expect } from 'chai';
//@ts-ignore
import HRE from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
  EIP712_TICKET_TYPES,
  generateEIP712Ticket,
  getWeeklyGroupId,
} from '../tasks';

describe('Ticket Manager', () => {
  let ownerSigner: SignerWithAddress;
  let auxiliarySigner: SignerWithAddress;

  before(async () => {
    [ownerSigner, auxiliarySigner] = await HRE.ethers.getSigners();
  });

  it('should work', async () => {
    const SecretVerifierV2 = await HRE.ethers.getContractFactory(
      'SecretVerifierV2'
    );
    const secretVerifierV2 = await SecretVerifierV2.deploy();
    await secretVerifierV2.deployed();

    const groupId = await getWeeklyGroupId(HRE);

    const { domain, ticket, signature } = await generateEIP712Ticket({
      signer: ownerSigner,
      recipient: auxiliarySigner.address,
      groupId,
      verifyingContract: secretVerifierV2.address,
      name: 'Sismo App',
      version: '1.0',
      chainId: 1,
    });

    expect(
      HRE.ethers.utils.verifyTypedData(
        domain,
        EIP712_TICKET_TYPES,
        ticket,
        signature
      )
    ).to.equal(ownerSigner.address);

    await secretVerifierV2.test(
      signature,
      ownerSigner.address,
      auxiliarySigner.address,
      groupId
    );
  });
});
