import type { ComboboxLoadParams, ComboboxLoadResult, ComboboxOption } from '@/components/ui';
import { brandService } from '@/services/brand/brand.service';
import { brandSizeTypeService } from '@/services/brand-size-type/brand-size-type.service';
import { consignorService } from '@/services/consignor/consignor.service';
import { countryService } from '@/services/country/country.service';
import { logisticsCompanyService } from '@/services/logistics-company/logistics-company.service';
import { logisticsWarehouseService } from '@/services/logistics-warehouse/logistics-warehouse.service';
import type { LogisticsWarehouse } from '@/services/logistics-warehouse/logistics-warehouse.types';
import { productCategoryService } from '@/services/product-category/product-category.service';
import type { PaginatedResponse } from '@/services/api/types';
import { userService } from '@/services/user/user.service';
import { formatUserName } from '@/pages/TwoStageImport/utils';

// Combobox loaders for the reference lists used by the two-stage import forms.
// They follow the same paging contract as the rest of the app.

function toLoadResult<T>(page: PaginatedResponse<T>, toOption: (item: T) => ComboboxOption): ComboboxLoadResult {
	return {
		options: page.results.map(toOption),
		hasMore: page.pagination.currentPage < page.pagination.lastPage,
	};
}

export function logisticsWarehouseLabel(warehouse: LogisticsWarehouse) {
	return warehouse.country_name ? `${warehouse.name} — ${warehouse.country_name}` : warehouse.name;
}

export const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> =>
	toLoadResult(await brandService.list({ search: search || undefined, page, limit: 20 }), (b) => ({
		value: String(b.id),
		label: b.name,
	}));

export function createCategoryLoader(brandId?: number) {
	return async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> =>
		toLoadResult(
			await productCategoryService.list({ search: search || undefined, page, limit: 20, brand: brandId }),
			(c) => ({ value: String(c.id), label: c.name }),
		);
}

export const loadSizeTypeOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> =>
	toLoadResult(await brandSizeTypeService.list({ search: search || undefined, page, limit: 20 }), (t) => ({
		value: String(t.id),
		label: t.name,
	}));

export const loadConsignorOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> =>
	toLoadResult(await consignorService.list({ search: search || undefined, page, limit: 20 }), (c) => ({
		value: String(c.id),
		label: c.name,
	}));

export const loadCountryOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> =>
	toLoadResult(await countryService.list({ search: search || undefined, page, limit: 20 }), (c) => ({
		value: String(c.id),
		label: c.name,
	}));

export const loadLogisticsCompanyOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> =>
	toLoadResult(await logisticsCompanyService.list({ search: search || undefined, page, limit: 20 }), (c) => ({
		value: String(c.id),
		label: c.name,
	}));

export function createLogisticsWarehouseLoader(countryId?: number, logisticsCompanyId?: number) {
	return async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> =>
		toLoadResult(
			await logisticsWarehouseService.list({ search: search || undefined, page, limit: 20, country: countryId, logistics_company: logisticsCompanyId }),
			(w) => ({ value: String(w.id), label: logisticsWarehouseLabel(w) }),
		);
}

export const loadUserOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> =>
	toLoadResult(await userService.list({ search: search || undefined, page, limit: 20 }), (u) => ({
		value: String(u.id),
		label: formatUserName(u),
	}));
