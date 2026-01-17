/**
 * XDC Masternode Client
 * 
 * Interface for XDPoS (XinFin Delegated Proof of Stake) masternode operations.
 * XDC Network has 108 masternodes that validate transactions and propose blocks.
 */

import { ethers, Contract } from 'ethers';
import { XdcProvider } from './provider';
import { VALIDATOR_ABI } from '../constants/abis';
import { MAINNET_SYSTEM_CONTRACTS, APOTHEM_SYSTEM_CONTRACTS } from '../constants/contracts';
import { toEthAddress, toXdcAddress } from '../utils/addressUtils';
import { weiToXdc, xdcToWei } from '../utils/unitConverter';

/**
 * Masternode/Candidate information
 */
export interface MasternodeInfo {
	address: string;
	owner: string;
	stake: string;
	stakeXdc: string;
	voterCount: number;
	isValidator: boolean;
	status: 'active' | 'inactive' | 'proposed' | 'resigned';
}

/**
 * Voter information
 */
export interface VoterInfo {
	address: string;
	votedFor: string[];
	totalVoted: string;
	totalVotedXdc: string;
	rewards: string;
	rewardsXdc: string;
}

/**
 * Epoch information
 */
export interface EpochInfo {
	number: number;
	startBlock: number;
	endBlock: number;
	validatorSet: string[];
	rewards: string;
	rewardsXdc: string;
}

/**
 * Withdrawal info
 */
export interface WithdrawalInfo {
	blockNumber: number;
	amount: string;
	amountXdc: string;
	available: boolean;
}

/**
 * XDC Masternode Client
 */
export class XdcMasternodeClient {
	private provider: XdcProvider;
	private validatorContract: Contract;
	private chainId: number;
	
	constructor(provider: XdcProvider) {
		this.provider = provider;
		this.chainId = provider.getChainId();
		
		const contractAddress = this.chainId === 51
			? APOTHEM_SYSTEM_CONTRACTS.VALIDATOR.address
			: MAINNET_SYSTEM_CONTRACTS.VALIDATOR.address;
		
		this.validatorContract = provider.getContract(contractAddress, VALIDATOR_ABI);
	}
	
	// ==========================================
	// Read Methods
	// ==========================================
	
	/**
	 * Get all masternode candidates
	 */
	async getCandidates(): Promise<string[]> {
		const candidates = await this.validatorContract.getCandidates();
		return candidates.map((addr: string) => toXdcAddress(addr));
	}
	
	/**
	 * Get masternode candidate count
	 */
	async getCandidateCount(): Promise<number> {
		const count = await this.validatorContract.candidateCount();
		return Number(count);
	}
	
	/**
	 * Get masternode info
	 */
	async getMasternodeInfo(candidateAddress: string): Promise<MasternodeInfo> {
		const ethAddress = toEthAddress(candidateAddress);
		
		const [stake, owner, isCandidate, candidates] = await Promise.all([
			this.validatorContract.getCandidateCap(ethAddress),
			this.validatorContract.getCandidateOwner(ethAddress),
			this.validatorContract.isCandidate(ethAddress),
			this.validatorContract.getCandidates(),
		]);
		
		const voters = await this.getVotersForCandidate(candidateAddress);
		
		// Check if in active validator set
		const isValidator = candidates.map((a: string) => a.toLowerCase())
			.slice(0, 108)
			.includes(ethAddress.toLowerCase());
		
		return {
			address: toXdcAddress(candidateAddress),
			owner: toXdcAddress(owner),
			stake: stake.toString(),
			stakeXdc: weiToXdc(stake),
			voterCount: voters.length,
			isValidator,
			status: !isCandidate ? 'resigned' : isValidator ? 'active' : 'proposed',
		};
	}
	
	/**
	 * Check if address is a candidate
	 */
	async isCandidate(address: string): Promise<boolean> {
		return this.validatorContract.isCandidate(toEthAddress(address));
	}
	
	/**
	 * Get voters for a candidate
	 */
	async getVotersForCandidate(candidateAddress: string): Promise<string[]> {
		const voters = await this.validatorContract.getVoters(toEthAddress(candidateAddress));
		return voters.map((addr: string) => toXdcAddress(addr));
	}
	
	/**
	 * Get voter's stake for a candidate
	 */
	async getVoterStake(candidateAddress: string, voterAddress: string): Promise<{
		amount: string;
		amountXdc: string;
	}> {
		const stake = await this.validatorContract.getVoterCap(
			toEthAddress(candidateAddress),
			toEthAddress(voterAddress)
		);
		
		return {
			amount: stake.toString(),
			amountXdc: weiToXdc(stake),
		};
	}
	
	/**
	 * Get voter info
	 */
	async getVoterInfo(voterAddress: string): Promise<VoterInfo> {
		const ethAddress = toEthAddress(voterAddress);
		const candidates = await this.getCandidates();
		
		const votedFor: string[] = [];
		let totalVoted = 0n;
		
		// Check stake for each candidate
		for (const candidate of candidates) {
			try {
				const stake = await this.validatorContract.getVoterCap(
					toEthAddress(candidate),
					ethAddress
				);
				if (stake > 0n) {
					votedFor.push(candidate);
					totalVoted += stake;
				}
			} catch {
				// Skip if error
			}
		}
		
		return {
			address: toXdcAddress(voterAddress),
			votedFor,
			totalVoted: totalVoted.toString(),
			totalVotedXdc: weiToXdc(totalVoted),
			rewards: '0', // Would need additional tracking
			rewardsXdc: '0',
		};
	}
	
	/**
	 * Get minimum candidate stake requirement
	 */
	async getMinCandidateStake(): Promise<{
		amount: string;
		amountXdc: string;
	}> {
		const minStake = await this.validatorContract.minCandidateCap();
		return {
			amount: minStake.toString(),
			amountXdc: weiToXdc(minStake),
		};
	}
	
	/**
	 * Get minimum voter stake requirement
	 */
	async getMinVoterStake(): Promise<{
		amount: string;
		amountXdc: string;
	}> {
		const minStake = await this.validatorContract.minVoterCap();
		return {
			amount: minStake.toString(),
			amountXdc: weiToXdc(minStake),
		};
	}
	
	/**
	 * Get maximum number of validators
	 */
	async getMaxValidators(): Promise<number> {
		const max = await this.validatorContract.maxValidatorNumber();
		return Number(max);
	}
	
	/**
	 * Get candidate withdraw delay (in blocks)
	 */
	async getCandidateWithdrawDelay(): Promise<number> {
		const delay = await this.validatorContract.candidateWithdrawDelay();
		return Number(delay);
	}
	
	/**
	 * Get voter withdraw delay (in blocks)
	 */
	async getVoterWithdrawDelay(): Promise<number> {
		const delay = await this.validatorContract.voterWithdrawDelay();
		return Number(delay);
	}
	
	/**
	 * Get pending withdrawals for address
	 */
	async getWithdrawals(_address: string): Promise<WithdrawalInfo[]> {
		// _address parameter reserved for future address-specific filtering
		const currentBlock = await this.provider.getBlockNumber();
		const withdrawDelay = await this.getCandidateWithdrawDelay();
		
		const blockNumbers = await this.validatorContract.getWithdrawBlockNumbers();
		const withdrawals: WithdrawalInfo[] = [];
		
		for (let i = 0; i < blockNumbers.length; i++) {
			const blockNum = Number(blockNumbers[i]);
			const amount = await this.validatorContract.getWithdrawCap(blockNum);
			
			if (amount > 0n) {
				withdrawals.push({
					blockNumber: blockNum,
					amount: amount.toString(),
					amountXdc: weiToXdc(amount),
					available: currentBlock >= blockNum + withdrawDelay,
				});
			}
		}
		
		return withdrawals;
	}
	
	/**
	 * Get epoch info
	 */
	async getEpochInfo(epochNumber?: number): Promise<EpochInfo> {
		const currentBlock = await this.provider.getBlockNumber();
		const epochBlocks = 900; // XDC epoch length
		
		const epoch = epochNumber !== undefined 
			? epochNumber 
			: Math.floor(currentBlock / epochBlocks);
		
		const startBlock = epoch * epochBlocks;
		const endBlock = startBlock + epochBlocks - 1;
		
		// Get validators for this epoch
		const candidates = await this.getCandidates();
		const validatorSet = candidates.slice(0, 108);
		
		// Calculate rewards (0.25 XDC per block for 108 validators)
		const blocksInEpoch = Math.min(endBlock, currentBlock) - startBlock + 1;
		const rewardsWei = BigInt(blocksInEpoch) * ethers.parseEther('0.25');
		
		return {
			number: epoch,
			startBlock,
			endBlock,
			validatorSet,
			rewards: rewardsWei.toString(),
			rewardsXdc: weiToXdc(rewardsWei),
		};
	}
	
	/**
	 * Get current epoch number
	 */
	async getCurrentEpoch(): Promise<number> {
		const currentBlock = await this.provider.getBlockNumber();
		return Math.floor(currentBlock / 900);
	}
	
	/**
	 * Get masternodes list with details
	 */
	async getMasternodesList(limit: number = 108): Promise<MasternodeInfo[]> {
		const candidates = await this.getCandidates();
		const limitedCandidates = candidates.slice(0, limit);
		
		const masternodes = await Promise.all(
			limitedCandidates.map(addr => this.getMasternodeInfo(addr))
		);
		
		// Sort by stake descending
		return masternodes.sort((a, b) => {
			const stakeA = BigInt(a.stake);
			const stakeB = BigInt(b.stake);
			if (stakeA > stakeB) return -1;
			if (stakeA < stakeB) return 1;
			return 0;
		});
	}
	
	// ==========================================
	// Write Methods (require signer)
	// ==========================================
	
	/**
	 * Propose new masternode candidacy
	 */
	async propose(candidateAddress: string, stakeAmount: string): Promise<ethers.TransactionResponse> {
		if (!this.provider.hasSigner()) {
			throw new Error('Signer required to propose candidacy');
		}
		
		const writableContract = this.provider.getWritableContract(
			this.validatorContract.target as string,
			VALIDATOR_ABI
		);
		
		return writableContract.propose(toEthAddress(candidateAddress), {
			value: xdcToWei(stakeAmount),
		});
	}
	
	/**
	 * Vote for a candidate
	 */
	async vote(candidateAddress: string, amount: string): Promise<ethers.TransactionResponse> {
		if (!this.provider.hasSigner()) {
			throw new Error('Signer required to vote');
		}
		
		const writableContract = this.provider.getWritableContract(
			this.validatorContract.target as string,
			VALIDATOR_ABI
		);
		
		return writableContract.vote(toEthAddress(candidateAddress), {
			value: xdcToWei(amount),
		});
	}
	
	/**
	 * Unvote (remove stake) from candidate
	 */
	async unvote(candidateAddress: string, amount: string): Promise<ethers.TransactionResponse> {
		if (!this.provider.hasSigner()) {
			throw new Error('Signer required to unvote');
		}
		
		const writableContract = this.provider.getWritableContract(
			this.validatorContract.target as string,
			VALIDATOR_ABI
		);
		
		return writableContract.unvote(
			toEthAddress(candidateAddress),
			xdcToWei(amount)
		);
	}
	
	/**
	 * Resign from candidacy
	 */
	async resign(candidateAddress: string): Promise<ethers.TransactionResponse> {
		if (!this.provider.hasSigner()) {
			throw new Error('Signer required to resign');
		}
		
		const writableContract = this.provider.getWritableContract(
			this.validatorContract.target as string,
			VALIDATOR_ABI
		);
		
		return writableContract.resign(toEthAddress(candidateAddress));
	}
	
	/**
	 * Withdraw staked funds after delay period
	 */
	async withdraw(blockNumber: number, index: number): Promise<ethers.TransactionResponse> {
		if (!this.provider.hasSigner()) {
			throw new Error('Signer required to withdraw');
		}
		
		const writableContract = this.provider.getWritableContract(
			this.validatorContract.target as string,
			VALIDATOR_ABI
		);
		
		return writableContract.withdraw(blockNumber, index);
	}
	
	// ==========================================
	// Utility Methods
	// ==========================================
	
	/**
	 * Calculate estimated rewards for stake amount
	 */
	calculateEstimatedRewards(
		stakeAmount: string,
		totalNetworkStake: string,
		blocksPerYear: number = 15768000 // ~2s blocks
	): {
		daily: string;
		monthly: string;
		yearly: string;
		apy: string;
	} {
		const stake = BigInt(stakeAmount);
		const totalStake = BigInt(totalNetworkStake);
		
		if (totalStake === 0n) {
			return {
				daily: '0',
				monthly: '0',
				yearly: '0',
				apy: '0',
			};
		}
		
		// Block reward is 0.25 XDC, distributed among validators
		const rewardPerBlock = ethers.parseEther('0.25');
		const shareRatio = Number(stake) / Number(totalStake);
		
		const yearlyRewards = BigInt(blocksPerYear) * rewardPerBlock;
		const userYearlyRewards = BigInt(Math.floor(Number(yearlyRewards) * shareRatio));
		
		const dailyRewards = userYearlyRewards / 365n;
		const monthlyRewards = userYearlyRewards / 12n;
		
		const apy = (Number(userYearlyRewards) / Number(stake)) * 100;
		
		return {
			daily: weiToXdc(dailyRewards),
			monthly: weiToXdc(monthlyRewards),
			yearly: weiToXdc(userYearlyRewards),
			apy: apy.toFixed(2),
		};
	}
}

/**
 * Create masternode client from provider
 */
export function createMasternodeClient(provider: XdcProvider): XdcMasternodeClient {
	return new XdcMasternodeClient(provider);
}
