import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

type EIP712Domain = {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
};

type Ticket = {
  recipient: string;
  groupId: number;
};

type GenerateEIP712Ticket = {
  signer: SignerWithAddress;
  recipient: string;
  groupId: number;
  verifyingContract: string;
  name?: string;
  version?: string;
  chainId?: number;
};

type SolidityTypes = Record<string, { name: string; type: string }[]>;

export type SignedTicket = {
  domain: EIP712Domain;
  ticket: Ticket;
  digest: string;
  signature: string;
};

export const EIP712_TICKET_TYPES: SolidityTypes = {
  Ticket: [
    { name: 'recipient', type: 'address' },
    { name: 'groupId', type: 'uint256' },
  ],
};
export const encodedTicketType = 'Ticket(address recipient,uint256 groupId)';
export const encodedDomainType =
  'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';

export async function generateEIP712Ticket({
  signer,
  recipient,
  groupId,
  verifyingContract,
  name = 'Sismo',
  version = '1',
  chainId = 1,
}: GenerateEIP712Ticket): Promise<SignedTicket> {
  const domain: EIP712Domain = {
    name,
    version,
    chainId,
    verifyingContract,
  };
  const ticket: Ticket = {
    recipient,
    groupId,
  };

  const signature = await signer._signTypedData(
    domain,
    EIP712_TICKET_TYPES,
    ticket
  );

  const digest = deriveTicketDigest(domain, ticket);

  return {
    domain,
    ticket,
    signature,
    digest,
  };
}

function deriveTicketDigest(domain: EIP712Domain, ticket: Ticket): string {
  const { solidityKeccak256, solidityPack, arrayify, defaultAbiCoder } =
    ethers.utils;

  const hashStr = (str: string) => {
    return solidityKeccak256(['string'], [str]);
  };

  const hashedTicketType = hashStr(encodedTicketType);
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

  const hashedTicket = solidityKeccak256(
    ['bytes'],
    [
      arrayify(
        defaultAbiCoder.encode(
          ['bytes32', 'address', 'uint256'],
          [hashedTicketType, ticket.recipient, ticket.groupId]
        )
      ),
    ]
  );

  const packedDigest = solidityPack(
    ['string', 'bytes32', 'bytes32'],
    ['\x19\x01', hashedDomain, hashedTicket]
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
