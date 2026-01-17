/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { XdcProvider } from '../../nodes/Xdc/transport/provider';
import { NETWORKS } from '../../nodes/Xdc/constants/networks';

describe('XDC Provider Integration Tests', () => {
	let provider: XdcProvider;

	beforeAll(() => {
		// Use Apothem testnet for integration tests
		provider = new XdcProvider({
			network: 'apothem',
			rpcUrl: NETWORKS.APOTHEM.rpcUrl,
		});
	});

	describe('Network Connection', () => {
		it('should connect to Apothem testnet', async () => {
			const blockNumber = await provider.getBlockNumber();
			expect(blockNumber).toBeGreaterThan(0);
		});

		it('should get network chain ID', async () => {
			const network = await provider.getNetwork();
			expect(network.chainId).toBe(BigInt(51)); // Apothem chain ID
		});
	});

	describe('Block Operations', () => {
		it('should get latest block', async () => {
			const block = await provider.getBlock('latest');
			expect(block).toBeDefined();
			expect(block?.number).toBeGreaterThan(0);
		});

		it('should get block by number', async () => {
			const latestBlock = await provider.getBlock('latest');
			if (latestBlock) {
				const block = await provider.getBlock(latestBlock.number - 10);
				expect(block).toBeDefined();
				expect(block?.number).toBe(latestBlock.number - 10);
			}
		});
	});

	describe('Balance Operations', () => {
		it('should get balance for zero address', async () => {
			const balance = await provider.getBalance(
				'0x0000000000000000000000000000000000000000',
			);
			expect(balance).toBeDefined();
		});

		it('should handle xdc address format', async () => {
			const balance = await provider.getBalance(
				'xdc0000000000000000000000000000000000000000',
			);
			expect(balance).toBeDefined();
		});
	});

	describe('Gas Estimation', () => {
		it('should estimate gas for simple transfer', async () => {
			const gasEstimate = await provider.estimateGas({
				to: '0x0000000000000000000000000000000000000000',
				value: '0x0',
			});
			expect(gasEstimate).toBeGreaterThan(BigInt(0));
		});
	});
});
