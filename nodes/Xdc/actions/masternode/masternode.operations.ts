import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createXdcProvider } from '../../transport/provider';
import { XdcMasternodeClient } from '../../transport/masternodeClient';
import { toXdcAddress, isValidXdcAddress } from '../../utils/addressUtils';
import { xdcToWei } from '../../utils/unitConverter';

export const masternodeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['masternode'] } },
		options: [
			{ name: 'Get All Candidates', value: 'getCandidates', description: 'Get list of masternode candidates', action: 'Get all candidates' },
			{ name: 'Get Masternode Info', value: 'getMasternodeInfo', description: 'Get specific masternode details', action: 'Get masternode info' },
			{ name: 'Get Epoch Info', value: 'getEpochInfo', description: 'Get current epoch information', action: 'Get epoch info' },
			{ name: 'Get Voter Info', value: 'getVoterInfo', description: 'Get voter stake information', action: 'Get voter info' },
			{ name: 'Calculate Rewards', value: 'calculateRewards', description: 'Estimate staking rewards', action: 'Calculate rewards' },
			{ name: 'Vote for Masternode', value: 'vote', description: 'Vote/stake for a masternode', action: 'Vote for masternode' },
			{ name: 'Unvote', value: 'unvote', description: 'Remove vote from masternode', action: 'Unvote from masternode' },
			{ name: 'Withdraw Stake', value: 'withdraw', description: 'Withdraw unstaked funds', action: 'Withdraw stake' },
		],
		default: 'getCandidates',
	},
];

export const masternodeFields: INodeProperties[] = [
	{
		displayName: 'Masternode Address',
		name: 'masternodeAddress',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['masternode'], operation: ['getMasternodeInfo', 'vote', 'unvote'] } },
		description: 'XDC address of the masternode',
	},
	{
		displayName: 'Voter Address',
		name: 'voterAddress',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['masternode'], operation: ['getVoterInfo'] } },
		description: 'Address of the voter',
	},
	{
		displayName: 'Stake Amount (XDC)',
		name: 'stakeAmount',
		type: 'string',
		default: '10000',
		displayOptions: { show: { resource: ['masternode'], operation: ['calculateRewards', 'vote'] } },
		description: 'Amount of XDC to stake',
	},
	{
		displayName: 'Unvote Amount (XDC)',
		name: 'unvoteAmount',
		type: 'string',
		default: '0',
		displayOptions: { show: { resource: ['masternode'], operation: ['unvote'] } },
		description: 'Amount to unvote (0 for all)',
	},
	{
		displayName: 'Block Number',
		name: 'withdrawBlockNumber',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['masternode'], operation: ['withdraw'] } },
		description: 'Block number for withdrawal',
	},
	{
		displayName: 'Withdrawal Index',
		name: 'withdrawIndex',
		type: 'number',
		default: 0,
		displayOptions: { show: { resource: ['masternode'], operation: ['withdraw'] } },
		description: 'Index of the withdrawal',
	},
];

export async function executeMasternodeOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const network = this.getNodeParameter('network', index, 'mainnet') as string;
	const credentials = await this.getCredentials('xdcNetwork');

	const provider = createXdcProvider({
		network,
		rpcUrl: credentials.rpcUrl as string,
		privateKey: credentials.privateKey as string,
	});
	const masternodeClient = new XdcMasternodeClient(provider);

	switch (operation) {
		case 'getCandidates': {
			const candidates = await masternodeClient.getCandidates();
			const count = await masternodeClient.getCandidateCount();
			return [{
				json: {
					totalCandidates: count,
					maxValidators: 108,
					candidates: candidates.slice(0, 50),
				},
			}];
		}

		case 'getMasternodeInfo': {
			const address = this.getNodeParameter('masternodeAddress', index) as string;
			if (!isValidXdcAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid masternode address');
			}
			const info = await masternodeClient.getMasternodeInfo(address);
			return [{
				json: {
					address: info.address,
					owner: info.owner,
					stake: info.stake,
					stakeXdc: info.stakeXdc,
					voterCount: info.voterCount,
					isValidator: info.isValidator,
					status: info.status,
				},
			}];
		}

		case 'getEpochInfo': {
			const epochInfo = await masternodeClient.getEpochInfo();
			const currentBlock = await provider.getBlockNumber();
			return [{
				json: {
					currentEpoch: epochInfo.number,
					startBlock: epochInfo.startBlock,
					endBlock: epochInfo.endBlock,
					blocksPerEpoch: 900,
					currentBlock,
					blocksRemaining: epochInfo.endBlock - currentBlock,
					validatorCount: epochInfo.validatorSet.length,
					rewards: epochInfo.rewardsXdc,
				},
			}];
		}

		case 'getVoterInfo': {
			const voterAddress = this.getNodeParameter('voterAddress', index) as string;
			if (!isValidXdcAddress(voterAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid voter address');
			}
			const info = await masternodeClient.getVoterInfo(voterAddress);
			return [{
				json: {
					voter: info.address,
					totalVoted: info.totalVoted,
					totalVotedXdc: info.totalVotedXdc,
					votedFor: info.votedFor,
					rewards: info.rewardsXdc,
				},
			}];
		}

		case 'calculateRewards': {
			const stakeAmount = this.getNodeParameter('stakeAmount', index) as string;
			// Get total network stake estimate (simplified - in production would query contract)
			const totalNetworkStake = xdcToWei('1000000000').toString(); // 1B XDC estimated total stake
			const stakeWei = xdcToWei(stakeAmount).toString();
			const rewards = masternodeClient.calculateEstimatedRewards(stakeWei, totalNetworkStake);
			return [{
				json: {
					stakeAmount,
					daily: rewards.daily,
					monthly: rewards.monthly,
					yearly: rewards.yearly,
					apy: rewards.apy + '%',
				},
			}];
		}

		case 'vote': {
			if (!credentials.privateKey) {
				throw new NodeOperationError(this.getNode(), 'Private key required for voting');
			}
			const masternodeAddress = this.getNodeParameter('masternodeAddress', index) as string;
			const stakeAmount = this.getNodeParameter('stakeAmount', index) as string;
			if (!isValidXdcAddress(masternodeAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid masternode address');
			}
			const tx = await masternodeClient.vote(masternodeAddress, stakeAmount);
			const receipt = await tx.wait();
			return [{
				json: {
					success: true,
					transactionHash: receipt?.hash ?? '',
					masternode: toXdcAddress(masternodeAddress),
					amount: stakeAmount,
					blockNumber: receipt?.blockNumber ?? 0,
				},
			}];
		}

		case 'unvote': {
			if (!credentials.privateKey) {
				throw new NodeOperationError(this.getNode(), 'Private key required for unvoting');
			}
			const masternodeAddress = this.getNodeParameter('masternodeAddress', index) as string;
			const unvoteAmount = this.getNodeParameter('unvoteAmount', index) as string;
			const tx = await masternodeClient.unvote(masternodeAddress, unvoteAmount);
			const receipt = await tx.wait();
			return [{
				json: {
					success: true,
					transactionHash: receipt?.hash ?? '',
					masternode: toXdcAddress(masternodeAddress),
					amount: unvoteAmount,
					blockNumber: receipt?.blockNumber ?? 0,
				},
			}];
		}

		case 'withdraw': {
			if (!credentials.privateKey) {
				throw new NodeOperationError(this.getNode(), 'Private key required for withdrawal');
			}
			const blockNumber = this.getNodeParameter('withdrawBlockNumber', index) as number;
			const withdrawIndex = this.getNodeParameter('withdrawIndex', index) as number;
			const tx = await masternodeClient.withdraw(blockNumber, withdrawIndex);
			const receipt = await tx.wait();
			return [{
				json: {
					success: true,
					transactionHash: receipt?.hash ?? '',
					blockNumber: receipt?.blockNumber ?? 0,
				},
			}];
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}
}
