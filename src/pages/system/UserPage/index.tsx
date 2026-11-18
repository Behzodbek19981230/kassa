import { useSearchParams } from 'react-router-dom';
import { Tabs } from '@/components/ui';
import { usePermissions } from '@/lib/permissions';
import UserListTab from '@/pages/system/UserPage/components/UserListTab';
import { isUserTab, USER_TAB_CONFIG, USER_TABS, type UserTab } from '@/pages/system/UserPage/userTabs';

/**
 * "Hodimlar": system users, the two kinds of account-only employees and the archive, one tab each.
 * Each role sees only its tabs: Super Admin all four, Admin "Oddiy Do'kon Hodim", Sklad Manager "Oddiy Sklad Hodim".
 */
export default function UserPage() {
	const { canManageSystemUsers, canManageStoreEmployees, canManageSkladEmployees, canViewUserArchive } = usePermissions();
	const [searchParams, setSearchParams] = useSearchParams();

	const visible: Record<UserTab, boolean> = {
		system: canManageSystemUsers,
		store: canManageStoreEmployees,
		sklad: canManageSkladEmployees,
		archive: canViewUserArchive,
	};
	const tabs = USER_TABS.filter((tab) => visible[tab]);
	const requested = searchParams.get('tab');
	const activeTab = isUserTab(requested) && tabs.includes(requested) ? requested : tabs[0];

	if (!activeTab) return null;

	return (
		<Tabs
			value={activeTab}
			// Each tab keeps its own page and filters in the URL; switching starts the new tab fresh.
			onValueChange={(tab) => setSearchParams({ tab })}
			items={tabs.map((tab) => ({
				value: tab,
				label: USER_TAB_CONFIG[tab].label,
				content: <UserListTab tab={tab} />,
			}))}
		/>
	);
}
