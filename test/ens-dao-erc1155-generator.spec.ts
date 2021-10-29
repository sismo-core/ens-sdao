import { expect } from 'chai';
//@ts-ignore
import ENS from '@ensdomains/ensjs';
import HRE, { ethers } from 'hardhat';
//@ts-ignore
import nameHash from 'eth-ens-namehash';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import {
  ENSRegistry,
  EthRegistrar,
  ReverseRegistrar,
  PublicResolver,
  ERC1155Minter,
  ENSDaoRegistrarPresetERC1155Generator,
} from '../types';
import { expectEvent, evmSnapshot, evmRevert } from './helpers';
import { DeployedEns, DeployedEnsDaoERC1155Generator } from '../tasks';

describe('ENS DAO Registrar ERC1155 Generator', () => {
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
  let erc1155Token: ERC1155Minter;
  let ensDaoRegistrar: ENSDaoRegistrarPresetERC1155Generator;
  let ens: ENS;

  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;

  let snapshotId: string;

  before(async () => {
    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full');
    ({ registry, reverseRegistrar, publicResolver, registrar } = deployedENS);

    const deployedEnsDao: DeployedEnsDaoERC1155Generator = await HRE.run(
      'deploy-ens-dao-erc1155-generator',
      {
        name: sismoLabel,
        symbol: 'SISMO',
        ens: registry.address,
        resolver: publicResolver.address,
        reverseRegistrar: reverseRegistrar.address,
      }
    );
    ({ erc1155Token, ensDaoRegistrar } = deployedEnsDao);

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
  });

  afterEach(async () => {
    await evmRevert(HRE, snapshotId);
    snapshotId = await evmSnapshot(HRE);
  });

  it(`user receives an ERC1155 token when registering`, async () => {
    const tx = await ensDaoRegistrar.connect(signer2).register(label);
    expectEvent(
      await tx.wait(),
      'NameRegistered',
      (args) => args.owner === signer2.address && args.id.toHexString() === node
    );
    expect(await ens.name(domain).getAddress()).to.be.equal(signer2.address);
    expect(await erc1155Token.balanceOf(signer2.address, 0)).to.be.equal(1);
  });

  it(`user can not register if owner of an ERC1155 token`, async () => {
    const otherLabel = 'second';
    await ensDaoRegistrar.connect(signer1).register(label);
    await expect(
      ensDaoRegistrar.connect(signer1).register(otherLabel)
    ).to.be.revertedWith(
      'ENS_DAO_REGISTRAR_ERC1155_GENERATOR: ALREADY_TOKEN_OWNER'
    );
  });

  it(`owner of the contract may register multiple subdomains`, async () => {
    const otherLabel = 'second';
    const otherDomain = `${otherLabel}.${sismoLabel}.eth`;

    await ensDaoRegistrar.register(label);
    await ensDaoRegistrar.register(otherLabel);

    expect(await ens.name(domain).getAddress()).to.be.equal(
      ownerSigner.address
    );

    expect(await ens.name(otherDomain).getAddress()).to.be.equal(
      ownerSigner.address
    );
    expect(await erc1155Token.balanceOf(ownerSigner.address, 0)).to.be.equal(2);
  });
});
