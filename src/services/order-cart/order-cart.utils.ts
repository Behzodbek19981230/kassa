import type { OrderCartItem } from '@/services/order-cart/order-cart.types';

// The sklad a cart line is sold from; older lines only carry it on the warehouse detail.
export function cartItemSkladName(item: Pick<OrderCartItem, 'sklad_product_detail' | 'warehouse_detail'>) {
	return item.sklad_product_detail?.type_sklad_name ?? item.warehouse_detail?.type_sklad_name ?? null;
}
