import { useUserInfoQuery } from '@/services/user/user.queries';
import { getUserTypeSkladIds } from '@/services/user/user.types';
import { todayTashkent } from '@/pages/TwoStageImport/utils';

// Role keys as sent by the backend in `roles.key` (the display `name` may change).
export const ROLE = {
	SUPER_ADMIN: 'super_admin',
	ADMIN: 'admin',
	MANAGER: 'manager',
	SOTUVCHI: 'sotuvchi',
	SKLAD_MANAGER: 'sklad_manager',
	SKLAD_XODIM: 'sklad_xodim',
} as const;

// Roles that bypass ownership checks entirely. An allowlist (rather than a
// blocklist of restricted roles) so an unrecognized/future role key
// defaults to the safer own-records-only behavior instead of silently
// getting unrestricted access.
/** Roles that start on (and fall back to) the order page instead of the warehouse products list. */
const PLACE_ORDER_HOME_ROLES: string[] = [ROLE.SOTUVCHI, ROLE.SKLAD_XODIM];

/** Landing page after login, and where route guards send a role that may not open a page. */
export function getHomePath(roleKey: string | null | undefined) {
	return roleKey && PLACE_ORDER_HOME_ROLES.includes(roleKey) ? '/place-order' : '/warehouse-products';
}

const UNRESTRICTED_ROLES: string[] = [ROLE.SUPER_ADMIN, ROLE.MANAGER];

/** "06.11.2026" or "2026-11-06..." -> "2026-11-06" (the sklad list sends the first form). */
function toIsoDay(value: string | null | undefined) {
	if (!value) return '';
	const match = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(value);
	return match ? `${match[3]}-${match[2]}-${match[1]}` : value.slice(0, 10);
}

export function usePermissions() {
	const { data: userInfo } = useUserInfoQuery();
	const roleKey = userInfo?.roles?.key ?? null;
	const currentUserId = userInfo?.id ?? null;

	const isSuperAdmin = roleKey === ROLE.SUPER_ADMIN;
	const isAdmin = roleKey === ROLE.ADMIN;
	const isSkladManager = roleKey === ROLE.SKLAD_MANAGER;
	const isSkladXodim = roleKey === ROLE.SKLAD_XODIM;

	const isManager = roleKey === ROLE.MANAGER;

	// import ('Import qilish'): Super Admin + Sklad Manager + Manager + Admin
	const canImport = isSuperAdmin || isSkladManager || isManager || isAdmin;

	// "Tasdiqlanmagan mijozlar" (new Telegram clients awaiting confirmation): Super Admin + Admin
	const canConfirmClients = isSuperAdmin || isAdmin;
	// "Telegram xabarnoma": Super Admin + Admin + Manager
	const canSendTelegramBroadcast = isSuperAdmin || isAdmin || isManager;
	// "Ombor mahsulotlari" menu: Super Admin + Admin + Manager + Sklad Manager
	const canViewWarehouseProducts = isSuperAdmin || isAdmin || isManager || isSkladManager;
	// "Ombor mahsulotlari" Excel export: Super Admin only
	const canExportWarehouseProducts = isSuperAdmin;
	// Grand total row at the bottom of warehouse-products table
	const canViewWarehouseProductsTotal = isSuperAdmin || isAdmin;
	// "Ombor mahsulotlari" Telegram send ("Harakatlar" column): Super Admin + Admin + Manager
	const canSendProductToTelegram = isSuperAdmin || isAdmin || isManager;
	// "Karzinka" button on the order history (/order-cart) and "Buyurtma Karzinka" (/cart-drafts): Super Admin + Admin
	const canManageOrderCart = isSuperAdmin || isAdmin;
	// "Mahsulot toifalari" (/system/product-categories: Modellar + Mahsulot toifalari tabs): Super Admin under
	// "Tizim boshqaruvi", Admin under "Sozlamalar". Admin may only add; edit / delete stay Super Admin only.
	const canViewProductCategories = isSuperAdmin || isAdmin;
	const canEditProductCategories = isSuperAdmin;
	// "Qarz to'lov karzinka" (/settings/debt-repayments-drafts): Super Admin + Admin; restore / delete only own
	// records (canEditOwned), the deleted-repayments history stays Super Admin only.
	const canViewDebtRepaymentDrafts = isSuperAdmin || isAdmin;
	// Delete in "Mijoz buyurtmalar tarixi" (Draftga olish) and "Vozvrat buyurtmalar tarixi": Super Admin + Admin
	const canDeleteOrders = isSuperAdmin || isAdmin;

	// "Qarzdorlar ro'yxati" (/settings/debtors, read-only): Super Admin + Admin under "Sozlamalar", Manager as its own menu item.
	const canViewClientDebtors = isSuperAdmin || isManager || isAdmin;

	// "Mening qarzlarim" menu + pages: Super Admin + Sklad Manager; add / edit / delete stay Super Admin only.
	const canViewMyDebts = isSuperAdmin || isSkladManager;
	const canManageMyDebts = isSuperAdmin;

	// "Yuk jo'natuvchilar": Super Admin + Sklad Manager + Manager + Admin may view and add; only Super Admin may edit / delete.
	const canManageConsignor = isSuperAdmin || isSkladManager || isManager || isAdmin;
	// Everyone but Super Admin gets it as a top-level menu item (Super Admin has it under "Tizim boshqaruvi")
	// and may only add consignors inside Uzbekistan.
	const hasTopLevelConsignorMenu = isSkladManager || isManager || isAdmin;
	const canEditConsignor = isSuperAdmin;
	// "Tovarlar va Narxlar" (warehouse pricing) menu: Super Admin + Admin + Manager
	const canViewWarehousePrices = isSuperAdmin || isAdmin || isManager;
	// warehouse (pricing): add / edit / delete only for Super Admin
	const canManageWarehouse = isSuperAdmin;

	// "Mijozlar" menu + pages: Super Admin + Admin (under "Sozlamalar") + Manager (as its own menu item)
	const canViewClients = isSuperAdmin || isAdmin || isManager;

	// "Omborxona hisobi" menu + pages: Super Admin + Sklad Manager + Manager + Admin
	const canViewWarehouseReport = isSuperAdmin || isSkladManager || isManager || isAdmin;

	// sklad ("Omborxona hisobi"): Super Admin + Sklad Manager unrestricted;
	// Sklad Xodim only their own imports; everyone else (Manager, Sotuvchi) read-only.
	function canEditSklad(item: { created_by?: number | null }) {
		if (isSuperAdmin || isSkladManager) return true;
		if (isSkladXodim) return item.created_by === currentUserId;
		return false;
	}

	// "Omborxona hisobi" edit (Tahrirlash): Super Admin any import; Sklad Manager, Manager and Admin
	// only their own imports dated today; nobody else.
	function canEditSkladImport(item: { created_by?: number | null; cr_date?: string | null }) {
		if (isSuperAdmin) return true;
		if (!isSkladManager && !isManager && !isAdmin) return false;
		return currentUserId != null && item.created_by === currentUserId && toIsoDay(item.cr_date) === todayTashkent();
	}

	// order-account-history / debt-repayment / vozvrat-order / product-account-history:
	// Super Admin + Manager unrestricted; every other role only their own records.
	function canEditOwned(item: { created_by?: number | string | null }) {
		if (!roleKey) return false;
		if (UNRESTRICTED_ROLES.includes(roleKey)) return true;
		return item.created_by === currentUserId;
	}

	// "Berilgan soni" on an order's detail page: whoever may edit the order (canEditOwned), plus Sklad Manager on any order.
	function canEditGivenCount(item: { created_by?: number | string | null }) {
		return isSkladManager || canEditOwned(item);
	}

	// "Mijoz buyurtmalar tarixi" / "Vozvrat buyurtmalar tarixi" edit (Tahrirlash): Super Admin, or whoever created the order.
	function canEditOrder(item: { created_by?: number | null }) {
		if (isSuperAdmin) return true;
		return currentUserId != null && item.created_by === currentUserId;
	}

	// "Mijoz buyurtmalar tarixi" edit (Tahrirlash): Super Admin any order; everyone else only
	// their own orders dated today.
	function canEditCustomerOrder(item: { created_by?: number | null; date?: string | null }) {
		if (isSuperAdmin) return true;
		return canEditOrder(item) && item.date?.slice(0, 10) === todayTashkent();
	}

	// "Vozvrat buyurtmalar tarixi" edit (Tahrirlash): Super Admin any vozvrat; everyone else only
	// their own vozvrats dated today.
	function canEditVozvratOrder(item: { created_by?: number | null; date?: string | null }) {
		return canEditCustomerOrder(item);
	}

	// "To'langan qarzlar" (debt-repayment) edit: Super Admin any payment; everyone else only
	// the payments they accepted themselves, dated today.
	function canEditDebtRepayment(item: { created_by?: number | null; date?: string | null }) {
		return canEditCustomerOrder(item);
	}

	// "Buyurtmalar va qarzlar" menu + page: every role except Sotuvchi and Sklad xodim (hidden until the role is known).
	const canViewOrderAndDebt = roleKey != null && roleKey !== ROLE.SOTUVCHI && !isSkladXodim;

	// "Buyurtmalar va qarzlar" report PDFs: PDF1 Super Admin; PDF2 Super Admin + Admin;
	// PDF3 every role except Sotuvchi and Sklad xodim (hidden until the role is known).
	const canDownloadOrderDebtPdf1 = isSuperAdmin;
	const canDownloadOrderDebtPdf2 = isSuperAdmin || isAdmin;
	const canDownloadOrderDebtPdf3 = roleKey != null && roleKey !== ROLE.SOTUVCHI && !isSkladXodim;

	// order-account-history/{id}/change-logs: closed for every role except Super Admin
	const canViewChangeLogs = isSuperAdmin;

	// "Tayyorlandi" for an order's TypeSklad part: only for the sklad types assigned to the user (users.type_sklads).
	const userTypeSkladIds = new Set(userInfo ? getUserTypeSkladIds(userInfo) : []);
	const canMarkTypeSkladReady = (typeSkladId: number) => userTypeSkladIds.has(typeSkladId);

	return {
		roleKey,
		currentUserId,
		isSuperAdmin,
		isManager,
		canConfirmClients,
		canSendTelegramBroadcast,
		canViewWarehouseProducts,
		canExportWarehouseProducts,
		canViewWarehouseProductsTotal,
		canSendProductToTelegram,
		canManageOrderCart,
		canViewDebtRepaymentDrafts,
		canViewProductCategories,
		canEditProductCategories,
		isAdmin,
		canDeleteOrders,
		canManageConsignor,
		canEditConsignor,
		hasTopLevelConsignorMenu,
		canViewMyDebts,
		canViewClientDebtors,
		canManageMyDebts,
		isSkladManager,
		canManageWarehouse,
		canViewWarehousePrices,
		canImport,
		canViewWarehouseReport,
		canViewClients,
		canEditSklad,
		canEditSkladImport,
		canEditOwned,
		canEditGivenCount,
		canEditOrder,
		canEditCustomerOrder,
		canEditDebtRepayment,
		canEditVozvratOrder,
		canViewChangeLogs,
		canMarkTypeSkladReady,
		homePath: getHomePath(roleKey),
		canViewOrderAndDebt,
		canDownloadOrderDebtPdf1,
		canDownloadOrderDebtPdf2,
		canDownloadOrderDebtPdf3,
	};
}
