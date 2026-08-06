import { createColumnHelper, type PaginationState } from '@tanstack/react-table';
import { useState } from 'react';
import { FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import {
	Button,
	buttonProps,
	DataTable,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	ModalTitle,
} from '@/components/ui';
import OpenDialogButton from '@/components/OpenDialogButton';
import ConfirmClientModal from '@/components/layout/NewTelegramClientsModal/ConfirmClientModal';
import { getApiErrorMessage } from '@/lib/errors';
import { useClientListQuery } from '@/services/client/client.queries';
import type { Client } from '@/services/client/client.types';

const columnHelper = createColumnHelper<Client>();

interface NewTelegramClientsModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
}

export default function NewTelegramClientsModal({ open, setOpen }: NewTelegramClientsModalProps) {
	const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

	const { data, isLoading, isFetching, isError, error } = useClientListQuery(
		{
			status: 'new_telegram',
			page: pagination.pageIndex + 1,
			limit: pagination.pageSize,
		},
		open,
	);

	const results = data?.results ?? [];
	const paginationMeta = data?.pagination;

	const columns = [
		columnHelper.accessor('fio', { header: 'FIO', enableColumnFilter: false }),
		columnHelper.accessor('phone', { header: 'Telefon nomer', size: 160, enableColumnFilter: false }),
		columnHelper.accessor('address', { header: 'Manzil', enableColumnFilter: false }),
		columnHelper.display({
			id: 'actions',
			header: 'Harakatlar',
			meta: { align: 'right' },
			enableSorting: false,
			enableColumnFilter: false,
			size: 140,
			cell: ({ row }) => (
				<div className='flex justify-end'>
					<OpenDialogButton
						element={(props) => <Button {...props} />}
						elementProps={{
							...buttonProps(
								<>
									<FaCheck className='mr-1.5' /> Tasdiqlash
								</>,
								'success',
								'xs',
							),
						}}
						dialog={ConfirmClientModal}
						dialogProps={{ item: row.original }}
					/>
				</div>
			),
		}),
	];

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent className='max-w-[720px]'>
				<ModalHeader>
					<ModalTitle>TelegramBot orqali ro'yxatdan o'tgan mijozlar</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<DataTable
						columns={columns}
						data={results}
						manualPagination
						pageCount={paginationMeta?.lastPage ?? -1}
						totalRows={paginationMeta?.total}
						pagination={pagination}
						onPaginationChange={setPagination}
						enablePagination
						enableGlobalFilter={false}
						enableSorting={false}
						isLoading={isLoading || isFetching}
						emptyMessage={isError ? getApiErrorMessage(error, 'Xatolik yuz berdi') : "Yangi klientlar yo'q"}
						emptyIcon={isError ? <FaExclamationTriangle className='text-4xl text-ca-red' /> : undefined}
					/>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
