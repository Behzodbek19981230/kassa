import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePermissions } from '@/lib/permissions';
import type { CashRegisterType } from '@/services/cash-register/cash-register.types';
import { useUserInfoQuery } from '@/services/user/user.queries';
import { userFullName } from '@/services/user/user.types';

interface KassaTypeInfo {
	type: CashRegisterType;
	label: string;
	short: string;
	/** "dastavka sotuvchilari": who fills this kassa, mid-sentence. */
	plural: string;
	/** Text, dot and underline colour of the type everywhere in the kassa. */
	text: string;
	dot: string;
	border: string;
	underline: string;
}

/** The three kassas, one per seller type (`users_user.type`). */
export const KASSA_TYPES: KassaTypeInfo[] = [
	{
		type: 1,
		label: "Do'kon sotuvchisi",
		short: "Do'kon",
		plural: "do'kon sotuvchilari",
		text: 'text-ca-theme',
		dot: 'bg-ca-theme',
		border: 'border-ca-theme',
		underline: 'shadow-[inset_0_-2px_0_var(--color-ca-theme)]',
	},
	{
		type: 2,
		label: 'Sklad sotuvchisi',
		short: 'Sklad',
		plural: 'sklad sotuvchilari',
		text: 'text-violet-500',
		dot: 'bg-violet-500',
		border: 'border-violet-500',
		underline: 'shadow-[inset_0_-2px_0_var(--color-violet-500)]',
	},
	{
		type: 3,
		label: 'Dastavka sotuvchisi',
		short: 'Dastavka',
		plural: 'dastavka sotuvchilari',
		text: 'text-amber-500',
		dot: 'bg-amber-500',
		border: 'border-amber-500',
		underline: 'shadow-[inset_0_-2px_0_var(--color-amber-500)]',
	},
];

export function isKassaType(value: unknown): value is CashRegisterType {
	return value === 1 || value === 2 || value === 3;
}

export function kassaTypeInfo(type: CashRegisterType): KassaTypeInfo {
	return KASSA_TYPES.find((t) => t.type === type) ?? KASSA_TYPES[0];
}

/** "Do'kon sotuvchisi" / "Do'kon". */
export function kassaTypeLabel(type: CashRegisterType, short = false) {
	const info = kassaTypeInfo(type);
	return short ? info.short : info.label;
}

/** A closing's type label; closings from before the split (`null`) covered the whole company. */
export function closingTypeLabel(type: CashRegisterType | null, short = false) {
	if (type === null) return short ? 'Umumiy' : 'Umumiy (eski)';
	return kassaTypeLabel(type, short);
}

/** "dastavka sotuvchilari". */
export function kassaTypePlural(type: CashRegisterType) {
	return kassaTypeInfo(type).plural;
}

/** `?type=` value → kassa type, or null when missing / not 1–3. */
export function parseKassaType(value: string | null | undefined): CashRegisterType | null {
	const n = Number(value);
	return isKassaType(n) ? n : null;
}

// The last kassa an admin looked at, so moving between the kassa pages through the menu keeps it.
const STORAGE_KEY = 'kassa:last-type';

function readStoredType(): CashRegisterType | null {
	try {
		return parseKassaType(localStorage.getItem(STORAGE_KEY));
	} catch {
		return null;
	}
}

function storeType(type: CashRegisterType) {
	try {
		localStorage.setItem(STORAGE_KEY, String(type));
	} catch {
		// Storage blocked (private window): the type is still in the URL.
	}
}

export interface KassaTypeState {
	type: CashRegisterType;
	/** Super Admin / Admin: may switch between the three kassas. Others are held to their own type. */
	canPickType: boolean;
	/** Switches the kassa in the URL; the page number and the seller filter belong to the old kassa, so they go. */
	setType: (type: CashRegisterType) => void;
	/** The logged-in user: shown as "Topshiruvchi" on the closing form. */
	userName: string;
	userType: CashRegisterType | null;
}

/**
 * The kassa type of the current page. Admins: `?type=`, else the last one they looked at, else their own type,
 * else Do'kon. Everyone else: their own `type`, whatever the URL says (the server checks the same).
 * `type` is null while the user is loading, or when a non-admin has no type 1–3.
 */
export function useKassaType(): { state: KassaTypeState | null; loading: boolean } {
	const [searchParams, setSearchParams] = useSearchParams();
	const { canViewAllKassaTypes } = usePermissions();
	const { data: user, isLoading } = useUserInfoQuery();
	const userType = isKassaType(user?.type) ? user.type : null;
	const urlType = parseKassaType(searchParams.get('type'));

	const type = canViewAllKassaTypes ? (urlType ?? readStoredType() ?? userType ?? 1) : userType;

	useEffect(() => {
		if (canViewAllKassaTypes && urlType) storeType(urlType);
	}, [canViewAllKassaTypes, urlType]);

	if (isLoading || !user || type === null) return { state: null, loading: isLoading };

	return {
		loading: false,
		state: {
			type,
			canPickType: canViewAllKassaTypes,
			userName: userFullName(user),
			userType,
			setType: (next) => {
				storeType(next);
				const params = new URLSearchParams(searchParams);
				params.set('type', String(next));
				params.delete('page');
				params.delete('created_by');
				setSearchParams(params, { replace: true });
			},
		},
	};
}
