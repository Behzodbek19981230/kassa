import type { PaginatedResponse, PaginationMeta } from '@/services/api/types';

/** Money always arrives as a string with 2 decimals: `"20000000.00"`. */
export type Money = string;

/**
 * `user_type`: which kassa a record belongs to — the `User.type` of whoever created it
 * (1 Do'kon sotuvchisi, 2 Sklad sotuvchisi, 3 Dastavka sotuvchisi). Each type has its own
 * period, numbering, balance and closings; the company kassa is the sum of the three.
 */
export type CashRegisterType = 1 | 2 | 3;

export type CashChannelKind = 'cash_som' | 'cash_usd' | 'transfer' | 'card';
export type CashSourceKind = 'order' | 'debt' | 'expense' | 'vozvrat' | 'correction';

/** Identity of one kassa channel. `code` is `cash_som` | `cash_usd` | `transfer` | `card:<id>` | `card:none`. */
export interface CashChannelBase {
	code: string;
	channel: CashChannelKind;
	card: number | null;
	card_name: string | null;
	card_type: string | null;
	last4: string | null;
}

export interface CashRegisterChannel extends CashChannelBase {
	/** Technical value, never shown. */
	snapshot_total: Money;
	opening: Money;
	turnover: Money;
	/** `null` on the initial closing. */
	expected: Money | null;
	expected_usd: Money | null;
}

export interface CashSourceRow {
	source: CashSourceKind;
	label: string;
	/** `null` for `correction` (its count comes from `movements.counts.correction`). */
	count: number | null;
	/** `{ code: money }` — one value per channel code. */
	amounts: Record<string, Money>;
	/** Only on the daily report. */
	total_usd?: Money | null;
}

export interface CashClosingRef {
	id: number;
	number: number;
	closed_at: string;
	created_by_name: string;
}

/** One user who entered records in a period, with the turnover of their new records (corrections aren't split). */
export interface CashSeller {
	user: number | null;
	name: string;
	count: number;
	/** `{ code: money }`. */
	amounts: Record<string, Money>;
}

export interface CashRegisterCurrent {
	user_type: CashRegisterType;
	user_type_label: string;
	is_initial: boolean;
	period_start: string | null;
	previous: CashClosingRef | null;
	exchange_rate: Money | null;
	state_token: string;
	channels: CashRegisterChannel[];
	sources: CashSourceRow[];
	/** Records created in the period, corrections excluded (= Σ sources[].count). */
	count: number;
	/** Most records first; `[]` on the initial closing. Feeds the "Sotuvchi" filter of the open period. */
	sellers: CashSeller[];
	totals: { opening_usd: Money | null; turnover_usd: Money | null; expected_usd: Money | null } | null;
}

export interface CashRegisterDailyChannel extends CashChannelBase {
	income: Money;
	outcome: Money;
	net: Money;
	net_usd: Money | null;
}

export interface CashRegisterDaily {
	/** `null` = the whole company (an admin asked without `user_type`). */
	user_type: CashRegisterType | null;
	date: string;
	day_start: string;
	day_end: string;
	is_today: boolean;
	exchange_rate: Money | null;
	channels: CashRegisterDailyChannel[];
	sources: CashSourceRow[];
	totals: { count: number; income_usd: Money | null; outcome_usd: Money | null; net_usd: Money | null };
}

export type CashMovementAction = 'create' | 'update' | 'delete' | 'other';

export interface CashMovementCard {
	card: number;
	card_name: string;
	card_type: string;
	last4: string;
	amount: Money;
}

export interface CashMovement {
	kind: CashSourceKind;
	action: CashMovementAction;
	source: CashSourceKind | null;
	id: number | null;
	created_time: string;
	title: string;
	som: Money;
	usd: Money;
	transfer: Money;
	card: Money;
	cards: CashMovementCard[];
	/** Legacy: username for records, full name for corrections. Show `created_by_name`. */
	created_by: string;
	/** "Kim": who entered the record, or who changed it for a correction; `null` / `""` on the detail-less row. */
	created_by_id: number | null;
	created_by_name: string;
}

export type CashMovementCounts = Record<CashSourceKind, number>;

export interface CashMovementsResponse {
	pagination: PaginationMeta;
	results: CashMovement[];
	/** For the tab titles: the whole period of the kassa, ignoring both `kind` and `created_by`. */
	counts: CashMovementCounts;
	filters: unknown;
}

export interface CashMovementsParams {
	/** Required (for admins) on the open period; not needed with `closing`, optional with `date`. */
	user_type?: CashRegisterType;
	/** Comma-separated kinds; empty = all. */
	kind?: string;
	/** One seller: their records and the corrections of their records. */
	created_by?: number;
	closing?: number;
	date?: string;
	page?: number;
	limit?: number;
}

export interface CashClosingLinePayload {
	channel: CashChannelKind;
	card: number | null;
	actual: string;
	handed_over: string;
}

export interface CashClosingPayload {
	user_type: CashRegisterType;
	state_token: string;
	lines: CashClosingLinePayload[];
	comment: string;
	received_by: number | null;
}

export type CashClosingStatus = 'closed' | 'cancelled';
export type CashClosingResult = 'exact' | 'shortage' | 'surplus';

export interface CashClosing {
	id: number;
	company: number;
	/** `null` only on closings made before the kassa was split by type ("Umumiy (eski)"). */
	user_type: CashRegisterType | null;
	user_type_display: string | null;
	/** Counted separately inside each type: Do'kon #6 and Sklad #3 are unrelated. */
	number: number;
	status: CashClosingStatus;
	status_display: string;
	result: CashClosingResult;
	result_display: string;
	is_initial: boolean;
	period_start: string | null;
	closed_at: string;
	created_by: number | null;
	created_by_name: string | null;
	received_by: number | null;
	received_by_name: string | null;
	comment: string;
	exchange_rate: Money | null;
	total_expected_usd: Money | null;
	total_actual_usd: Money | null;
	total_difference_usd: Money | null;
	total_handed_over_usd: Money | null;
	total_rest_usd: Money | null;
	cancelled_at: string | null;
	cancelled_by: number | null;
	cancelled_by_name: string | null;
	cancel_reason: string;
	created_time: string;
}

export interface CashClosingLine extends CashChannelBase {
	id: number;
	closing: number;
	channel_display: string;
	snapshot_total: Money;
	opening: Money;
	turnover: Money;
	expected: Money;
	actual: Money;
	difference: Money;
	handed_over: Money;
	rest: Money;
	expected_usd: Money | null;
	actual_usd: Money | null;
	difference_usd: Money | null;
}

export interface CashClosingDetail extends CashClosing {
	lines: CashClosingLine[];
	sources: CashSourceRow[];
	/** Frozen when the closing was made; `[]` on old closings. */
	sellers: CashSeller[];
}

export interface CashClosingStats {
	total: number;
	this_month: number;
	exact: number;
	shortage: number;
	surplus: number;
	cancelled: number;
	shortage_usd: Money | null;
	surplus_usd: Money | null;
}

export interface CashClosingListResponse extends PaginatedResponse<CashClosing> {
	stats: CashClosingStats;
}

export interface CashClosingListParams {
	user_type?: CashRegisterType;
	/** `true` → only the pre-split company closings. */
	user_type__isnull?: boolean;
	status?: CashClosingStatus;
	result?: CashClosingResult;
	is_initial?: boolean;
	number?: number;
	created_by?: number;
	received_by?: number;
	closed_at__gte?: string;
	closed_at__lte?: string;
	search?: string;
	ordering?: string;
	page?: number;
	limit?: number;
}

/** One kassa type on "Umumiy holat". `count`, `amounts` and `expected_usd` are `null` while it `is_initial`. */
export interface CashRegisterSummaryRow {
	user_type: CashRegisterType;
	user_type_label: string;
	is_initial: boolean;
	period_start: string | null;
	previous: CashClosingRef | null;
	/** Records created in the open period, corrections excluded. */
	count: number | null;
	/** `{ code: expected }` ("Dasturda" per channel). */
	amounts: Record<string, Money> | null;
	/** Same as that type's `current.totals.expected_usd`. */
	expected_usd: Money | null;
}

/** `GET cash-register/summary/` (Super Admin / Admin): the three kassas side by side. */
export interface CashRegisterSummary {
	exchange_rate: Money | null;
	/** Union of every type's channels, in the usual channel order. */
	channels: CashChannelBase[];
	/** Always three rows: 1, 2, 3. */
	types: CashRegisterSummaryRow[];
	/**
	 * Sum of the types that are past their initial closing; `initial_types` lists the others, and while it is
	 * not empty the total isn't the whole company kassa.
	 */
	totals: {
		count: number;
		amounts: Record<string, Money>;
		expected_usd: Money | null;
		initial_types: CashRegisterType[];
	};
}

/** 409 body of `POST cash-closing/`: the kassa changed after the form was opened. */
export interface CashClosingConflict {
	detail: string;
	current: CashRegisterCurrent;
}
