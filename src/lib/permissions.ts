import { useUserInfoQuery } from '@/services/user/user.queries';

const ROLE = {
	SUPER_ADMIN: 'Super Admin',
	MANAGER: 'Manager',
	SKLAD_MANAGER: 'Sklad Manager',
	SKLAD_XODIM: 'Sklad Xodim',
	SOTUVCHI: 'Sotuvchi',
} as const;

// Roles that bypass ownership checks entirely. An allowlist (rather than a
// blocklist of restricted roles) so an unrecognized/future role name
// defaults to the safer own-records-only behavior instead of silently
// getting unrestricted access.
const UNRESTRICTED_ROLES: string[] = [ROLE.SUPER_ADMIN, ROLE.MANAGER];

export function usePermissions() {
	const { data: userInfo } = useUserInfoQuery();
	const roleName = userInfo?.roles?.name ?? null;
	const currentUserId = userInfo?.id ?? null;

	const isSuperAdmin = roleName === ROLE.SUPER_ADMIN;
	const isSkladManager = roleName === ROLE.SKLAD_MANAGER;
	const isSkladXodim = roleName === ROLE.SKLAD_XODIM;

	// consignor / warehouse (pricing): full CRUD only for Super Admin + Sklad Manager
	const canManageConsignor = isSuperAdmin || isSkladManager;
	const canManageWarehouse = isSuperAdmin || isSkladManager;

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
		if (!roleName) return false;
		if (UNRESTRICTED_ROLES.includes(roleName)) return true;
		return item.created_by === currentUserId;
	}

	// order-account-history/{id}/change-logs: closed for every role except Super Admin
	const canViewChangeLogs = isSuperAdmin;

	return {
		roleName,
		currentUserId,
		isSuperAdmin,
		canManageConsignor,
		canManageWarehouse,
		canEditSklad,
		canEditOwned,
		canViewChangeLogs,
	};
}
