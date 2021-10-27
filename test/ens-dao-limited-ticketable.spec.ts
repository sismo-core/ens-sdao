import { expect } from 'chai';
//@ts-ignore
import ENS from '@ensdomains/ensjs';
import HRE, { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
  ENSRegistry,
  EthRegistrar,
  ReverseRegistrar,
  PublicResolver,
  ENSDaoToken,
  ENSDaoRegistrarPresetLimitedTicketable,
} from '../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { expectEvent, evmSnapshot, evmRevert } from './helpers';
import {
  DeployedEns,
  DeployedEnsDaoLimitedTicketable,
  generateEIP712Ticket,
  getWeeklyGroupId,
  SignedTicket,
} from '../tasks';

describe('ENS DAO Registrar - Limited Ticketable Preset', () => {
  const utils = ethers.utils;
  const year = 365 * 24 * 60 * 60;
  const sismoLabel = 'sismo';

  const label = 'first';
  const domain = `${label}.${sismoLabel}.eth`;
  const node = nameHash.hash(domain);

  const getLabelhash = (label: string) =>
    utils.keccak256(utils.toUtf8Bytes(label));

  let registrar: EthRegistrar;
  let reverseRegistrar: ReverseRegistrar;
  let registry: ENSRegistry;
  let publicResolver: PublicResolver;
  let ensDaoToken: ENSDaoToken;
  let ensDaoRegistrar: ENSDaoRegistrarPresetLimitedTicketable;
  let ens: ENS;

  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;

  let snapshotId: string;

  let ticket: SignedTicket;
  let groupId: number;

  before(async () => {
    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full');
    ({ registry, reverseRegistrar, publicResolver, registrar } = deployedENS);

    const deployedEnsDao: DeployedEnsDaoLimitedTicketable = await HRE.run(
      'deploy-ens-dao-limited-ticketable',
      {
        name: sismoLabel,
        symbol: 'SISMO',
        ens: registry.address,
        resolver: publicResolver.address,
        nameWrapper: ethers.constants.AddressZero,
        reverseRegistrar: reverseRegistrar.address,
      }
    );
    ({ ensDaoToken, ensDaoRegistrar } = deployedEnsDao);

    ens = await new ENS({
      provider: HRE.ethers.provider,
      ensAddress: registry.address,
    });

    [ownerSigner, signer1, signer2] = await HRE.ethers.getSigners();

    // The <sismoLabel>.eth is given to the registrar
    await registrar.register(
      getLabelhash(sismoLabel),
      ownerSigner.address,
      year
    );
    await ens.name(`${sismoLabel}.eth`).setOwner(ensDaoRegistrar.address);

    snapshotId = await evmSnapshot(HRE);

    groupId = await getWeeklyGroupId(HRE);
    ticket = await generateEIP712Ticket({
      signer: ownerSigner,
      recipient: signer1.address,
      groupId,
      verifyingContract: ensDaoRegistrar.address,
      name: 'Sismo App',
      version: '1.0',
      chainId: 1,
    });
  });

  afterEach(async () => {
    await evmRevert(HRE, snapshotId);
    snapshotId = await evmSnapshot(HRE);
  });

  it('user is able to register with a valid ticket', async () => {
    const tx = await ensDaoRegistrar
      .connect(signer1)
      .registerWithTicket(label, ticket.signature);
    expectEvent(
      await tx.wait(),
      'TicketConsumed',
      (args) =>
        args.groupId.toNumber() === groupId &&
        args.signedTicked === ticket.signature
    );
    expect(await ens.name(domain).getAddress()).to.be.equal(signer1.address);
    expect(await ensDaoToken.ownerOf(node)).to.be.equal(signer1.address);
    expect(await ensDaoRegistrar._consumed(ticket.digest)).to.equal(true);
  });

  it('user is able to register with a valid ticket when the registration limit is reached', async () => {
    await ensDaoRegistrar.updateRegistrationLimit(0);
    const tx = await ensDaoRegistrar
      .connect(signer1)
      .registerWithTicket(label, ticket.signature);
    expectEvent(
      await tx.wait(),
      'TicketConsumed',
      (args) =>
        args.groupId.toNumber() === groupId &&
        args.signedTicked === ticket.signature
    );
    expectEvent(
      await tx.wait(),
      'RegistrationLimitUpdated',
      (args) => args.registrationLimit.toNumber() === 1
    );
    const updatedRegistrationLimit = await ensDaoRegistrar._registrationLimit();
    expect(updatedRegistrationLimit.toNumber()).to.equal(1);
  });

  it('user is not able to register with a ticket signed for another address', async () => {
    await expect(
      ensDaoRegistrar
        .connect(signer2)
        .registerWithTicket(label, ticket.signature)
    ).to.be.revertedWith(
      'ENS_DAO_REGISTRAR_TICKETABLE: INVALID_TICKET OR INVALID_SENDER'
    );
  });

  it('user is not able to register with an outdated ticket', async () => {
    const ticket = await generateEIP712Ticket({
      signer: ownerSigner,
      recipient: signer1.address,
      groupId: groupId - 1,
      verifyingContract: ensDaoRegistrar.address,
      name: 'Sismo App',
      version: '1.0',
      chainId: 1,
    });
    await expect(
      ensDaoRegistrar
        .connect(signer2)
        .registerWithTicket(label, ticket.signature)
    ).to.be.revertedWith(
      'ENS_DAO_REGISTRAR_TICKETABLE: INVALID_TICKET OR INVALID_SENDER'
    );
  });

  it('user is not able to register with an already consumed ticket', async () => {
    await ensDaoRegistrar
      .connect(signer1)
      .registerWithTicket(label, ticket.signature);
    await expect(
      ensDaoRegistrar
        .connect(signer1)
        .registerWithTicket(label, ticket.signature)
    ).to.be.revertedWith(
      'ENS_DAO_REGISTRAR_TICKETABLE: TICKET_ALREADY_CONSUMED'
    );
  });
});
