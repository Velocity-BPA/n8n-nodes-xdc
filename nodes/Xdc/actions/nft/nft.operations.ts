/**
 * XDC Network - XRC-721 NFT Resource Operations
 * 
 * Handles all NFT (Non-Fungible Token) operations including metadata retrieval,
 * ownership queries, transfers, and approvals.
 * 
 * XRC-721 is XDC's equivalent to ERC-721 on Ethereum.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import axios from 'axios';
import { createXdcProvider } from '../../transport/provider';
import { XdcExplorerApi } from '../../transport/explorerApi';
import { toEthAddress, toXdcAddress, isValidXdcAddress } from '../../utils/addressUtils';
import { ABIS } from '../../constants/abis';

// NFT resource operations definition
export const nftOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['nft'],
			},
		},
		options: [
			{
				name: 'Approve NFT',
				value: 'approveNft',
				description: 'Approve an address to transfer a specific NFT',
				action: 'Approve NFT transfer',
			},
			{
				name: 'Get Approved Address',
				value: 'getApprovedAddress',
				description: 'Get the approved address for an NFT',
				action: 'Get approved address for NFT',
			},
			{
				name: 'Get Collection Info',
				value: 'getCollectionInfo',
				description: 'Get NFT collection information',
				action: 'Get NFT collection info',
			},
			{
				name: 'Get NFT Metadata',
				value: 'getNftMetadata',
				description: 'Get NFT metadata including token URI and attributes',
				action: 'Get NFT metadata',
			},
			{
				name: 'Get NFT Owner',
				value: 'getNftOwner',
				description: 'Get the current owner of an NFT',
				action: 'Get NFT owner',
			},
			{
				name: 'Get NFT Transfers',
				value: 'getNftTransfers',
				description: 'Get transfer history for NFTs',
				action: 'Get NFT transfers',
			},
			{
				name: 'Get NFTs by Owner',
				value: 'getNftsByOwner',
				description: 'Get all NFTs owned by an address',
				action: 'Get NFTs by owner',
			},
			{
				name: 'Set Approval for All',
				value: 'setApprovalForAll',
				description: 'Approve or revoke operator status for all NFTs',
				action: 'Set approval for all',
			},
			{
				name: 'Transfer NFT',
				value: 'transferNft',
				description: 'Transfer an NFT to another address',
				action: 'Transfer NFT',
			},
		],
		default: 'getNftMetadata',
	},
];

// NFT resource fields
export const nftFields: INodeProperties[] = [
	// NFT contract address field
	{
		displayName: 'NFT Contract Address',
		name: 'nftAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The XRC-721 NFT contract address',
		displayOptions: {
			show: {
				resource: ['nft'],
			},
		},
	},

	// Token ID field
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1',
		description: 'The unique identifier of the NFT',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNftMetadata', 'getNftOwner', 'transferNft', 'approveNft', 'getApprovedAddress'],
			},
		},
	},

	// Owner address field
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The wallet address to check for NFT ownership',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNftsByOwner', 'getNftTransfers'],
			},
		},
	},

	// Transfer fields
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The address to transfer the NFT from (must be owner or approved)',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transferNft'],
			},
		},
	},
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The recipient address',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transferNft', 'approveNft'],
			},
		},
	},

	// Set approval for all fields
	{
		displayName: 'Operator Address',
		name: 'operatorAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The operator address to approve/revoke',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['setApprovalForAll'],
			},
		},
	},
	{
		displayName: 'Approved',
		name: 'approved',
		type: 'boolean',
		required: true,
		default: true,
		description: 'Whether to approve or revoke operator status',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['setApprovalForAll'],
			},
		},
	},

	// Pagination
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		description: 'Page number for pagination',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNftsByOwner', 'getNftTransfers'],
			},
		},
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 50,
		description: 'Number of results per page',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getNftsByOwner', 'getNftTransfers'],
			},
		},
	},

	// Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transferNft', 'approveNft', 'setApprovalForAll', 'getNftMetadata'],
			},
		},
		options: [
			{
				displayName: 'Fetch Metadata from URI',
				name: 'fetchMetadata',
				type: 'boolean',
				default: true,
				description: 'Whether to fetch metadata from the token URI',
				displayOptions: {
					show: {
						'/operation': ['getNftMetadata'],
					},
				},
			},
			{
				displayName: 'Gas Limit',
				name: 'gasLimit',
				type: 'number',
				default: 100000,
				description: 'Gas limit for the transaction',
				displayOptions: {
					show: {
						'/operation': ['transferNft', 'approveNft', 'setApprovalForAll'],
					},
				},
			},
			{
				displayName: 'Gas Price (Gwei)',
				name: 'gasPrice',
				type: 'string',
				default: '',
				description: 'Gas price in Gwei (leave empty for automatic)',
				displayOptions: {
					show: {
						'/operation': ['transferNft', 'approveNft', 'setApprovalForAll'],
					},
				},
			},
			{
				displayName: 'Use Safe Transfer',
				name: 'useSafeTransfer',
				type: 'boolean',
				default: true,
				description: 'Whether to use safeTransferFrom (recommended for contracts)',
				displayOptions: {
					show: {
						'/operation': ['transferNft'],
					},
				},
			},
		],
	},
];

/**
 * Fetch metadata from token URI
 */
async function fetchTokenMetadata(tokenUri: string): Promise<any> {
	try {
		// Handle IPFS URIs
		let url = tokenUri;
		if (tokenUri.startsWith('ipfs://')) {
			url = `https://ipfs.io/ipfs/${tokenUri.slice(7)}`;
		} else if (tokenUri.startsWith('ar://')) {
			url = `https://arweave.net/${tokenUri.slice(5)}`;
		}

		// Handle data URIs
		if (tokenUri.startsWith('data:application/json')) {
			const base64Data = tokenUri.split(',')[1];
			if (base64Data) {
				return JSON.parse(Buffer.from(base64Data, 'base64').toString());
			}
			const jsonData = tokenUri.split(',')[1] || tokenUri.split(';')[1];
			return JSON.parse(decodeURIComponent(jsonData));
		}

		const response = await axios.get(url, { timeout: 10000 });
		return response.data;
	} catch (error) {
		return { error: 'Failed to fetch metadata', uri: tokenUri };
	}
}

/**
 * Execute NFT operations
 */
export async function executeNftOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('xdcNetwork');

	const network = credentials.network as string;
	const rpcUrl = credentials.rpcUrl as string | undefined;
	const privateKey = credentials.privateKey as string | undefined;

	const provider = createXdcProvider({ network, rpcUrl, privateKey });
	const nftAddress = this.getNodeParameter('nftAddress', index) as string;

	if (!isValidXdcAddress(nftAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid NFT contract address: ${nftAddress}`);
	}

	const nftContract = provider.getContract(toEthAddress(nftAddress), ABIS.XRC721);

	let result: any;

	switch (operation) {
		case 'getNftMetadata': {
			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				fetchMetadata?: boolean;
			};

			// Get token URI
			let tokenUri: string;
			try {
				tokenUri = await nftContract.tokenURI(tokenId);
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Token ID ${tokenId} does not exist or contract doesn't support tokenURI`,
				);
			}

			// Get owner
			let owner: string;
			try {
				owner = await nftContract.ownerOf(tokenId);
			} catch {
				owner = '0x0000000000000000000000000000000000000000';
			}

			result = {
				contractAddress: toXdcAddress(nftAddress),
				tokenId,
				tokenUri,
				owner: toXdcAddress(owner),
			};

			// Fetch metadata if requested
			if (options.fetchMetadata !== false && tokenUri) {
				const metadata = await fetchTokenMetadata(tokenUri);
				result.metadata = metadata;
				result.name = metadata.name;
				result.description = metadata.description;
				result.image = metadata.image;
				result.attributes = metadata.attributes;
			}
			break;
		}

		case 'getNftOwner': {
			const tokenId = this.getNodeParameter('tokenId', index) as string;

			let owner: string;
			try {
				owner = await nftContract.ownerOf(tokenId);
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Token ID ${tokenId} does not exist`,
				);
			}

			result = {
				contractAddress: toXdcAddress(nftAddress),
				tokenId,
				owner: toXdcAddress(owner),
			};
			break;
		}

		case 'getNftsByOwner': {
			// This requires explorer API
			let explorerCredentials;
			try {
				explorerCredentials = await this.getCredentials('xdcScan');
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'XDCScan API credentials are required for getting NFTs by owner',
				);
			}

			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			const page = this.getNodeParameter('page', index, 1) as number;
			const pageSize = this.getNodeParameter('pageSize', index, 50) as number;

			if (!isValidXdcAddress(ownerAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid owner address: ${ownerAddress}`);
			}

			const explorerApi = new XdcExplorerApi({
				chainId: network === 'mainnet' ? 50 : 51,
				apiKey: explorerCredentials.apiKey as string,
			});

			const nftTransfers = await explorerApi.getNftTransfers(
				toEthAddress(ownerAddress),
				{ contractAddress: toEthAddress(nftAddress), page, offset: pageSize },
			);

			// Get collection info
			const [name, symbol] = await Promise.all([
				nftContract.name().catch(() => 'Unknown'),
				nftContract.symbol().catch(() => 'UNKNOWN'),
			]);

			// Track owned NFTs (received but not sent)
			const ownedTokens = new Map<string, any>();
			
			for (const transfer of nftTransfers) {
				const tokenId = (transfer as any).tokenID || (transfer as any).tokenId;
				if (transfer.to.toLowerCase() === toEthAddress(ownerAddress).toLowerCase()) {
					ownedTokens.set(tokenId, transfer);
				} else if (transfer.from.toLowerCase() === toEthAddress(ownerAddress).toLowerCase()) {
					ownedTokens.delete(tokenId);
				}
			}

			result = {
				owner: toXdcAddress(ownerAddress),
				contractAddress: toXdcAddress(nftAddress),
				collectionName: name,
				collectionSymbol: symbol,
				count: ownedTokens.size,
				nfts: Array.from(ownedTokens.values()).map((transfer: any) => ({
					tokenId: transfer.tokenID,
					tokenName: transfer.tokenName,
				})),
			};
			break;
		}

		case 'getCollectionInfo': {
			const [name, symbol] = await Promise.all([
				nftContract.name().catch(() => 'Unknown'),
				nftContract.symbol().catch(() => 'UNKNOWN'),
			]);

			// Try to get total supply (not all contracts support this)
			let totalSupply: string | null = null;
			try {
				const supply = await nftContract.totalSupply();
				totalSupply = supply.toString();
			} catch {
				// totalSupply not supported
			}

			// Check for common interfaces
			let supportsRoyalties = false;
			try {
				// EIP-2981 royalty interface ID
				supportsRoyalties = await nftContract.supportsInterface('0x2a55205a');
			} catch {
				// supportsInterface not available
			}

			result = {
				contractAddress: toXdcAddress(nftAddress),
				name,
				symbol,
				totalSupply,
				supportsRoyalties,
			};
			break;
		}

		case 'transferNft': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for NFT transfers',
				);
			}

			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasLimit?: number;
				gasPrice?: string;
				useSafeTransfer?: boolean;
			};

			if (!isValidXdcAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid from address: ${fromAddress}`);
			}
			if (!isValidXdcAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());
			const writableContract = new ethers.Contract(
				toEthAddress(nftAddress),
				ABIS.XRC721,
				wallet,
			);

			// Verify ownership or approval
			const owner = await nftContract.ownerOf(tokenId);
			const approved = await nftContract.getApproved(tokenId);
			const isApprovedForAll = await nftContract.isApprovedForAll(
				toEthAddress(fromAddress),
				wallet.address,
			);

			const isOwner = owner.toLowerCase() === toEthAddress(fromAddress).toLowerCase();
			const isApproved = approved.toLowerCase() === wallet.address.toLowerCase() || isApprovedForAll;
			const isSender = owner.toLowerCase() === wallet.address.toLowerCase();

			if (!isOwner && !isApproved && !isSender) {
				throw new NodeOperationError(
					this.getNode(),
					'Sender is not the owner and not approved to transfer this NFT',
				);
			}

			const txOptions: any = {};
			if (options.gasLimit) {
				txOptions.gasLimit = options.gasLimit;
			}
			if (options.gasPrice) {
				txOptions.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
			}

			let tx;
			if (options.useSafeTransfer !== false) {
				tx = await writableContract['safeTransferFrom(address,address,uint256)'](
					toEthAddress(fromAddress),
					toEthAddress(toAddress),
					tokenId,
					txOptions,
				);
			} else {
				tx = await writableContract.transferFrom(
					toEthAddress(fromAddress),
					toEthAddress(toAddress),
					tokenId,
					txOptions,
				);
			}

			const receipt = await tx.wait();

			result = {
				success: true,
				transactionHash: tx.hash,
				contractAddress: toXdcAddress(nftAddress),
				tokenId,
				from: toXdcAddress(fromAddress),
				to: toXdcAddress(toAddress),
				gasUsed: receipt?.gasUsed.toString(),
				blockNumber: receipt?.blockNumber,
				status: receipt?.status === 1 ? 'success' : 'failed',
			};
			break;
		}

		case 'approveNft': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for NFT approvals',
				);
			}

			const tokenId = this.getNodeParameter('tokenId', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasLimit?: number;
				gasPrice?: string;
			};

			if (!isValidXdcAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid approval address: ${toAddress}`);
			}

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());
			
			// Verify ownership
			const owner = await nftContract.ownerOf(tokenId);
			if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
				throw new NodeOperationError(
					this.getNode(),
					'Only the owner can approve transfers for this NFT',
				);
			}

			const writableContract = new ethers.Contract(
				toEthAddress(nftAddress),
				ABIS.XRC721,
				wallet,
			);

			const txOptions: any = {};
			if (options.gasLimit) {
				txOptions.gasLimit = options.gasLimit;
			}
			if (options.gasPrice) {
				txOptions.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
			}

			const tx = await writableContract.approve(
				toEthAddress(toAddress),
				tokenId,
				txOptions,
			);
			const receipt = await tx.wait();

			result = {
				success: true,
				transactionHash: tx.hash,
				contractAddress: toXdcAddress(nftAddress),
				tokenId,
				owner: toXdcAddress(wallet.address),
				approved: toXdcAddress(toAddress),
				gasUsed: receipt?.gasUsed.toString(),
				blockNumber: receipt?.blockNumber,
				status: receipt?.status === 1 ? 'success' : 'failed',
			};
			break;
		}

		case 'getApprovedAddress': {
			const tokenId = this.getNodeParameter('tokenId', index) as string;

			const approved = await nftContract.getApproved(tokenId);
			const isZeroAddress = approved === '0x0000000000000000000000000000000000000000';

			result = {
				contractAddress: toXdcAddress(nftAddress),
				tokenId,
				approved: isZeroAddress ? null : toXdcAddress(approved),
				hasApproval: !isZeroAddress,
			};
			break;
		}

		case 'setApprovalForAll': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for setting approval',
				);
			}

			const operatorAddress = this.getNodeParameter('operatorAddress', index) as string;
			const approved = this.getNodeParameter('approved', index) as boolean;
			const options = this.getNodeParameter('options', index, {}) as {
				gasLimit?: number;
				gasPrice?: string;
			};

			if (!isValidXdcAddress(operatorAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid operator address: ${operatorAddress}`);
			}

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());
			const writableContract = new ethers.Contract(
				toEthAddress(nftAddress),
				ABIS.XRC721,
				wallet,
			);

			const txOptions: any = {};
			if (options.gasLimit) {
				txOptions.gasLimit = options.gasLimit;
			}
			if (options.gasPrice) {
				txOptions.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
			}

			const tx = await writableContract.setApprovalForAll(
				toEthAddress(operatorAddress),
				approved,
				txOptions,
			);
			const receipt = await tx.wait();

			result = {
				success: true,
				transactionHash: tx.hash,
				contractAddress: toXdcAddress(nftAddress),
				owner: toXdcAddress(wallet.address),
				operator: toXdcAddress(operatorAddress),
				approved,
				gasUsed: receipt?.gasUsed.toString(),
				blockNumber: receipt?.blockNumber,
				status: receipt?.status === 1 ? 'success' : 'failed',
			};
			break;
		}

		case 'getNftTransfers': {
			// This requires explorer API
			let explorerCredentials;
			try {
				explorerCredentials = await this.getCredentials('xdcScan');
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'XDCScan API credentials are required for getting NFT transfers',
				);
			}

			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			const page = this.getNodeParameter('page', index, 1) as number;
			const pageSize = this.getNodeParameter('pageSize', index, 50) as number;

			if (!isValidXdcAddress(ownerAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid owner address: ${ownerAddress}`);
			}

			const explorerApi = new XdcExplorerApi({
				chainId: network === 'mainnet' ? 50 : 51,
				apiKey: explorerCredentials.apiKey as string,
			});

			const transfers = await explorerApi.getNftTransfers(
				toEthAddress(ownerAddress),
				{ contractAddress: toEthAddress(nftAddress), page, offset: pageSize },
			);

			result = {
				address: toXdcAddress(ownerAddress),
				contractAddress: toXdcAddress(nftAddress),
				page,
				pageSize,
				transfers: transfers.map((transfer: any) => ({
					hash: transfer.hash,
					from: toXdcAddress(transfer.from),
					to: toXdcAddress(transfer.to),
					tokenId: transfer.tokenID || transfer.tokenId,
					tokenName: transfer.tokenName,
					tokenSymbol: transfer.tokenSymbol,
					blockNumber: transfer.blockNumber,
					timestamp: transfer.timeStamp,
				})),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [
		{
			json: result,
			pairedItem: { item: index },
		},
	];
}
