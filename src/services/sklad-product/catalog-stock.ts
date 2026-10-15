import { UserFacingError } from '@/lib/errors';
import { skladProductService } from '@/services/sklad-product/sklad-product.service';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';

type CatalogRow = Pick<WarehouseAllListItem, 'id' | 'warehouse_id' | 'sklad_product_id' | 'type_sklad_id'>;

// A catalog (`all-list`) row is one product in one sklad. The card id is what images, Telegram and the
// China leg use; the stock (SkladProduct) id is what sales, transfers and price edits use.
export function catalogCardId(row: CatalogRow): number {
	return row.warehouse_id ?? row.id;
}

// Uses the stock id a record already carries, else looks the stock row up by card + sklad.
export async function resolveStockId(
	knownId: number | null | undefined,
	warehouse: number,
	typeSklad: number | null | undefined,
): Promise<number> {
	if (knownId) return knownId;
	if (typeSklad === null || typeSklad === undefined) throw new UserFacingError("Mahsulotning skladi ko'rsatilmagan");
	const stock = await skladProductService.findByPair(warehouse, typeSklad);
	if (!stock) throw new UserFacingError('Bu mahsulot ushbu skladda topilmadi');
	return stock.id;
}

export function resolveCatalogStockId(row: CatalogRow): Promise<number> {
	return resolveStockId(row.sklad_product_id, catalogCardId(row), row.type_sklad_id);
}
