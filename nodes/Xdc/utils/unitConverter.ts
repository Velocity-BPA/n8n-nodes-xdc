/**
 * XDC Unit Conversion Utilities
 * 
 * Handle conversions between Wei, Gwei, and XDC units.
 * 1 XDC = 1e18 Wei = 1e9 Gwei
 */

import { ethers } from 'ethers';

/**
 * Unit definitions for XDC
 */
export enum XdcUnit {
	WEI = 'wei',
	KWEI = 'kwei',
	MWEI = 'mwei',
	GWEI = 'gwei',
	SZABO = 'szabo',
	FINNEY = 'finney',
	XDC = 'xdc',
	ETHER = 'ether', // Alias for XDC (ethers.js compatibility)
}

/**
 * Unit decimals mapping
 */
export const UNIT_DECIMALS: Record<string, number> = {
	wei: 0,
	kwei: 3,
	mwei: 6,
	gwei: 9,
	szabo: 12,
	finney: 15,
	xdc: 18,
	ether: 18,
};

/**
 * Convert from Wei to specified unit
 * @param weiValue - Value in Wei
 * @param unit - Target unit
 * @returns Converted value as string
 */
export function fromWei(weiValue: string | bigint, unit: XdcUnit | string = XdcUnit.XDC): string {
	const unitLower = unit.toLowerCase();
	
	// Use ethers for conversion
	if (unitLower === 'xdc') {
		return ethers.formatEther(weiValue);
	}
	
	return ethers.formatUnits(weiValue, UNIT_DECIMALS[unitLower] || 18);
}

/**
 * Convert from specified unit to Wei
 * @param value - Value in specified unit
 * @param unit - Source unit
 * @returns Value in Wei as bigint
 */
export function toWei(value: string | number, unit: XdcUnit | string = XdcUnit.XDC): bigint {
	const unitLower = unit.toLowerCase();
	const stringValue = value.toString();
	
	if (unitLower === 'xdc') {
		return ethers.parseEther(stringValue);
	}
	
	return ethers.parseUnits(stringValue, UNIT_DECIMALS[unitLower] || 18);
}

/**
 * Convert Wei to Gwei
 * @param weiValue - Value in Wei
 * @returns Value in Gwei as string
 */
export function weiToGwei(weiValue: string | bigint): string {
	return ethers.formatUnits(weiValue, 9);
}

/**
 * Convert Gwei to Wei
 * @param gweiValue - Value in Gwei
 * @returns Value in Wei as bigint
 */
export function gweiToWei(gweiValue: string | number): bigint {
	return ethers.parseUnits(gweiValue.toString(), 9);
}

/**
 * Convert Wei to XDC
 * @param weiValue - Value in Wei
 * @returns Value in XDC as string
 */
export function weiToXdc(weiValue: string | bigint): string {
	return ethers.formatEther(weiValue);
}

/**
 * Convert XDC to Wei
 * @param xdcValue - Value in XDC
 * @returns Value in Wei as bigint
 */
export function xdcToWei(xdcValue: string | number): bigint {
	return ethers.parseEther(xdcValue.toString());
}

/**
 * Format token amount with decimals
 * @param amount - Raw token amount
 * @param decimals - Token decimals
 * @param displayDecimals - Decimals to display (default: 6)
 * @returns Formatted amount string
 */
export function formatTokenAmount(
	amount: string | bigint,
	decimals: number = 18,
	displayDecimals: number = 6
): string {
	const formatted = ethers.formatUnits(amount, decimals);
	const num = parseFloat(formatted);
	
	if (num === 0) return '0';
	
	// Handle very small numbers
	if (num < Math.pow(10, -displayDecimals)) {
		return `<${Math.pow(10, -displayDecimals)}`;
	}
	
	return num.toFixed(displayDecimals).replace(/\.?0+$/, '');
}

/**
 * Parse token amount to raw units
 * @param amount - Human readable amount
 * @param decimals - Token decimals
 * @returns Raw amount as bigint
 */
export function parseTokenAmount(amount: string | number, decimals: number = 18): bigint {
	return ethers.parseUnits(amount.toString(), decimals);
}

/**
 * Format XDC balance for display
 * @param weiBalance - Balance in Wei
 * @param precision - Display precision (default: 4)
 * @returns Formatted balance string
 */
export function formatXdcBalance(weiBalance: string | bigint, precision: number = 4): string {
	const xdcBalance = weiToXdc(weiBalance);
	const num = parseFloat(xdcBalance);
	
	if (num === 0) return '0 XDC';
	
	// Format large numbers
	if (num >= 1000000) {
		return `${(num / 1000000).toFixed(2)}M XDC`;
	}
	if (num >= 1000) {
		return `${(num / 1000).toFixed(2)}K XDC`;
	}
	
	return `${num.toFixed(precision)} XDC`;
}

/**
 * Format gas price for display
 * @param gasPriceWei - Gas price in Wei
 * @returns Formatted gas price in Gwei
 */
export function formatGasPrice(gasPriceWei: string | bigint): string {
	const gwei = weiToGwei(gasPriceWei);
	return `${parseFloat(gwei).toFixed(2)} Gwei`;
}

/**
 * Calculate gas cost
 * @param gasLimit - Gas limit
 * @param gasPriceWei - Gas price in Wei
 * @returns Gas cost in Wei as bigint
 */
export function calculateGasCost(gasLimit: bigint | number, gasPriceWei: bigint): bigint {
	return BigInt(gasLimit) * gasPriceWei;
}

/**
 * Convert between any two units
 * @param value - Value to convert
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Converted value as string
 */
export function convertUnits(
	value: string | number,
	fromUnit: XdcUnit | string,
	toUnit: XdcUnit | string
): string {
	// First convert to Wei
	const weiValue = toWei(value, fromUnit);
	// Then convert to target unit
	return fromWei(weiValue, toUnit);
}

/**
 * Validate numeric string
 * @param value - Value to validate
 * @returns True if valid numeric string
 */
export function isValidNumericString(value: string): boolean {
	if (!value || value.trim() === '') {
		return false;
	}
	
	// Check for valid number format
	const num = Number(value);
	return !isNaN(num) && isFinite(num);
}

/**
 * Safe parse bigint from various inputs
 * @param value - Value to parse
 * @returns BigInt value or 0n if invalid
 */
export function safeParseBigInt(value: string | number | bigint | undefined): bigint {
	if (value === undefined || value === null) {
		return 0n;
	}
	
	if (typeof value === 'bigint') {
		return value;
	}
	
	try {
		return BigInt(value);
	} catch {
		return 0n;
	}
}

/**
 * Compare two bigint values
 * @param a - First value
 * @param b - Second value
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareBigInt(a: bigint, b: bigint): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

/**
 * Calculate percentage of total
 * @param value - Value
 * @param total - Total
 * @returns Percentage as string
 */
export function calculatePercentage(value: bigint, total: bigint): string {
	if (total === 0n) return '0';
	const percentage = (value * 10000n) / total;
	return (Number(percentage) / 100).toFixed(2);
}

/**
 * Format large number with K, M, B suffixes
 * @param value - Number value
 * @returns Formatted string
 */
export function formatLargeNumber(value: number | bigint): string {
	const num = typeof value === 'bigint' ? Number(value) : value;
	
	if (num >= 1e9) {
		return `${(num / 1e9).toFixed(2)}B`;
	}
	if (num >= 1e6) {
		return `${(num / 1e6).toFixed(2)}M`;
	}
	if (num >= 1e3) {
		return `${(num / 1e3).toFixed(2)}K`;
	}
	
	return num.toFixed(2);
}
