/**
 * XDC Address Utilities
 * 
 * XDC Network uses a unique address format with 'xdc' prefix instead of '0x'.
 * These utilities handle conversion and validation of both formats.
 */

import { ethers } from 'ethers';

/**
 * Convert 0x address to xdc format
 * @param address - Address in 0x format
 * @returns Address in xdc format
 */
export function toXdcAddress(address: string): string {
	if (!address) {
		throw new Error('Address is required');
	}
	
	const normalized = address.toLowerCase();
	
	// Already in xdc format
	if (normalized.startsWith('xdc')) {
		return normalized;
	}
	
	// Convert from 0x format
	if (normalized.startsWith('0x')) {
		return 'xdc' + normalized.slice(2);
	}
	
	// No prefix, add xdc
	if (normalized.length === 40) {
		return 'xdc' + normalized;
	}
	
	throw new Error(`Invalid address format: ${address}`);
}

/**
 * Convert xdc address to 0x format (for ethers.js compatibility)
 * @param address - Address in xdc or 0x format
 * @returns Address in 0x format
 */
export function toEthAddress(address: string): string {
	if (!address) {
		throw new Error('Address is required');
	}
	
	const normalized = address.toLowerCase();
	
	// Already in 0x format
	if (normalized.startsWith('0x')) {
		return normalized;
	}
	
	// Convert from xdc format
	if (normalized.startsWith('xdc')) {
		return '0x' + normalized.slice(3);
	}
	
	// No prefix, add 0x
	if (normalized.length === 40) {
		return '0x' + normalized;
	}
	
	throw new Error(`Invalid address format: ${address}`);
}

/**
 * Validate XDC address (accepts both formats)
 * @param address - Address to validate
 * @returns True if valid
 */
export function isValidXdcAddress(address: string): boolean {
	if (!address) {
		return false;
	}
	
	try {
		const ethAddress = toEthAddress(address);
		return ethers.isAddress(ethAddress);
	} catch {
		return false;
	}
}

/**
 * Get checksum address (0x format)
 * @param address - Address to checksum
 * @returns Checksummed address
 */
export function getChecksumAddress(address: string): string {
	const ethAddress = toEthAddress(address);
	return ethers.getAddress(ethAddress);
}

/**
 * Normalize address to a consistent format
 * @param address - Address in any format
 * @param format - Target format ('xdc' or '0x')
 * @returns Normalized address
 */
export function normalizeAddress(address: string, format: 'xdc' | '0x' = 'xdc'): string {
	if (format === 'xdc') {
		return toXdcAddress(address);
	}
	return toEthAddress(address);
}

/**
 * Check if address is a contract
 * @param provider - ethers provider
 * @param address - Address to check
 * @returns True if contract
 */
export async function isContract(
	provider: ethers.Provider,
	address: string
): Promise<boolean> {
	const ethAddress = toEthAddress(address);
	const code = await provider.getCode(ethAddress);
	return code !== '0x' && code !== '0x0';
}

/**
 * Compare two addresses (format-agnostic)
 * @param address1 - First address
 * @param address2 - Second address
 * @returns True if addresses are equal
 */
export function addressesEqual(address1: string, address2: string): boolean {
	if (!address1 || !address2) {
		return false;
	}
	
	try {
		return toEthAddress(address1).toLowerCase() === toEthAddress(address2).toLowerCase();
	} catch {
		return false;
	}
}

/**
 * Truncate address for display
 * @param address - Address to truncate
 * @param startChars - Characters to show at start (default 6)
 * @param endChars - Characters to show at end (default 4)
 * @returns Truncated address
 */
export function truncateAddress(
	address: string,
	startChars: number = 6,
	endChars: number = 4
): string {
	const xdcAddress = toXdcAddress(address);
	if (xdcAddress.length <= startChars + endChars) {
		return xdcAddress;
	}
	return `${xdcAddress.slice(0, startChars)}...${xdcAddress.slice(-endChars)}`;
}

/**
 * Check if address is zero address
 * @param address - Address to check
 * @returns True if zero address
 */
export function isZeroAddress(address: string): boolean {
	try {
		return toEthAddress(address) === ethers.ZeroAddress;
	} catch {
		return false;
	}
}

/**
 * Get zero address in specified format
 * @param format - Address format
 * @returns Zero address
 */
export function getZeroAddress(format: 'xdc' | '0x' = 'xdc'): string {
	return normalizeAddress(ethers.ZeroAddress, format);
}

/**
 * Parse address from various formats (handles mixed case)
 * @param input - Address input
 * @returns Parsed address or null if invalid
 */
export function parseAddress(input: string): string | null {
	if (!input) {
		return null;
	}
	
	const trimmed = input.trim();
	
	if (isValidXdcAddress(trimmed)) {
		return toXdcAddress(trimmed);
	}
	
	return null;
}

/**
 * Create address from bytes
 * @param bytes - Bytes to convert
 * @returns Address in xdc format
 */
export function addressFromBytes(bytes: Uint8Array | string): string {
	if (typeof bytes === 'string') {
		return toXdcAddress(bytes);
	}
	const hexString = ethers.hexlify(bytes);
	return toXdcAddress(hexString);
}

/**
 * Extract address from contract creation transaction
 * @param senderAddress - Address of contract deployer
 * @param nonce - Transaction nonce
 * @returns Predicted contract address
 */
export function predictContractAddress(senderAddress: string, nonce: number): string {
	const ethAddress = toEthAddress(senderAddress);
	const predictedAddress = ethers.getCreateAddress({
		from: ethAddress,
		nonce: nonce,
	});
	return toXdcAddress(predictedAddress);
}
