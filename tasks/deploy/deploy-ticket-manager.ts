import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
//@ts-ignore
import { getDeployer, logHre } from '../utils';
import { TicketManager, TicketManager__factory } from '../../types';

type DeployTicketManager = {
  // owner address of the contracts
  owner?: string;
  // maximum daily consumption of ticket
  ticketGroupLimit?: number;
  // enabling logging
  log?: boolean;
};

export type DeployedTicketManager = {
  ticketManager: TicketManager;
};

async function deploiementAction(
  { owner: optionalOwner, ticketGroupLimit = 30, log }: DeployTicketManager,
  hre: HardhatRuntimeEnvironment
): Promise<DeployedTicketManager> {
  if (log) await logHre(hre);

  const deployer = await getDeployer(hre, log);

  const owner = optionalOwner || deployer.address;

  const deployedTicketManager = await hre.deployments.deploy('TicketManager', {
    from: deployer.address,
    args: [ticketGroupLimit, owner],
  });

  const ticketManager = TicketManager__factory.connect(
    deployedTicketManager.address,
    deployer
  );

  if (log) {
    console.log(`Deployed Ticket Booker: ${deployedTicketManager.address}`);
  }

  return {
    ticketManager,
  };
}

task('deploy-ticket-manager')
  .addOptionalParam('owner', 'owner')
  .addFlag('log', 'log')
  .addFlag('verify', 'Verify Etherscan Contract')
  .setAction(deploiementAction);
