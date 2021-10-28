import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  getWeeklyGroupId,
  WrappedAccessCode,
  generateEIP712AccessCode,
} from '../utils';
import { getDeployer, logHre } from '../utils/hre-utils';

type GenerateAccessCodesArgs = {
  addresses?: string;
  contract?: string;
  log?: boolean;
};

type GeneratedAccessCodes = WrappedAccessCode[];

// ###### To be filled by signer ######

// To be filled with needed addresses
const defaultAddresses: string[] = [];

// Address of the ENS DAO Registrar
const defaultVerifyingContract = '';

const defaultDomainName = 'Sismo App';
const defaultDomainVersion = '1.0';
const defaultChainId = 1;

// ###### ###### ###### ###### ###### ###### ######

const defaultRawAddresses = JSON.stringify(defaultAddresses);

async function action(
  {
    addresses: rawAddresses = defaultRawAddresses,
    contract: verifyingContract = defaultVerifyingContract,
    log,
  }: GenerateAccessCodesArgs,
  hre: HardhatRuntimeEnvironment
): Promise<GeneratedAccessCodes> {
  if (log) await logHre(hre);

  const signer = await getDeployer(hre, log);

  let addresses: string[];
  try {
    addresses = JSON.parse(rawAddresses);
  } catch (err) {
    throw new Error('Invalid addresses arguments');
  }

  addresses.forEach((address) => {
    const isValidAddress = hre.ethers.utils.isAddress(address);
    if (!isValidAddress) {
      throw new Error('Invalid address in arguments');
    }
  });

  const groupId = await getWeeklyGroupId(hre);

  const wrappedAccessCodes = await Promise.all(
    addresses.map((address) =>
      generateEIP712AccessCode({
        signer,
        recipient: address,
        groupId,
        verifyingContract,
        name: defaultDomainName,
        version: defaultDomainVersion,
        chainId: defaultChainId,
      })
    )
  );

  if (log) {
    console.log('Wrapped Access Codes: ', wrappedAccessCodes);
  }

  return wrappedAccessCodes;
}

task('generate-access-codes')
  .addOptionalParam(
    'addresses',
    'array of addresses for generating named access codes'
  )
  .addOptionalParam('contract', 'verifying contract address')
  .addFlag('log', 'log')
  .setAction(action);
