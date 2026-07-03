import type { SidebarMenuItem } from '@/types'

export const sidebarMenu: SidebarMenuItem[] = [
  { id: 'warehouse-products', icon: 'boxes', label: 'Ombor mahsulotlari', path: '#' },
  { id: 'place-order', icon: 'cart', label: 'Buyurtma qilish', path: '#' },
  { id: 'customer-order-history', icon: 'history', label: 'Mijoz buyurtmalar tarixi', path: '#' },
  { id: 'customer-debt', icon: 'balance-scale', label: 'Mijozdan qarzdorlik', path: '#' },
  { id: 'orders-debts', icon: 'chart-pie', label: 'Buyurtmalar va qarzlar', path: '#' },
  { id: 'return', icon: 'undo', label: 'Vozvrat', path: '#' },
  { id: 'return-history', icon: 'file-invoice', label: 'Vozvrat buyurmalar tarixi', path: '#' },
  { id: 'goods-prices', icon: 'tags', label: 'Tovarlar va Narxlar', path: '#' },
  { id: 'import', icon: 'truck', label: 'Import qilish', path: '#' },
  { id: 'warehouse-report', icon: 'warehouse', label: 'Omborxona hisobi', path: '#' },
  { id: 'my-debts', icon: 'bookmark', label: 'Mening qarzlarim', path: '#' },
  {
    id: 'system-management',
    icon: 'cogs',
    label: 'Tizim boshqaruvi',
    children: [
      {
        id: 'product-categories',
        icon: 'layer-group',
        label: 'Mahsulot toifalari',
        path: '/system/product-categories',
      },
      { id: 'models', icon: 'bookmark', label: 'Modellar', path: '/system/models' },
      {
        id: 'product-measurement',
        icon: 'ruler-combined',
        label: "Mahsulot o'lchami",
        path: '/system/product-measurement',
      },
      { id: 'shippers', icon: 'shipping-fast', label: "Yuk jo'natuvchilar", path: '/system/consignors' },
      { id: 'import-goods-history', icon: 'history', label: 'Import tovarlar tarixi', path: '#' },
      { id: 'inspections-history', icon: 'check-circle', label: 'Tekshirishlar tarixi', path: '#' },
      { id: 'changes-report', icon: 'exclamation-triangle', label: "O'zgarishlar hisobi", path: '#' },
      { id: 'users', icon: 'users-cog', label: 'Foydalanuvchilar', path: '#' },
      { id: 'profit-loss', icon: 'chart-bar', label: 'Foyda va zarar', path: '#' },
      { id: 'expenses', icon: 'receipt', label: 'Xarajatlar', path: '#' },
    ],
  },
]
