import { useMemo } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import {
	Button,
	buttonProps,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	ModalTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import { useCurrentCompany } from '@/lib/company';
import { getApiErrorMessage } from '@/lib/errors';
import { useCountryListQuery } from '@/services/country/country.queries';
import type { LogisticsCompany } from '@/services/logistics-company/logistics-company.types';
import { useLogisticsWarehouseListQuery } from '@/services/logistics-warehouse/logistics-warehouse.queries';
import DeleteLogisticsWarehouseModal from '@/pages/system/LogisticsWarehousePage/components/DeleteLogisticsWarehouseModal';
import LogisticsWarehouseFormModal from '@/pages/system/LogisticsWarehousePage/components/LogisticsWarehouseFormModal';

interface LogisticsCompanyWarehousesModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	company: LogisticsCompany;
}

// The warehouses of one logistics company, with add, edit and delete for that company.
export default function LogisticsCompanyWarehousesModal({ open, setOpen, company }: LogisticsCompanyWarehousesModalProps) {
	const { canWrite } = useCurrentCompany();
	const preset = { id: company.id, name: company.name };

	const { data, isLoading, isFetching, isError, error } = useLogisticsWarehouseListQuery({
		logistics_company: company.id,
		limit: 100,
	});
	// The list is requested for this company. Rows that name another company are dropped as a safety net.
	const warehouses = (data?.results ?? []).filter((w) => (w.logistics_company ?? company.id) === company.id);

	const { data: countriesData } = useCountryListQuery({ limit: 200 });
	const countryNames = useMemo(
		() => new Map((countriesData?.results ?? []).map((c) => [c.id, c.name])),
		[countriesData],
	);

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-3xl'>
				<ModalHeader>
					<ModalTitle>{company.name} — skladlar</ModalTitle>
					<p className='mt-0.5 text-[11px] font-normal text-ca-text'>{warehouses.length} ta sklad</p>
				</ModalHeader>
				<ModalBody>
					{canWrite && (
						<div className='mb-3 flex justify-end'>
							<OpenDialogButton
								element={(props) => <Button {...props} />}
								elementProps={buttonProps("Sklad qo'shish +", 'info', 'xs')}
								dialog={LogisticsWarehouseFormModal}
								dialogProps={{ mode: 'create' as const, presetLogisticsCompany: preset }}
							/>
						</div>
					)}

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='bg-ca-theme text-white'>#</TableHead>
								<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
								<TableHead className='bg-ca-theme text-white'>Davlat</TableHead>
								<TableHead className='bg-ca-theme text-white'>Harakatlar</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading || isFetching ? (
								<TableRow>
									<TableCell colSpan={4} className='text-center'>
										Yuklanmoqda...
									</TableCell>
								</TableRow>
							) : isError ? (
								<TableRow>
									<TableCell colSpan={4} className='text-center text-ca-red'>
										<FaExclamationTriangle className='mr-1.5 inline' />
										{getApiErrorMessage(error, 'Xatolik yuz berdi')}
									</TableCell>
								</TableRow>
							) : warehouses.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className='text-center'>
										Bu firmada hali sklad yo'q
									</TableCell>
								</TableRow>
							) : (
								warehouses.map((warehouse, index) => (
									<TableRow key={warehouse.id}>
										<TableCell>{index + 1}</TableCell>
										<TableCell>{warehouse.name}</TableCell>
										<TableCell>
											{warehouse.country_name ?? countryNames.get(warehouse.country ?? -1) ?? '-'}
										</TableCell>
										<TableCell>
											{canWrite && (
												<div className='flex justify-end gap-1'>
													<OpenDialogButton
														element={(props) => <Button {...props} />}
														elementProps={{
															...buttonProps(<FaEdit />, 'warning', 'icon'),
															'aria-label': 'Tahrirlash',
														}}
														dialog={LogisticsWarehouseFormModal}
														dialogProps={{
															mode: 'edit' as const,
															item: warehouse,
															presetLogisticsCompany: preset,
														}}
													/>
													<OpenDialogButton
														element={(props) => <Button {...props} />}
														elementProps={{
															...buttonProps(<FaTrash />, 'danger', 'icon'),
															'aria-label': "O'chirish",
														}}
														dialog={DeleteLogisticsWarehouseModal}
														dialogProps={{ item: warehouse }}
													/>
												</div>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
