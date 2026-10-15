import { useBrandListQuery } from '@/services/brand/brand.queries';
import { useBrandSizeTypeListQuery } from '@/services/brand-size-type/brand-size-type.queries';
import { useProductCategoryListQuery } from '@/services/product-category/product-category.queries';
import type { SkladProductWarehouseDetail } from '@/services/sklad-product/sklad-product.types';

type Card = SkladProductWarehouseDetail | null | undefined;

// Names for a stock row's product card. `warehouse_detail` may carry only ids, so the names fall back to
// the brand / category / type lists.
export function useProductCardNames() {
	const { data: brandData } = useBrandListQuery({ limit: 100 });
	const brandNameById = new Map((brandData?.results ?? []).map((b) => [b.id, b.name]));
	const { data: categoryData } = useProductCategoryListQuery({ limit: 100 });
	const categoryNameById = new Map((categoryData?.results ?? []).map((c) => [c.id, c.name]));
	const { data: typeData } = useBrandSizeTypeListQuery({ limit: 100 });
	const typeNameById = new Map((typeData?.results ?? []).map((t) => [t.id, t.name]));

	return {
		brandName: (card: Card) =>
			card ? (card.brand_detail?.name ?? brandNameById.get(card.brand) ?? String(card.brand)) : '',
		categoryName: (card: Card) =>
			card
				? (card.product_category_detail?.name ??
					categoryNameById.get(card.product_category) ??
					String(card.product_category))
				: '',
		typeName: (card: Card) =>
			card?.type ? (card.type_detail?.name ?? typeNameById.get(card.type) ?? String(card.type)) : '',
	};
}
