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
  ENSDaoRegistrarPresetLimitedCodeAccessible,
} from '../types';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { expectEvent, evmSnapshot, evmRevert } from './helpers';
import {
  DeployedEns,
  DeployedEnsDaoLimitedCodeAccessible,
  generateEIP712AccessCode,
  getWeeklyGroupId,
  WrappedAccessCode,
} from '../tasks';

describe('ENS DAO Registrar - Limited Code Accessible Preset', () => {
  const utils = ethers.utils;
  const year = 365 * 24 * 60 * 60;
  const sismoLabel = 'sismo';

  const label = 'first';
  const domain = `${label}.${sismoLabel}.eth`;
  const node = nameHash.hash(domain);

  const getLabelhash = (label: string) =>
    utils.keccak256(utils.toUtf8Bytes(label));

  const domainName = 'Sismo App';
  const domainVersion = '1.0';

  let registrar: EthRegistrar;
  let reverseRegistrar: ReverseRegistrar;
  let registry: ENSRegistry;
  let publicResolver: PublicResolver;
  let ensDaoToken: ENSDaoToken;
  let ensDaoRegistrar: ENSDaoRegistrarPresetLimitedCodeAccessible;
  let ens: ENS;

  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;

  let snapshotId: string;

  let wrappedAccessCode: WrappedAccessCode;
  let groupId: number;
  let chainId: number;

  before(async () => {
    groupId = await getWeeklyGroupId(HRE);
    chainId = Number(await HRE.getChainId());

    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full');
    ({ registry, reverseRegistrar, publicResolver, registrar } = deployedENS);

    const deployedEnsDao: DeployedEnsDaoLimitedCodeAccessible = await HRE.run(
      'deploy-ens-dao-limited-code-accessible',
      {
        name: sismoLabel,
        symbol: 'SISMO',
        ens: registry.address,
        resolver: publicResolver.address,
        nameWrapper: ethers.constants.AddressZero,
        reverseRegistrar: reverseRegistrar.address,
        domainName,
        domainVersion,
        initialGroupId: groupId,
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

    wrappedAccessCode = await generateEIP712AccessCode({
      signer: ownerSigner,
      recipient: signer1.address,
      groupId,
      verifyingContract: ensDaoRegistrar.address,
      name: domainName,
      version: domainVersion,
      chainId,
    });
  });

  afterEach(async () => {
    await evmRevert(HRE, snapshotId);
    snapshotId = await evmSnapshot(HRE);
  });

  it('user is able to register with a valid access code', async () => {
    const tx = await ensDaoRegistrar
      .connect(signer1)
      .registerWithAccessCode(label, wrappedAccessCode.accessCode);
    expectEvent(
      await tx.wait(),
      'AccessCodeConsumed',
      (args) =>
        args.groupId.toNumber() === groupId &&
        args.signedTicked === wrappedAccessCode.accessCode
    );
    expect(await ens.name(domain).getAddress()).to.be.equal(signer1.address);
    expect(await ensDaoToken.ownerOf(node)).to.be.equal(signer1.address);
    expect(await ensDaoRegistrar._consumed(wrappedAccessCode.digest)).to.equal(
      true
    );
  });

  it('user is able to register with a valid access code when the registration limit is reached', async () => {
    await ensDaoRegistrar.updateRegistrationLimit(0);
    const tx = await ensDaoRegistrar
      .connect(signer1)
      .registerWithAccessCode(label, wrappedAccessCode.accessCode);
    expectEvent(
      await tx.wait(),
      'AccessCodeConsumed',
      (args) =>
        args.groupId.toNumber() === groupId &&
        args.signedTicked === wrappedAccessCode.accessCode
    );
    expectEvent(
      await tx.wait(),
      'RegistrationLimitUpdated',
      (args) => args.registrationLimit.toNumber() === 1
    );
    const updatedRegistrationLimit = await ensDaoRegistrar._registrationLimit();
    expect(updatedRegistrationLimit.toNumber()).to.equal(1);
  });

  it('user is not able to register with a access code signed for another address', async () => {
    await expect(
      ensDaoRegistrar
        .connect(signer2)
        .registerWithAccessCode(label, wrappedAccessCode.accessCode)
    ).to.be.revertedWith(
      'ENS_DAO_REGISTRAR_LIMITED_CODE_ACCESSIBLE: INVALID_ACCESS_CODE OR INVALID_SENDER'
    );
  });

  it('user is not able to register with an outdated access code', async () => {
    const wrappedAccessCode = await generateEIP712AccessCode({
      signer: ownerSigner,
      recipient: signer1.address,
      groupId: groupId - 1,
      verifyingContract: ensDaoRegistrar.address,
      name: domainName,
      version: domainVersion,
      chainId,
    });
    await expect(
      ensDaoRegistrar
        .connect(signer2)
        .registerWithAccessCode(label, wrappedAccessCode.accessCode)
    ).to.be.revertedWith(
      'ENS_DAO_REGISTRAR_LIMITED_CODE_ACCESSIBLE: INVALID_ACCESS_CODE OR INVALID_SENDER'
    );
  });

  it('user is not able to register with an already consumed access code', async () => {
    await ensDaoRegistrar
      .connect(signer1)
      .registerWithAccessCode(label, wrappedAccessCode.accessCode);
    await expect(
      ensDaoRegistrar
        .connect(signer1)
        .registerWithAccessCode(label, wrappedAccessCode.accessCode)
    ).to.be.revertedWith(
      'ENS_DAO_REGISTRAR_LIMITED_CODE_ACCESSIBLE: ACCESS_CODE_ALREADY_CONSUMED'
    );
  });
});
