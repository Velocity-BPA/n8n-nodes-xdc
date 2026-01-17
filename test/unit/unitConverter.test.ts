/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	fromWei,
	toWei,
	formatXdcBalance,
	parseXdcAmount,
} from '../../nodes/Xdc/utils/unitConverter';

describe('Unit Converter Utilities', () => {
	describe('fromWei', () => {
		it('should convert wei to xdc', () => {
			const wei = '1000000000000000000';
			const result = fromWei(wei, 'xdc');
			expect(result).toBe('1.0');
		});

		it('should convert wei to gwei', () => {
			const wei = '1000000000';
			const result = fromWei(wei, 'gwei');
			expect(result).toBe('1.0');
		});

		it('should handle zero value', () => {
			const result = fromWei('0', 'xdc');
			expect(result).toBe('0.0');
		});

		it('should handle large values', () => {
			const wei = '1000000000000000000000000';
			const result = fromWei(wei, 'xdc');
			expect(parseFloat(result)).toBe(1000000);
		});
	});

	describe('toWei', () => {
		it('should convert xdc to wei', () => {
			const xdc = '1';
			const result = toWei(xdc, 'xdc');
			expect(result).toBe('1000000000000000000');
		});

		it('should convert gwei to wei', () => {
			const gwei = '1';
			const result = toWei(gwei, 'gwei');
			expect(result).toBe('1000000000');
		});

		it('should handle decimal values', () => {
			const xdc = '0.5';
			const result = toWei(xdc, 'xdc');
			expect(result).toBe('500000000000000000');
		});
	});

	describe('formatXdcBalance', () => {
		it('should format balance with default decimals', () => {
			const wei = '1234567890000000000';
			const result = formatXdcBalance(wei);
			expect(result).toContain('1.23');
		});

		it('should format balance with custom decimals', () => {
			const wei = '1234567890000000000';
			const result = formatXdcBalance(wei, 4);
			expect(result).toContain('1.2345');
		});

		it('should append XDC symbol', () => {
			const wei = '1000000000000000000';
			const result = formatXdcBalance(wei);
			expect(result).toContain('XDC');
		});
	});

	describe('parseXdcAmount', () => {
		it('should parse string amount to wei', () => {
			const result = parseXdcAmount('1');
			expect(result).toBe('1000000000000000000');
		});

		it('should handle decimal amounts', () => {
			const result = parseXdcAmount('1.5');
			expect(result).toBe('1500000000000000000');
		});

		it('should handle very small amounts', () => {
			const result = parseXdcAmount('0.000000000000000001');
			expect(result).toBe('1');
		});
	});
});
