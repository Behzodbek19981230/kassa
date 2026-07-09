import { Fragment, useMemo, useState } from 'react';
import { FaExclamationTriangle, FaFileExport } from 'react-icons/fa';
import {
	Button,
	Combobox,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
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
import { formatNumber } from '@/lib/number';
import { brandService } from '@/services/brand/brand.service';
import { productCategoryService } from '@/services/product-category/product-category.service';
import { useWarehouseAllListQuery } from '@/services/warehouse/warehouse.queries';

export default function WarehouseProductsPage() {
	const { companyId } = useCurrentCompany();
	const [brandFilter, setBrandFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');

	const { data, isLoading, isFetching, isError, refetch } = useWarehouseAllListQuery({
		company: companyId ?? undefined,
		brand: brandFilter ? Number(brandFilter) : undefined,
		product_category: categoryFilter ? Number(categoryFilter) : undefined,
	});
	const groups = data ?? [];

	const brandGroups = useMemo(() => {
		return groups
			.map((g) => ({
				brand: g.brand,
				items: g.product_categories.flatMap((pc) => pc.warehouses),
			}))
			.filter((g) => g.items.length > 0);
	}, [groups]);

	const totalCount = brandGroups.reduce((sum, g) => sum + g.items.reduce((s, w) => s + w.count, 0), 0);
	const totalSum = brandGroups.reduce((sum, g) => sum + g.items.reduce((s, w) => s + w.price * w.count, 0), 0);
	const modelCount = brandGroups.length;

	const loadBrandOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await brandService.list({ search: search || undefined, page, limit: 20 });
		return {
			options: result.results.map((b) => ({ value: String(b.id), label: b.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	const loadCategoryOptions = async ({ search, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await productCategoryService.list({
			search: search || undefined,
			page,
			limit: 20,
			brand: brandFilter ? Number(brandFilter) : undefined,
		});
		return {
			options: result.results.map((c) => ({ value: String(c.id), label: c.name })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	function handleClear() {
		setBrandFilter('');
		setCategoryFilter('');
	}

	async function handleExport() {
		const { Workbook } = await import('exceljs');
		const workbook = new Workbook();
		const worksheet = workbook.addWorksheet('Ombor mahsulotlari');
		worksheet.addRow(['#', 'Model', 'Nomi', "O'lchami", 'Tip', 'Soni', 'Narxi ($)', 'Jami narxi ($)']);

		let index = 0;
		brandGroups.forEach((group) => {
			worksheet.addRow([group.brand.name]);
			group.items.forEach((item) => {
				index += 1;
				worksheet.addRow([
					index,
					group.brand.name,
					item.product_category_name,
					item.size,
					item.type_name ?? '',
					item.count,
					item.price,
					item.price * item.count,
				]);
			});
			const groupCount = group.items.reduce((s, w) => s + w.count, 0);
			const groupSum = group.items.reduce((s, w) => s + w.price * w.count, 0);
			worksheet.addRow(['', '', '', '', 'Jami:', groupCount, '', groupSum]);
		});
		worksheet.addRow(['', '', '', '', 'Jami:', totalCount, '', totalSum]);

		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'ombor-mahsulotlari.xlsx';
		link.click();
		URL.revokeObjectURL(url);
	}

	let rowIndex = 0;

	return (
		<>
			<PageHeader
				title='Ombor mahsulotlari'
				breadcrumb={[
					{ label: 'Asosiy', path: '/' },
					{ label: 'Ombor mahsulotlari', active: true },
				]}
			/>

			<Panel title="Ombordagi barcha mahsulotlar ro'yxati" onReload={() => refetch()}>
				<div className='-mx-2.5 mb-4 flex flex-wrap gap-y-3'>
					<div className='w-full px-2.5 sm:w-1/2'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Modelni tanlang:</label>
						<Combobox
							value={brandFilter}
							onChange={(value) => {
								setBrandFilter(value);
								setCategoryFilter('');
							}}
							loadOptions={loadBrandOptions}
							placeholder='Modelni tanlang'
							clearable
						/>
					</div>
					<div className='w-full px-2.5 sm:w-1/2'>
						<label className='mb-1 block text-xs font-semibold text-ca-heading'>Kategoriya:</label>
						<div className='flex gap-2'>
							<div className='flex-1'>
								<Combobox
									value={categoryFilter}
									onChange={(value) => setCategoryFilter(value)}
									loadOptions={loadCategoryOptions}
									placeholder='Kategoriyani tanlang'
									clearable
								/>
							</div>
							<Button
								type='button'
								variant='default'
								size='sm'
								disabled={!brandFilter && !categoryFilter}
								onClick={handleClear}
							>
								Tozalash
							</Button>
							<Button type='button' variant='success' size='sm' onClick={handleExport}>
								<FaFileExport className='mr-1.5' /> Export
							</Button>
						</div>
					</div>
				</div>

				<div className='mb-4 flex flex-wrap gap-3'>
					<div className='rounded-[3px] border-l-4 border-ca-orange bg-white px-4 py-2 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.1)]'>
						Barcha mahsulotlar soni: <span className='font-bold'>{formatNumber(totalCount)} ta</span>
					</div>
					<div className='rounded-[3px] border-l-4 border-ca-theme bg-white px-4 py-2 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.1)]'>
						Modellar soni: <span className='font-bold'>{formatNumber(modelCount)} ta</span>
					</div>
				</div>

				<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='bg-ca-theme text-white'>#</TableHead>
								<TableHead className='bg-ca-theme text-white'>Model</TableHead>
								<TableHead className='bg-ca-theme text-white'>Nomi</TableHead>
								<TableHead className='bg-ca-theme text-white'>O'lchami</TableHead>
								<TableHead className='bg-ca-theme text-white'>Tip</TableHead>
								<TableHead className='bg-ca-theme text-white'>Soni</TableHead>
								<TableHead className='bg-ca-theme text-white'>Narxi ($)</TableHead>
								<TableHead className='bg-ca-theme text-white'>Jami narxi ($)</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{(isLoading || isFetching) && (
								<TableRow>
									<TableCell colSpan={8} className='text-center'>
										Yuklanmoqda...
									</TableCell>
								</TableRow>
							)}
							{!isLoading && isError && (
								<TableRow>
									<TableCell colSpan={8} className='text-center text-ca-red'>
										<FaExclamationTriangle className='mr-1.5 inline' /> Xatolik yuz berdi
									</TableCell>
								</TableRow>
							)}
							{!isLoading && !isFetching && !isError && brandGroups.length === 0 && (
								<TableRow>
									<TableCell colSpan={8} className='text-center'>
										Ma'lumot topilmadi
									</TableCell>
								</TableRow>
							)}
							{!isLoading &&
								!isError &&
								brandGroups.map((group) => {
									const groupCount = group.items.reduce((s, w) => s + w.count, 0);
									const groupSum = group.items.reduce((s, w) => s + w.price * w.count, 0);
									return (
										<Fragment key={group.brand.id}>
											<TableRow>
												<TableCell colSpan={8} className='bg-cyan-100 font-bold text-ca-red'>
													{group.brand.name}
												</TableCell>
											</TableRow>
											{group.items.map((item) => {
												rowIndex += 1;
												return (
													<TableRow key={item.id} className='bg-red-50'>
														<TableCell>{rowIndex}</TableCell>
														<TableCell>{group.brand.name}</TableCell>
														<TableCell>{item.product_category_name}</TableCell>
														<TableCell>{formatNumber(item.size)}</TableCell>
														<TableCell>{item.type_name ?? ''}</TableCell>
														<TableCell>{formatNumber(item.count)}</TableCell>
														<TableCell className='font-semibold text-ca-green'>
															{formatNumber(item.price, 2)} $
														</TableCell>
														<TableCell className='font-semibold'>
															{formatNumber(item.price * item.count, 2)} $
														</TableCell>
													</TableRow>
												);
											})}
											<TableRow>
												<TableCell />
												<TableCell />
												<TableCell />
												<TableCell />
												<TableCell className='font-semibold'>Jami:</TableCell>
												<TableCell className='font-semibold'>
													{formatNumber(groupCount)}
												</TableCell>
												<TableCell />
												<TableCell className='font-semibold'>
													{formatNumber(groupSum, 2)} $
												</TableCell>
											</TableRow>
										</Fragment>
									);
								})}
							{!isLoading && !isError && brandGroups.length > 0 && (
								<TableRow className='bg-ca-heading'>
									<TableCell className='bg-ca-heading text-white' />
									<TableCell className='bg-ca-heading text-white' />
									<TableCell className='bg-ca-heading text-white' />
									<TableCell className='bg-ca-heading text-white' />
									<TableCell className='bg-ca-heading font-semibold text-white'>Jami:</TableCell>
									<TableCell className='bg-ca-heading font-semibold text-white'>
										{formatNumber(totalCount)}
									</TableCell>
									<TableCell className='bg-ca-heading text-white' />
									<TableCell className='bg-ca-heading font-semibold text-white'>
										{formatNumber(totalSum, 2)} $
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</Panel>
		</>
	);
}
