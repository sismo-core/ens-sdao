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
  ERC721Minter,
  SDaoRegistrarPresetERC721,
} from '../../types';
import { expectEvent, evmSnapshot, evmRevert } from '../helpers';
import { DeployedEns, DeployedSDaoPresetERC721 } from '../../tasks';

describe('SDAO Registrar - ERC721 Generator', () => {
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
  let erc721Token: ERC721Minter;
  let sDaoRegistrar: SDaoRegistrarPresetERC721;
  let ens: ENS;

  let ownerSigner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;

  let snapshotId: string;

  before(async () => {
    const deployedENS: DeployedEns = await HRE.run('deploy-ens-full', {
      deploymentName: 'ENS_ERC721_EXTENSION_TEST_SUITE',
    });
    ({ registry, reverseRegistrar, publicResolver, registrar } = deployedENS);

    const deployedSDao: DeployedSDaoPresetERC721 = await HRE.run(
      'deploy-sdao-preset-erc721',
      {
        name: sismoLabel,
        symbol: 'SISMO',
        ens: registry.address,
        resolver: publicResolver.address,
        reverseRegistrar: reverseRegistrar.address,
      }
    );
    ({ erc721Token, sDaoRegistrar } = deployedSDao);

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
    await ens.name(`${sismoLabel}.eth`).setOwner(sDaoRegistrar.address);

    snapshotId = await evmSnapshot(HRE);
  });

  afterEach(async () => {
    await evmRevert(HRE, snapshotId);
    snapshotId = await evmSnapshot(HRE);
  });

  it(`user receives an ERC721 token when registering`, async () => {
    const tx = await sDaoRegistrar.connect(signer2).register(label);
    expectEvent(
      await tx.wait(),
      'NameRegistered',
      (args) =>
        args.owner === signer2.address &&
        args.id.toHexString() === node &&
        args.label === label &&
        args.registrant === signer2.address
    );
    expect(await ens.name(domain).getAddress()).to.be.equal(signer2.address);
    expect(await erc721Token.ownerOf(node)).to.be.equal(signer2.address);
  });

  it(`user can not register if owner of a DAO token`, async () => {
    const otherLabel = 'second';
    await sDaoRegistrar.connect(signer1).register(label);
    await expect(
      sDaoRegistrar.connect(signer1).register(otherLabel)
    ).to.be.revertedWith(
      'SDAO_REGISTRAR_ERC721_GENERATOR: ALREADY_TOKEN_OWNER'
    );
  });

  it(`owner of the contract may register multiple subdomains`, async () => {
    const otherLabel = 'second';
    const otherDomain = `${otherLabel}.${sismoLabel}.eth`;
    const otherNode = nameHash.hash(otherDomain);

    await sDaoRegistrar.register(label);
    await sDaoRegistrar.register(otherLabel);

    expect(await ens.name(domain).getAddress()).to.be.equal(
      ownerSigner.address
    );
    expect(await erc721Token.ownerOf(node)).to.be.equal(ownerSigner.address);

    expect(await ens.name(otherDomain).getAddress()).to.be.equal(
      ownerSigner.address
    );
    expect(await erc721Token.ownerOf(otherNode)).to.be.equal(
      ownerSigner.address
    );
  });
});
