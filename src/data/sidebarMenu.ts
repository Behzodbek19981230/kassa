import type { SidebarMenuItem } from '@/types';

export const sidebarMenu: SidebarMenuItem[] = [
	{ id: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: '/', requiredPermission: 'isAdminOrManager' },
	{ id: 'warehouse-products', icon: 'boxes', label: 'Ombor mahsulotlari', path: '/warehouse-products' },
	{ id: 'place-order', icon: 'cart', label: 'Buyurtma qilish', path: '/place-order' },
	{
		id: 'customer-order-history',
		icon: 'history',
		label: 'Mijoz buyurtmalar tarixi',
		path: '/customer-order-history',
	},
	{ id: 'orders-debts', icon: 'chart-pie', label: 'Buyurtmalar va qarzlar', path: '/order-and-debt' },
	{ id: 'return', icon: 'undo', label: 'Vozvrat', path: '/vozvrat' },
	{ id: 'return-history', icon: 'file-invoice', label: 'Vozvrat buyurtmalar tarixi', path: '/vozvrat-order-history' },
	{
		id: 'goods-prices',
		icon: 'tags',
		label: 'Tovarlar va Narxlar',
		path: '/warehouse-prices',
		requiredPermission: 'canManageWarehouse',
	},
	{ id: 'import', icon: 'truck', label: 'Import qilish', path: '/import' },
	{ id: 'warehouse-report', icon: 'warehouse', label: 'Omborxona hisobi', path: '/warehouse-report' },
	{
		id: 'my-debts',
		icon: 'bookmark',
		label: 'Mening qarzlarim',
		path: '/my-debts',
		requiredPermission: 'canManageConsignor',
	},
	{
		id: 'system-management',
		icon: 'cogs',
		label: 'Tizim boshqaruvi',
		children: [
			{
				id: 'product-categories',
				icon: 'layer-group',
				label: 'Mahsulot toifalari',
				path: '/system/product-categories',
			},
			{ id: 'models', icon: 'bookmark', label: 'Modellar', path: '/system/models' },
			{
				id: 'product-measurement',
				icon: 'ruler-combined',
				label: "Mahsulot o'lchami",
				path: '/system/product-measurement',
			},
			{
				id: 'shippers',
				icon: 'shipping-fast',
				label: "Yuk jo'natuvchilar",
				path: '/system/consignors',
				requiredPermission: 'canManageConsignor',
			},
			{ id: 'sklad-types', icon: 'warehouse', label: 'Skladlar', path: '/system/sklad-types' },

			{
				id: 'users',
				icon: 'users-cog',
				label: 'Foydalanuvchilar',
				path: '/system/users',
				requiredPermission: 'isSuperAdmin',
			},
			// { id: 'companies', icon: 'building', label: 'Tashkilotlar', path: '/system/companies' },
			// { id: 'locations', icon: 'layer-group', label: 'Hududlar', path: '/system/locations' },
			{
				id: 'profit-loss',
				icon: 'chart-bar',
				label: 'Foyda va zarar',
				path: '#',
				requiredPermission: 'isSuperAdmin',
			},
		],
	},
	{
		id: 'settings',
		icon: 'settings',
		label: 'Sozlamalar',
		children: [
			{ id: 'clients', icon: 'users', label: 'Mijozlar', path: '/settings/clients' },
			{
				id: 'debt-repayments',
				icon: 'balance-scale',
				label: "To'langan qarzlar",
				path: '/settings/debt-repayments',
			},
			{ id: 'order-cart-drafts', icon: 'cart', label: 'Buyurtma Karzinka', path: '/cart-drafts' },
			{
				id: 'debt-payment-cart-drafts',
				icon: 'receipt',
				label: "Qarz to'lov karzinka",
				path: '/settings/debt-repayments-drafts',
			},
		],
	},
];
