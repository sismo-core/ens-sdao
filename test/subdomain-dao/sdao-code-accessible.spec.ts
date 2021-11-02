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
  SDaoRegistrarPresetCodeAccessible,
} from '../../types';
import { expectEvent, evmSnapshot, evmRevert } from '../helpers';
import {
  DeployedEns,
  DeployedSDaoPresetCodeAccessible,
  generateEIP712AccessCode,
  getWeeklyGroupId,
  WrappedAccessCode,
} from '../../tasks';

describe('SDAO Registrar - Limited Code Accessible', () => {
  const utils = ethers.utils;
  const year = 365 * 24 * 60 * 60;
  const sismoLabel = 'sismo';

  const label = 'first';
  const domain = `${label}.${sismoLabel}.eth`;

  const getLabelhash = (label: string) =>
    utils.keccak256(utils.toUtf8Bytes(label));

  const domainName = 'Sismo App';
  const domainVersion = '1.0';

  let registrar: EthRegistrar;
  let reverseRegistrar: ReverseRegistrar;
  let registry: ENSRegistry;
  let publicResolver: PublicResolver;
  let sDaoRegistrar: SDaoRegistrarPresetCodeAccessible;
  let ens: ENS;

  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let signer3: SignerWithAddress;

  let snapshotId: string;

  let wrappedAccessCode: WrappedAccessCode;
  let groupId: number;
  let chainId: number;

  before(async () => {
    groupId = await getWeeklyGroupId(HRE);
    chainId = Number(await HRE.getChainId());

    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full');
    ({ registry, reverseRegistrar, publicResolver, registrar } = deployedENS);

    const deployedSDao: DeployedSDaoPresetCodeAccessible = await HRE.run(
      'deploy-sdao-preset-code-accessible',
      {
        name: sismoLabel,
        ens: registry.address,
        resolver: publicResolver.address,
        reverseRegistrar: reverseRegistrar.address,
        domainName,
        domainVersion,
        initialGroupId: groupId,
      }
    );
    ({ sDaoRegistrar } = deployedSDao);

    ens = await new ENS({
      provider: HRE.ethers.provider,
      ensAddress: registry.address,
    });

    [ownerSigner, signer1, signer2, signer3] = await HRE.ethers.getSigners();

    // The <sismoLabel>.eth is given to the registrar
    await registrar.register(
      getLabelhash(sismoLabel),
      ownerSigner.address,
      year
    );
    await ens.name(`${sismoLabel}.eth`).setOwner(sDaoRegistrar.address);

    snapshotId = await evmSnapshot(HRE);

    wrappedAccessCode = await generateEIP712AccessCode({
      signer: ownerSigner,
      recipient: signer1.address,
      groupId,
      verifyingContract: sDaoRegistrar.address,
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
    const tx = await sDaoRegistrar.registerWithAccessCode(
      label,
      signer1.address,
      wrappedAccessCode.accessCode
    );

    expectEvent(
      await tx.wait(),
      'AccessCodeConsumed',
      (args) =>
        args.groupId.toNumber() === groupId &&
        args.accessCode === wrappedAccessCode.accessCode
    );
    expect(await ens.name(domain).getAddress()).to.be.equal(signer1.address);
    expect(await sDaoRegistrar._consumed(wrappedAccessCode.digest)).to.equal(
      true
    );
  });

  it('user is not able to register with a access code signed for another address', async () => {
    await expect(
      sDaoRegistrar.registerWithAccessCode(
        label,
        signer2.address,
        wrappedAccessCode.accessCode
      )
    ).to.be.revertedWith(
      'SDAO_REGISTRAR_LIMITED_CODE_ACCESSIBLE: INVALID_ACCESS_CODE OR INVALID_SENDER'
    );
  });

  it('user is not able to register with an outdated access code', async () => {
    const wrappedAccessCode = await generateEIP712AccessCode({
      signer: ownerSigner,
      recipient: signer1.address,
      groupId: groupId - 1,
      verifyingContract: sDaoRegistrar.address,
      name: domainName,
      version: domainVersion,
      chainId,
    });
    await expect(
      sDaoRegistrar.registerWithAccessCode(
        label,
        signer1.address,
        wrappedAccessCode.accessCode
      )
    ).to.be.revertedWith(
      'SDAO_REGISTRAR_LIMITED_CODE_ACCESSIBLE: INVALID_ACCESS_CODE OR INVALID_SENDER'
    );
  });

  it('user is not able to register with an already consumed access code', async () => {
    await sDaoRegistrar.registerWithAccessCode(
      label,
      signer1.address,
      wrappedAccessCode.accessCode
    );
    await expect(
      sDaoRegistrar.registerWithAccessCode(
        label,
        signer1.address,
        wrappedAccessCode.accessCode
      )
    ).to.be.revertedWith(
      'SDAO_REGISTRAR_LIMITED_CODE_ACCESSIBLE: ACCESS_CODE_ALREADY_CONSUMED'
    );
  });

  it(`owner is able to modify the code signer`, async () => {
    const tx = await sDaoRegistrar.updateCodeSigner(signer3.address);
    expectEvent(
      await tx.wait(),
      'CodeSignerUpdated',
      (args) => args.codeSigner === signer3.address
    );
    expect(await sDaoRegistrar._codeSigner()).to.equal(signer3.address);
    await expect(
      sDaoRegistrar.registerWithAccessCode(
        label,
        signer2.address,
        wrappedAccessCode.accessCode
      )
    ).to.be.revertedWith(
      'SDAO_REGISTRAR_LIMITED_CODE_ACCESSIBLE: INVALID_ACCESS_CODE OR INVALID_SENDER'
    );
    const otherWrappedAccessCode = await generateEIP712AccessCode({
      signer: signer3,
      recipient: signer2.address,
      groupId: groupId,
      verifyingContract: sDaoRegistrar.address,
      name: domainName,
      version: domainVersion,
      chainId,
    });

    await sDaoRegistrar.registerWithAccessCode(
      label,
      signer2.address,
      otherWrappedAccessCode.accessCode
    );

    expect(await ens.name(domain).getAddress()).to.be.equal(signer2.address);
  });
});
