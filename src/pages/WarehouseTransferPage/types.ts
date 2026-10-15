import type { TransferMode } from '@/services/warehouse-transfer/warehouse-transfer.types';

export interface TransferCartSide {
	/** The product's stock row in this side's sklad. */
	skladProductId: number;
	typeSkladName: string;
	brandName: string;
	categoryName: string;
	size: number;
	typeName: string;
	quantity: number;
}

export interface TransferCartRow {
	key: string;
	mode: TransferMode;
	source: TransferCartSide;
	target: TransferCartSide;
}
