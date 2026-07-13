import type { VozvratProductItem } from '@/services/vozvrat/vozvrat.types';

export function rowKey(
	item: Pick<VozvratProductItem, 'warehouse' | 'brand' | 'product_category' | 'size' | 'type' | 'type_sklad'>,
) {
	return `${item.warehouse}-${item.type_sklad}-${item.brand}-${item.product_category}-${item.size}-${item.type}`;
}

export interface VozvratVariant {
	key: string;
	brandName: string;
	categoryName: string;
	size: number;
	typeName: string;
	rows: VozvratProductItem[];
}

export function buildVariant(items: VozvratProductItem[]): VozvratVariant {
	const first = items[0];
	return {
		key: `${first.brand}-${first.product_category}-${first.size}-${first.type}`,
		brandName: first.brand_name,
		categoryName: first.product_category_name,
		size: first.size,
		typeName: first.type_name,
		rows: items,
	};
}

export function groupIntoVariants(items: VozvratProductItem[]): VozvratVariant[] {
	const map = new Map<string, VozvratProductItem[]>();
	for (const item of items) {
		const key = `${item.brand}-${item.product_category}-${item.size}-${item.type}`;
		const existing = map.get(key);
		if (existing) existing.push(item);
		else map.set(key, [item]);
	}
	return Array.from(map.values()).map(buildVariant);
}
