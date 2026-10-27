import { useUserInfoQuery } from '@/services/user/user.queries';

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
const UNRESTRICTED_ROLES: string[] = [ROLE.SUPER_ADMIN, ROLE.MANAGER];

export function usePermissions() {
	const { data: userInfo } = useUserInfoQuery();
	const roleKey = userInfo?.roles?.key ?? null;
	const currentUserId = userInfo?.id ?? null;

	const isSuperAdmin = roleKey === ROLE.SUPER_ADMIN;
	const isAdmin = roleKey === ROLE.ADMIN;
	const isSkladManager = roleKey === ROLE.SKLAD_MANAGER;
	const isSkladXodim = roleKey === ROLE.SKLAD_XODIM;

	const isManager = roleKey === ROLE.MANAGER;

	// import ('Import qilish'): Super Admin + Sklad Manager only
	const canImport = isSuperAdmin || isSkladManager;

	// "Tasdiqlanmagan mijozlar" (new Telegram clients awaiting confirmation): Super Admin + Admin
	const canConfirmClients = isSuperAdmin || isAdmin;
	// "Telegram xabarnoma": Super Admin + Admin + Manager
	const canSendTelegramBroadcast = isSuperAdmin || isAdmin || isManager;
	// "Ombor mahsulotlari" menu: Super Admin + Admin + Manager + Sklad Manager
	const canViewWarehouseProducts = isSuperAdmin || isAdmin || isManager || isSkladManager;
	// "Ombor mahsulotlari" Excel export: Super Admin only
	const canExportWarehouseProducts = isSuperAdmin;
	// "Ombor mahsulotlari" Telegram send ("Harakatlar" column): Super Admin + Admin + Manager
	const canSendProductToTelegram = isSuperAdmin || isAdmin || isManager;
	// "Karzinka" button on the order history (/order-cart) and "Buyurtma Karzinka" (/cart-drafts): Super Admin + Admin
	const canManageOrderCart = isSuperAdmin || isAdmin;
	// Delete in "Mijoz buyurtmalar tarixi" (Draftga olish) and "Vozvrat buyurtmalar tarixi": Super Admin + Admin
	const canDeleteOrders = isSuperAdmin || isAdmin;

	// consignor: full CRUD only for Super Admin + Sklad Manager
	const canManageConsignor = isSuperAdmin || isSkladManager;
	// warehouse (pricing): add / edit / delete only for Super Admin
	const canManageWarehouse = isSuperAdmin;

	// "Mijozlar" menu + pages: Super Admin + Admin
	const canViewClients = isSuperAdmin || isAdmin;

	// "Omborxona hisobi" menu + pages: Super Admin + Sklad Manager
	const canViewWarehouseReport = isSuperAdmin || isSkladManager;

	// sklad ("Omborxona hisobi"): Super Admin + Sklad Manager unrestricted;
	// Sklad Xodim only their own imports; everyone else (Manager, Sotuvchi) read-only.
	function canEditSklad(item: { created_by?: number | null }) {
		if (isSuperAdmin || isSkladManager) return true;
		if (isSkladXodim) return item.created_by === currentUserId;
		return false;
	}

	// order-account-history / debt-repayment / vozvrat-order / product-account-history:
	// Super Admin + Manager unrestricted; every other role only their own records.
	function canEditOwned(item: { created_by?: number | string | null }) {
		if (!roleKey) return false;
		if (UNRESTRICTED_ROLES.includes(roleKey)) return true;
		return item.created_by === currentUserId;
	}

	// "Mijoz buyurtmalar tarixi" / "Vozvrat buyurtmalar tarixi" edit (Tahrirlash): Super Admin, or whoever created the order.
	function canEditOrder(item: { created_by?: number | null }) {
		if (isSuperAdmin) return true;
		return currentUserId != null && item.created_by === currentUserId;
	}

	// order-account-history/{id}/change-logs: closed for every role except Super Admin
	const canViewChangeLogs = isSuperAdmin;

	return {
		roleKey,
		currentUserId,
		isSuperAdmin,
		isManager,
		canConfirmClients,
		canSendTelegramBroadcast,
		canViewWarehouseProducts,
		canExportWarehouseProducts,
		canSendProductToTelegram,
		canManageOrderCart,
		canDeleteOrders,
		canManageConsignor,
		canManageWarehouse,
		canImport,
		canViewWarehouseReport,
		canViewClients,
		canEditSklad,
		canEditOwned,
		canEditOrder,
		canViewChangeLogs,
	};
}
