import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

export type TicketWrapper = {
  message: string;
  messageWithNonce: string;
  signature: string;
  ticket: string;
};

export async function generateNamedTicket(
  hre: HardhatRuntimeEnvironment,
  signer: SignerWithAddress,
  account: string,
  nonceGroup: number
): Promise<TicketWrapper> {
  const { solidityKeccak256, solidityPack, arrayify } = hre.ethers.utils;

  const salt = solidityPack(['address'], [account]);

  const message = solidityKeccak256(['bytes'], [arrayify(salt)]);

  const packed = solidityPack(['bytes32', 'uint256'], [message, nonceGroup]);

  const messageToBeSigned = solidityKeccak256(['bytes'], [arrayify(packed)]);

  const signature = await signer.signMessage(arrayify(messageToBeSigned));

  return {
    message,
    messageWithNonce: messageToBeSigned,
    signature,
    ticket: signature,
  };
}

export async function generateAnonymousTicket(
  hre: HardhatRuntimeEnvironment,
  signer: SignerWithAddress,
  nonceGroup: number
): Promise<TicketWrapper> {
  const { solidityKeccak256, solidityPack, arrayify } = hre.ethers.utils;

  const salt = solidityPack(
    ['string'],
    [`sismo_${Math.floor(100000000 * Math.random())}`]
  );

  const message = solidityKeccak256(['bytes'], [arrayify(salt)]);

  const packed = solidityPack(['bytes32', 'uint256'], [message, nonceGroup]);

  const messageToBeSigned = solidityKeccak256(['bytes'], [arrayify(packed)]);

  const signature = await signer.signMessage(arrayify(messageToBeSigned));

  return {
    message,
    messageWithNonce: messageToBeSigned,
    signature,
    ticket: `${message}${signature.substr(2)}`,
  };
}

export async function getDailyNonceGroup(
  hre: HardhatRuntimeEnvironment
): Promise<number> {
  const latestBlock = await hre.ethers.provider.getBlock('latest');
  const currentDay = Math.floor(latestBlock.timestamp / 86400);
  return currentDay;
}
