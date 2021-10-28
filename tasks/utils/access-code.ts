import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

type EIP712Domain = {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
};

type CodeOrigin = {
  recipient: string;
  groupId: number;
};

type GenerateEIP712AccessCode = {
  signer: SignerWithAddress;
  recipient: string;
  groupId: number;
  verifyingContract: string;
  name?: string;
  version?: string;
  chainId?: number;
};

type SolidityTypes = Record<string, { name: string; type: string }[]>;

export type WrappedAccessCode = {
  domain: EIP712Domain;
  origin: CodeOrigin;
  digest: string;
  accessCode: string;
};

export const EIP712_ACCESS_CODE_TYPES: SolidityTypes = {
  CodeOrigin: [
    { name: 'recipient', type: 'address' },
    { name: 'groupId', type: 'uint256' },
  ],
};
export const encodedCodeOriginType =
  'CodeOrigin(address recipient,uint256 groupId)';
export const encodedDomainType =
  'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';

export async function generateEIP712AccessCode({
  signer,
  recipient,
  groupId,
  verifyingContract,
  name = 'Sismo App',
  version = '1.0',
  chainId = 1,
}: GenerateEIP712AccessCode): Promise<WrappedAccessCode> {
  const domain: EIP712Domain = {
    name,
    version,
    chainId,
    verifyingContract,
  };
  const codeOrigin: CodeOrigin = {
    recipient,
    groupId,
  };

  const signature = await signer._signTypedData(
    domain,
    EIP712_ACCESS_CODE_TYPES,
    codeOrigin
  );

  const digest = deriveCodeDigest(domain, codeOrigin);

  return {
    domain,
    origin: codeOrigin,
    accessCode: signature,
    digest,
  };
}

function deriveCodeDigest(
  domain: EIP712Domain,
  codeOrigin: CodeOrigin
): string {
  const { solidityKeccak256, solidityPack, arrayify, defaultAbiCoder } =
    ethers.utils;

  const hashStr = (str: string) => {
    return solidityKeccak256(['string'], [str]);
  };

  const hashedCodeOriginType = hashStr(encodedCodeOriginType);
  const hashedDomainType = hashStr(encodedDomainType);

  const hashedDomain = solidityKeccak256(
    ['bytes'],
    [
      arrayify(
        defaultAbiCoder.encode(
          ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
          [
            hashedDomainType,
            hashStr(domain.name),
            hashStr(domain.version),
            domain.chainId,
            domain.verifyingContract,
          ]
        )
      ),
    ]
  );

  const hashedCodeOrigin = solidityKeccak256(
    ['bytes'],
    [
      arrayify(
        defaultAbiCoder.encode(
          ['bytes32', 'address', 'uint256'],
          [hashedCodeOriginType, codeOrigin.recipient, codeOrigin.groupId]
        )
      ),
    ]
  );

  const packedDigest = solidityPack(
    ['string', 'bytes32', 'bytes32'],
    ['\x19\x01', hashedDomain, hashedCodeOrigin]
  );

  const digest = solidityKeccak256(['bytes'], [arrayify(packedDigest)]);

  return digest;
}

export async function getWeeklyGroupId(
  hre: HardhatRuntimeEnvironment
): Promise<number> {
  const latestBlock = await hre.ethers.provider.getBlock('latest');
  const currentWeek = Math.floor(latestBlock.timestamp / 604800);
  return currentWeek;
}
