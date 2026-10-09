import { useMemo } from 'react';
import { useWarehouseAllListQuery } from '@/services/warehouse/warehouse.queries';
import type { WarehouseAllListItem } from '@/services/warehouse/warehouse.types';

/**
 * The import endpoints return warehouse IDs only, so product names (model, category, size, type)
 * come from the same catalog the existing import page uses.
 */
export function useWarehouseCatalog() {
	const { data, isLoading } = useWarehouseAllListQuery({});

	return useMemo(() => {
		const byId = new Map<number, WarehouseAllListItem>();

		for (const brand of data ?? []) {
			for (const category of brand.product_categories) {
				for (const row of category.warehouses) {
					byId.set(row.id, row);
				}
			}
		}

		return {
			byId,
			isLoading,
		};
	}, [data, isLoading]);
}
