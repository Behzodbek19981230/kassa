import type { ReactNode } from 'react';

export type SidebarIcon =
	| 'dashboard'
	| 'boxes'
	| 'cart'
	| 'history'
	| 'balance-scale'
	| 'chart-pie'
	| 'undo'
	| 'file-invoice'
	| 'tags'
	| 'truck'
	| 'warehouse'
	| 'bookmark'
	| 'cogs'
	| 'layer-group'
	| 'ruler-combined'
	| 'shipping-fast'
	| 'check-circle'
	| 'exclamation-triangle'
	| 'users-cog'
	| 'chart-bar'
	| 'receipt'
	| 'building'
	| 'info-circle'
	| 'users'
	| 'settings'
	| 'paper-plane'
	| 'globe';

/** Permission flags a menu item's visibility can be gated on; see src/utils/sidebarUtils.ts. */
export interface SidebarMenuPermissions {
	isAdminOrManager: boolean;
	isSuperAdmin: boolean;
	/** Admin gets "Mahsulot toifalari" under "Sozlamalar" (Super Admin has it under "Tizim boshqaruvi"). */
	isAdmin: boolean;
	canManageConsignor: boolean;
	isSkladManager: boolean;
	/** Sklad Manager and Manager get "Yuk jo'natuvchilar" as a top-level menu item (Super Admin has it under "Tizim boshqaruvi"). */
	hasTopLevelConsignorMenu: boolean;
	canManageWarehouse: boolean;
	canViewWarehousePrices: boolean;
	canImport: boolean;
	canViewWarehouseProducts: boolean;
	canManageOrderCart: boolean;
	canViewDebtRepaymentDrafts: boolean;
	canViewWarehouseReport: boolean;
	canViewClients: boolean;
	canViewOrderAndDebt: boolean;
	canViewMyDebts: boolean;
	canViewClientDebtors: boolean;
	/** True for the Manager role, which only gets a trimmed-down "Tizim boshqaruvi"/"Sozlamalar". */
	isManager: boolean;
	isNotManager: boolean;
}

export interface SidebarMenuItem {
	id: string;
	type?: 'header';
	label: string;
	icon?: SidebarIcon;
	path?: string;
	badge?: string;
	tag?: string;
	children?: SidebarMenuItem[];
	/** If set, the item (and its children) is hidden unless this permission flag is true. */
	requiredPermission?: keyof SidebarMenuPermissions;
}

export interface TableRow {
	engine: string;
	browser: string;
	platform: string;
	version: string;
	grade: string;
}

export interface AdvancedTableRow {
	id: number;
	name: string;
	position: string;
	office: string;
	age: number;
	startDate: string;
	salary: string;
	status: 'Active' | 'Inactive';
	notes: string;
}

export interface PanelProps {
	title: ReactNode;
	children: ReactNode;
	actions?: ReactNode;
	toolbar?: ReactNode;
	footer?: ReactNode;
	className?: string;
	bodyClassName?: string;
	headerClassName?: string;
	onExpand?: () => void;
	onReload?: () => void;
	onCollapse?: () => void;
	onRemove?: () => void;
}

