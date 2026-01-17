import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createXdcProvider } from '../../transport/provider';
import { XdcExplorerApi } from '../../transport/explorerApi';
import { DEX_CONTRACTS, ABIS, TOKEN_REGISTRY } from '../../constants';
import { toEthAddress, isValidXdcAddress } from '../../utils/addressUtils';
import { fromWei, toWei } from '../../utils/unitConverter';

export const defiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['defi'] } },
		options: [
			{ name: 'Get Token Price', value: 'getTokenPrice', description: 'Get token price from DEX', action: 'Get token price' },
			{ name: 'Get Swap Quote', value: 'getSwapQuote', description: 'Get quote for token swap', action: 'Get swap quote' },
			{ name: 'Execute Swap', value: 'executeSwap', description: 'Execute token swap on DEX', action: 'Execute swap' },
			{ name: 'Get Liquidity Pool', value: 'getLiquidityPool', description: 'Get liquidity pool info', action: 'Get liquidity pool' },
			{ name: 'Add Liquidity', value: 'addLiquidity', description: 'Add liquidity to pool', action: 'Add liquidity' },
			{ name: 'Remove Liquidity', value: 'removeLiquidity', description: 'Remove liquidity from pool', action: 'Remove liquidity' },
			{ name: 'Get XDC Price', value: 'getXdcPrice', description: 'Get current XDC price in USD', action: 'Get XDC price' },
		],
		default: 'getXdcPrice',
	},
];

export const defiFields: INodeProperties[] = [
	{
		displayName: 'DEX',
		name: 'dex',
		type: 'options',
		options: [
			{ name: 'XSwap', value: 'xswap' },
			{ name: 'Globiance', value: 'globiance' },
		],
		default: 'xswap',
		displayOptions: { show: { resource: ['defi'], operation: ['getSwapQuote', 'executeSwap', 'getLiquidityPool', 'addLiquidity', 'removeLiquidity'] } },
	},
	{
		displayName: 'Token In',
		name: 'tokenIn',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['defi'], operation: ['getTokenPrice', 'getSwapQuote', 'executeSwap'] } },
		description: 'Token address or symbol to swap from',
	},
	{
		displayName: 'Token Out',
		name: 'tokenOut',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['defi'], operation: ['getSwapQuote', 'executeSwap'] } },
		description: 'Token address or symbol to swap to',
	},
	{
		displayName: 'Amount In',
		name: 'amountIn',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['defi'], operation: ['getSwapQuote', 'executeSwap'] } },
		description: 'Amount of input token',
	},
	{
		displayName: 'Slippage (%)',
		name: 'slippage',
		type: 'number',
		default: 0.5,
		displayOptions: { show: { resource: ['defi'], operation: ['executeSwap'] } },
		description: 'Maximum slippage tolerance',
	},
	{
		displayName: 'Token A',
		name: 'tokenA',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['defi'], operation: ['getLiquidityPool', 'addLiquidity', 'removeLiquidity'] } },
	},
	{
		displayName: 'Token B',
		name: 'tokenB',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['defi'], operation: ['getLiquidityPool', 'addLiquidity', 'removeLiquidity'] } },
	},
	{
		displayName: 'Amount A',
		name: 'amountA',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['defi'], operation: ['addLiquidity'] } },
	},
	{
		displayName: 'Amount B',
		name: 'amountB',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['defi'], operation: ['addLiquidity'] } },
	},
	{
		displayName: 'Liquidity Amount',
		name: 'liquidityAmount',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['defi'], operation: ['removeLiquidity'] } },
	},
];

function resolveTokenAddress(tokenInput: string, network: string): string {
	const tokens = network === 'mainnet' ? TOKEN_REGISTRY.MAINNET : TOKEN_REGISTRY.APOTHEM;
	const upperInput = tokenInput.toUpperCase();
	for (const [symbol, token] of Object.entries(tokens)) {
		if (symbol === upperInput || (token as any).address?.toLowerCase() === tokenInput.toLowerCase()) {
			return (token as any).address;
		}
	}
	if (isValidXdcAddress(tokenInput)) {
		return toEthAddress(tokenInput);
	}
	throw new Error(`Unknown token: ${tokenInput}`);
}

export async function executeDefiOperation(
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

	switch (operation) {
		case 'getXdcPrice': {
			const scanCredentials = await this.getCredentials('xdcScan').catch(() => null);
			if (scanCredentials) {
				const explorer = new XdcExplorerApi({
					chainId: network === 'mainnet' ? 50 : 51,
					apiKey: scanCredentials.apiKey as string,
				});
				const price = await explorer.getXdcPrice();
				return [{ json: { price: price.xdcusd, btcPrice: price.xdcbtc, timestamp: new Date().toISOString() } }];
			}
			return [{ json: { error: 'XdcScan credentials required for price data' } }];
		}

		case 'getTokenPrice': {
			const tokenIn = this.getNodeParameter('tokenIn', index) as string;
			const tokenAddress = resolveTokenAddress(tokenIn, network);
			const dexContracts = network === 'mainnet' ? DEX_CONTRACTS.MAINNET : DEX_CONTRACTS.APOTHEM;
			const tokens = network === 'mainnet' ? TOKEN_REGISTRY.MAINNET : TOKEN_REGISTRY.APOTHEM;
			const factoryAddress = dexContracts.XSWAP_FACTORY?.address;
			if (!factoryAddress) throw new NodeOperationError(this.getNode(), 'DEX not available on this network');
			const factory = provider.getContract(factoryAddress, ABIS.DEX_FACTORY);
			const wxdcAddress = (tokens.WXDC as any).address;
			const pairAddress = await factory.getPair(tokenAddress, wxdcAddress);
			if (pairAddress === '0x0000000000000000000000000000000000000000') {
				return [{ json: { error: 'No liquidity pair found', token: tokenIn } }];
			}
			const pair = provider.getContract(pairAddress, ABIS.DEX_PAIR);
			const reserves = await pair.getReserves();
			const token0 = await pair.token0();
			const isToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();
			const tokenReserve = isToken0 ? reserves[0] : reserves[1];
			const wxdcReserve = isToken0 ? reserves[1] : reserves[0];
			const priceInWxdc = Number(wxdcReserve) / Number(tokenReserve);
			return [{ json: { token: tokenIn, priceInXdc: priceInWxdc.toFixed(8), pairAddress, reserves: { token: fromWei(tokenReserve, 'xdc'), wxdc: fromWei(wxdcReserve, 'xdc') } } }];
		}

		case 'getSwapQuote': {
			const dex = this.getNodeParameter('dex', index) as string;
			const tokenIn = this.getNodeParameter('tokenIn', index) as string;
			const tokenOut = this.getNodeParameter('tokenOut', index) as string;
			const amountIn = this.getNodeParameter('amountIn', index) as string;
			const tokenInAddress = resolveTokenAddress(tokenIn, network);
			const tokenOutAddress = resolveTokenAddress(tokenOut, network);
			const dexContracts = network === 'mainnet' ? DEX_CONTRACTS.MAINNET : DEX_CONTRACTS.APOTHEM;
			const routerAddress = dex === 'xswap' ? dexContracts.XSWAP_ROUTER?.address : dexContracts.GLOBIANCE_ROUTER?.address;
			if (!routerAddress) throw new NodeOperationError(this.getNode(), 'DEX not available on this network');
			const router = provider.getContract(routerAddress, ABIS.DEX_ROUTER);
			const amountInWei = toWei(amountIn, 'xdc');
			const amounts = await router.getAmountsOut(amountInWei, [tokenInAddress, tokenOutAddress]);
			const amountOut = amounts[1];
			return [{ json: { dex, tokenIn, tokenOut, amountIn, amountOut: fromWei(amountOut, 'xdc'), path: [tokenInAddress, tokenOutAddress], priceImpact: 'N/A' } }];
		}

		case 'executeSwap': {
			if (!credentials.privateKey) {
				throw new NodeOperationError(this.getNode(), 'Private key required for swap execution');
			}
			const dex = this.getNodeParameter('dex', index) as string;
			const tokenIn = this.getNodeParameter('tokenIn', index) as string;
			const tokenOut = this.getNodeParameter('tokenOut', index) as string;
			const amountIn = this.getNodeParameter('amountIn', index) as string;
			const slippage = this.getNodeParameter('slippage', index) as number;
			const tokenInAddress = resolveTokenAddress(tokenIn, network);
			const tokenOutAddress = resolveTokenAddress(tokenOut, network);
			const dexContracts = network === 'mainnet' ? DEX_CONTRACTS.MAINNET : DEX_CONTRACTS.APOTHEM;
			const routerAddress = dex === 'xswap' ? dexContracts.XSWAP_ROUTER?.address : dexContracts.GLOBIANCE_ROUTER?.address;
			if (!routerAddress) throw new NodeOperationError(this.getNode(), 'DEX not available');
			const router = provider.getWritableContract(routerAddress, ABIS.DEX_ROUTER);
			const amountInWei = toWei(amountIn, 'xdc');
			const amounts = await router.getAmountsOut(amountInWei, [tokenInAddress, tokenOutAddress]);
			const minAmountOut = (amounts[1] * BigInt(Math.floor((100 - slippage) * 100))) / BigInt(10000);
			const deadline = Math.floor(Date.now() / 1000) + 1200;
			const walletAddress = await provider.getAddress();
			const tokenContract = provider.getWritableContract(tokenInAddress, ABIS.XRC20);
			const approveTx = await tokenContract.approve(routerAddress, amountInWei);
			await approveTx.wait();
			const swapTx = await router.swapExactTokensForTokens(amountInWei, minAmountOut, [tokenInAddress, tokenOutAddress], walletAddress, deadline);
			const receipt = await swapTx.wait();
			return [{ json: { success: true, transactionHash: receipt?.hash ?? '', tokenIn, tokenOut, amountIn, expectedOut: fromWei(amounts[1], 'xdc'), minOut: fromWei(minAmountOut, 'xdc') } }];
		}

		case 'getLiquidityPool': {
			const dex = this.getNodeParameter('dex', index) as string;
			const tokenA = this.getNodeParameter('tokenA', index) as string;
			const tokenB = this.getNodeParameter('tokenB', index) as string;
			const tokenAAddress = resolveTokenAddress(tokenA, network);
			const tokenBAddress = resolveTokenAddress(tokenB, network);
			const dexContracts = network === 'mainnet' ? DEX_CONTRACTS.MAINNET : DEX_CONTRACTS.APOTHEM;
			const factoryAddress = dex === 'xswap' ? dexContracts.XSWAP_FACTORY?.address : dexContracts.GLOBIANCE_FACTORY?.address;
			if (!factoryAddress) throw new NodeOperationError(this.getNode(), 'DEX not available');
			const factory = provider.getContract(factoryAddress, ABIS.DEX_FACTORY);
			const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
			if (pairAddress === '0x0000000000000000000000000000000000000000') {
				return [{ json: { exists: false, tokenA, tokenB } }];
			}
			const pair = provider.getContract(pairAddress, ABIS.DEX_PAIR);
			const reserves = await pair.getReserves();
			const totalSupply = await pair.totalSupply();
			return [{ json: { exists: true, pairAddress, tokenA, tokenB, reserves: { reserve0: fromWei(reserves[0], 'xdc'), reserve1: fromWei(reserves[1], 'xdc') }, totalSupply: fromWei(totalSupply, 'xdc') } }];
		}

		case 'addLiquidity':
		case 'removeLiquidity':
			throw new NodeOperationError(this.getNode(), `${operation} requires additional implementation for production use`);

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}
}
