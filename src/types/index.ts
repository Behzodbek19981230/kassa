import type { ReactNode } from 'react';

export type SidebarIcon =
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
	| 'settings';

export interface SidebarMenuItem {
	id: string;
	type?: 'header';
	label: string;
	icon?: SidebarIcon;
	path?: string;
	badge?: string;
	tag?: string;
	children?: SidebarMenuItem[];
}

export interface BreadcrumbItem {
	label: string;
	path?: string;
	active?: boolean;
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

export interface WidgetStatsProps {
	color: 'green' | 'blue' | 'purple' | 'red';
	icon: ReactNode;
	title: string;
	value: string;
}

export interface PanelProps {
	title: string;
	children: ReactNode;
	actions?: ReactNode;
	toolbar?: ReactNode;
	footer?: ReactNode;
	className?: string;
	bodyClassName?: string;
	onExpand?: () => void;
	onReload?: () => void;
	onCollapse?: () => void;
	onRemove?: () => void;
}

export interface PageHeaderProps {
	title: string;
	subtitle?: string;
	breadcrumb: BreadcrumbItem[];
}
