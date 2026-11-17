import type { PaginatedResponse, PaginationMeta } from '@/services/api/types';

/** Money always arrives as a string with 2 decimals: `"20000000.00"`. */
export type Money = string;

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

export interface CashRegisterCurrent {
	is_initial: boolean;
	period_start: string | null;
	previous: CashClosingRef | null;
	exchange_rate: Money | null;
	state_token: string;
	channels: CashRegisterChannel[];
	sources: CashSourceRow[];
	totals: { opening_usd: Money | null; turnover_usd: Money | null; expected_usd: Money | null } | null;
}

export interface CashRegisterDailyChannel extends CashChannelBase {
	income: Money;
	outcome: Money;
	net: Money;
	net_usd: Money | null;
}

export interface CashRegisterDaily {
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
	created_by: string;
}

export type CashMovementCounts = Record<CashSourceKind, number>;

export interface CashMovementsResponse {
	pagination: PaginationMeta;
	results: CashMovement[];
	counts: CashMovementCounts;
	filters: unknown;
}

export interface CashMovementsParams {
	/** Comma-separated kinds; empty = all. */
	kind?: string;
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

/** 409 body of `POST cash-closing/`: the kassa changed after the form was opened. */
export interface CashClosingConflict {
	detail: string;
	current: CashRegisterCurrent;
}
