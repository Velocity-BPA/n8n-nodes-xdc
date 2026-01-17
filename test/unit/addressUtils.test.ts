/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	toXdcAddress,
	toEthAddress,
	isValidXdcAddress,
	isValidEthAddress,
	normalizeAddress,
} from '../../nodes/Xdc/utils/addressUtils';

describe('Address Utilities', () => {
	describe('toXdcAddress', () => {
		it('should convert 0x address to xdc format', () => {
			const ethAddress = '0x1234567890123456789012345678901234567890';
			const result = toXdcAddress(ethAddress);
			expect(result).toBe('xdc1234567890123456789012345678901234567890');
		});

		it('should return xdc address unchanged', () => {
			const xdcAddress = 'xdc1234567890123456789012345678901234567890';
			const result = toXdcAddress(xdcAddress);
			expect(result).toBe(xdcAddress);
		});

		it('should handle uppercase addresses', () => {
			const ethAddress = '0x1234567890ABCDEF1234567890ABCDEF12345678';
			const result = toXdcAddress(ethAddress);
			expect(result.startsWith('xdc')).toBe(true);
		});
	});

	describe('toEthAddress', () => {
		it('should convert xdc address to 0x format', () => {
			const xdcAddress = 'xdc1234567890123456789012345678901234567890';
			const result = toEthAddress(xdcAddress);
			expect(result).toBe('0x1234567890123456789012345678901234567890');
		});

		it('should return 0x address unchanged', () => {
			const ethAddress = '0x1234567890123456789012345678901234567890';
			const result = toEthAddress(ethAddress);
			expect(result).toBe(ethAddress);
		});
	});

	describe('isValidXdcAddress', () => {
		it('should return true for valid xdc address', () => {
			const address = 'xdc1234567890123456789012345678901234567890';
			expect(isValidXdcAddress(address)).toBe(true);
		});

		it('should return false for invalid xdc address', () => {
			expect(isValidXdcAddress('invalid')).toBe(false);
			expect(isValidXdcAddress('xdc123')).toBe(false);
			expect(isValidXdcAddress('')).toBe(false);
		});

		it('should return true for valid 0x address', () => {
			const address = '0x1234567890123456789012345678901234567890';
			expect(isValidXdcAddress(address)).toBe(true);
		});
	});

	describe('isValidEthAddress', () => {
		it('should return true for valid 0x address', () => {
			const address = '0x1234567890123456789012345678901234567890';
			expect(isValidEthAddress(address)).toBe(true);
		});

		it('should return false for invalid address', () => {
			expect(isValidEthAddress('invalid')).toBe(false);
			expect(isValidEthAddress('0x123')).toBe(false);
		});
	});

	describe('normalizeAddress', () => {
		it('should normalize xdc address to lowercase', () => {
			const address = 'XDC1234567890ABCDEF1234567890ABCDEF12345678';
			const result = normalizeAddress(address);
			expect(result).toBe('xdc1234567890abcdef1234567890abcdef12345678');
		});

		it('should normalize 0x address to lowercase', () => {
			const address = '0X1234567890ABCDEF1234567890ABCDEF12345678';
			const result = normalizeAddress(address);
			expect(result).toBe('0x1234567890abcdef1234567890abcdef12345678');
		});
	});
});
