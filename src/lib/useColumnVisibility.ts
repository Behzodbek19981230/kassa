import { useEffect, useMemo, useRef, useState } from 'react';
import { useSaveUserColumnMutation, useUserColumnQuery } from '@/services/user-columns/user-columns.queries';
import { usePermissions } from '@/lib/permissions';
import { useUserInfoQuery } from '@/services/user/user.queries';

export interface ColumnVisibilityDef {
	id: string;
	label: string;
	/** Set to false for columns that must always stay visible (row number, actions...). */
	hideable?: boolean;
	/** Set to true for columns only Super Admin may see (cost prices...). Hidden for every other role. */
	superAdminOnly?: boolean;
}

export interface ColumnVisibilityState {
	columns: ColumnVisibilityDef[];
	isVisible: (id: string) => boolean;
	setVisible: (id: string, visible: boolean) => void;
	/** Number of currently visible columns — use it for `colSpan` on full-width rows. */
	visibleCount: number;
}

/**
 * Column show/hide state for hand-built `<Table>`s, persisted per user under `key` via
 * `/user-columns/` — the same storage `DataTable`'s `columnVisibilityKey` uses.
 */
export function useColumnVisibility(key: string, allColumns: ColumnVisibilityDef[]): ColumnVisibilityState {
	const { isSuperAdmin } = usePermissions();
	const columns = useMemo(
		() => (isSuperAdmin ? allColumns : allColumns.filter((c) => !c.superAdminOnly)),
		[allColumns, isSuperAdmin],
	);
	const [visibility, setVisibility] = useState<Record<string, boolean>>({});
	const { data: currentUser } = useUserInfoQuery();
	const currentUserId = currentUser?.id ?? null;
	const { data: saved } = useUserColumnQuery(currentUserId, key);
	const saveMutation = useSaveUserColumnMutation();
	const hydratedRef = useRef(false);

	useEffect(() => {
		if (hydratedRef.current || saved === undefined) return;
		if (saved?.text) {
			try {
				setVisibility(JSON.parse(saved.text));
			} catch {
				// ignore malformed saved column-visibility state
			}
		}
		hydratedRef.current = true;
	}, [saved]);

	const isVisible = (id: string) => {
		const def = allColumns.find((c) => c.id === id);
		if (def?.superAdminOnly && !isSuperAdmin) return false;
		if (def?.hideable === false) return true;
		return visibility[id] ?? true;
	};

	const setVisible = (id: string, visible: boolean) => {
		const next = { ...visibility, [id]: visible };
		setVisibility(next);
		if (currentUserId == null) return;
		const full: Record<string, boolean> = {};
		for (const col of columns) {
			if (col.hideable === false) continue;
			full[col.id] = next[col.id] ?? true;
		}
		saveMutation.mutate({ id: saved?.id, payload: { user: currentUserId, key, text: JSON.stringify(full) } });
	};

	const visibleCount = useMemo(
		() => columns.filter((c) => c.hideable === false || (visibility[c.id] ?? true)).length,
		[columns, visibility],
	);

	return { columns, isVisible, setVisible, visibleCount };
}
