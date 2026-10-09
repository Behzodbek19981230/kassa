import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import {
	Badge,
	Button,
	Combobox,
	PageHeader,
	Panel,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { formatNumber } from '@/lib/number';
import { useConsignorQuery } from '@/services/consignor/consignor.queries';
import { useLogisticsWarehouseQuery } from '@/services/logistics-warehouse/logistics-warehouse.queries';
import { useImportOrdersQuery } from '@/services/two-stage-import/two-stage-import.queries';
import type {
	ImportOrderListItem,
	ImportOrderStatus,
	ImportStage,
} from '@/services/two-stage-import/two-stage-import.types';
import {
	loadConsignorOptions,
	createLogisticsWarehouseLoader,
	logisticsWarehouseLabel,
} from '@/pages/TwoStageImport/options';
import CancelOrderModal from '@/pages/TwoStageImport/components/CancelOrderModal';
import LocalReceiptModal from '@/pages/TwoStageImport/components/LocalReceiptModal';
import TransitArrivalModal from '@/pages/TwoStageImport/components/TransitArrivalModal';
import {
	ORDER_STATUS_LABELS,
	ORDER_STATUS_OPTIONS,
	ORDER_STATUS_VARIANTS,
	SCROLL_AREA_CLASS,
	SCROLL_BODY_CLASS,
	SCROLL_PANEL_CLASS,
	STAGE_OPTIONS,
	formatTashkentDate,
} from '@/pages/TwoStageImport/utils';

type OrderAction = { kind: 'arrival' | 'receipt' | 'cancel'; order: ImportOrderListItem };

const loadWarehouseOptions = createLogisticsWarehouseLoader();

// The step a row opens. An order in transit opens its next step. A draft opens the cancel dialog.
function primaryAction(order: ImportOrderListItem): OrderAction | null {
	if (order.status === 'DRAFT') return { kind: 'cancel', order };
	if (order.status !== 'IN_ROAD') return null;
	return order.stage === 'CHINA_TO_TRANSIT' ? { kind: 'arrival', order } : { kind: 'receipt', order };
}

export default function ImportOrdersPage() {
	const navigate = useNavigate();
	const { canWrite } = useCurrentCompany();

	const [consignorFilter, setConsignorFilter] = useState('');
	const [stageFilter, setStageFilter] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [sourceFilter, setSourceFilter] = useState('');
	const [destinationFilter, setDestinationFilter] = useState('');
	const [action, setAction] = useState<OrderAction | null>(null);

	const { data: selectedConsignor } = useConsignorQuery(consignorFilter ? Number(consignorFilter) : undefined);
	const { data: selectedSource } = useLogisticsWarehouseQuery(sourceFilter ? Number(sourceFilter) : undefined);
	const { data: selectedDestination } = useLogisticsWarehouseQuery(
		destinationFilter ? Number(destinationFilter) : undefined,
	);

	const ordersQuery = useImportOrdersQuery({
		consignor: consignorFilter ? Number(consignorFilter) : undefined,
		stage: (stageFilter as ImportStage) || undefined,
		status: (statusFilter as ImportOrderStatus) || undefined,
		source_logistics_warehouse: sourceFilter ? Number(sourceFilter) : undefined,
		destination_logistics_warehouse: destinationFilter ? Number(destinationFilter) : undefined,
	});
	const orders = ordersQuery.data ?? [];

	const closeAction = (open: boolean) => !open && setAction(null);

	return (
		<>
			<PageHeader
				title='Import buyurtmalar'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Ikki bosqichli import' },
					{ label: 'Import buyurtmalar', active: true },
				]}
			/>

			<Panel
				title="Import buyurtmalar ro'yxati"
					className={SCROLL_PANEL_CLASS}
					bodyClassName={SCROLL_BODY_CLASS}
				onReload={() => ordersQuery.refetch()}
				actions={
					canWrite && (
						<Button type='button' variant='danger' size='xs' onClick={() => navigate('/two-stage-import/china-dispatch')}>
							<FaPlus className='mr-1.5' /> Xitoydan yuk chiqarish
						</Button>
					)
				}
			>
				<div className='-mx-2.5 mb-4 flex flex-wrap gap-y-3'>
					<div className='w-full px-2.5 sm:w-1/2 xl:w-1/4'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Yuk jo'natuvchi:</label>
						<Combobox
							value={consignorFilter}
							onChange={(value) => setConsignorFilter(value)}
							loadOptions={loadConsignorOptions}
							selectedLabel={selectedConsignor?.name}
							placeholder='Barchasi'
							clearable
						/>
					</div>
					<div className='w-full px-2.5 sm:w-1/2 xl:w-1/4'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Bosqich:</label>
						<Combobox
							value={stageFilter}
							onChange={(value) => setStageFilter(value)}
							options={STAGE_OPTIONS}
							placeholder='Barchasi'
							clearable
						/>
					</div>
					<div className='w-full px-2.5 sm:w-1/2 xl:w-1/4'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Holati:</label>
						<Combobox
							value={statusFilter}
							onChange={(value) => setStatusFilter(value)}
							options={ORDER_STATUS_OPTIONS}
							placeholder='Barchasi'
							clearable
						/>
					</div>
					<div className='w-full px-2.5 sm:w-1/2 xl:w-1/4'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Jo'natuvchi sklad:</label>
						<Combobox
							value={sourceFilter}
							onChange={(value) => setSourceFilter(value)}
							loadOptions={loadWarehouseOptions}
							selectedLabel={selectedSource ? logisticsWarehouseLabel(selectedSource) : undefined}
							placeholder='Barchasi'
							clearable
						/>
					</div>
					<div className='w-full px-2.5 sm:w-1/2 xl:w-1/4'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Qabul qiluvchi sklad:</label>
						<Combobox
							value={destinationFilter}
							onChange={(value) => setDestinationFilter(value)}
							loadOptions={loadWarehouseOptions}
							selectedLabel={selectedDestination ? logisticsWarehouseLabel(selectedDestination) : undefined}
							placeholder='Barchasi'
							clearable
						/>
					</div>
				</div>

				<div className={SCROLL_AREA_CLASS}>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='bg-ca-theme text-white'>#</TableHead>
								<TableHead className='bg-ca-theme text-white'>Import №</TableHead>
								<TableHead className='bg-ca-theme text-white'>Sana</TableHead>
								<TableHead className='bg-ca-theme text-white'>Yuk jo'natuvchi</TableHead>
								<TableHead className='bg-ca-theme text-white'>Yo'nalish</TableHead>
								<TableHead className='bg-ca-theme text-white'>Jami soni</TableHead>
								<TableHead className='bg-ca-theme text-white'>Jami ($)</TableHead>
								<TableHead className='bg-ca-theme text-white'>Fura</TableHead>
								<TableHead className='bg-ca-theme text-white'>Holati</TableHead>
								<TableHead className='bg-ca-theme text-white'>Amal</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{ordersQuery.isLoading && (
								<TableRow>
									<TableCell colSpan={10} className='text-center'>
										Yuklanmoqda...
									</TableCell>
								</TableRow>
							)}
							{!ordersQuery.isLoading && ordersQuery.isError && (
								<TableRow>
									<TableCell colSpan={10} className='text-center text-ca-red'>
										<FaExclamationTriangle className='mr-1.5 inline' />{' '}
										{getApiErrorMessage(ordersQuery.error, 'Xatolik yuz berdi')}
									</TableCell>
								</TableRow>
							)}
							{!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 && (
								<TableRow>
									<TableCell colSpan={10} className='text-center'>
										Ma'lumot topilmadi
									</TableCell>
								</TableRow>
							)}
							{orders.map((order, index) => (
								<TableRow key={order.id} onClick={() => { const next = primaryAction(order); if (canWrite && next) setAction(next); }} className={canWrite && primaryAction(order) ? 'cursor-pointer hover:bg-ca-table-hover' : undefined}>
									<TableCell>{index + 1}</TableCell>
									<TableCell className='font-semibold text-ca-heading'>
										{order.two_stage_import_detail?.import_number ?? order.order_number}
									</TableCell>
									<TableCell>{formatTashkentDate(order.order_datetime)}</TableCell>
									<TableCell>{order.consignor_detail?.name ?? '-'}</TableCell>
									<TableCell>
										{order.source_logistics_warehouse_detail?.name ?? '-'} → {order.destination_logistics_warehouse_detail?.name ?? '-'}
									</TableCell>
									<TableCell>{formatNumber(order.total_quantity ?? 0)}</TableCell>
									<TableCell className='font-semibold'>{formatNumber(order.total_dollar ?? 0, 2)} $</TableCell>
									<TableCell>{order.truck_number ?? '-'}</TableCell>
									<TableCell>
										<Badge variant={ORDER_STATUS_VARIANTS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
									</TableCell>
									<TableCell>
										{canWrite && primaryAction(order) && (
											<Button
												type='button'
												variant='danger'
												size='xs'
												onClick={(e) => {
													e.stopPropagation();
													setAction(primaryAction(order));
												}}
											>
												{primaryAction(order)?.kind === 'cancel' ? 'Bekor qilish' : 'Tasdiqlash'}
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</Panel>

			{action?.kind === 'arrival' && (
				<TransitArrivalModal
					open
					setOpen={closeAction}
					order={action.order}
					onCancelOrder={() => setAction({ kind: 'cancel', order: action.order })}
				/>
			)}
			{action?.kind === 'receipt' && <LocalReceiptModal
				open
				setOpen={closeAction}
				order={action.order}
				onCancelOrder={() => setAction({ kind: 'cancel', order: action.order })}
			/>}
			{action?.kind === 'cancel' && <CancelOrderModal open setOpen={closeAction} order={action.order} />}
		</>
	);
}
