# Backend uchun qo'llanma: "Tovar qo'shish" (`/warehouse-prices/create`) API

## Hozir nima bo'lyapti (frontda)

Formada avval **sklad(lar)** tanlanadi (multiselect, butun forma uchun bitta, sanadan oldin), keyin sana va bir nechta mahsulot qatori: model (brand), nomi (product_category), o'lcham (+ tip), narx. Tanlangan skladlarning **hammasiga** shu qatorlarning hammasi qo'shiladi. Saqlashda front har qator uchun bir nechta so'rov yuboradi:

1. `GET /warehouse/?brand=&product_category=&type=&limit=100` — natijadan `size` mos keladigan tovar kartasini qidiradi.
2. Topilmasa `POST /warehouse/` — yangi karta yaratadi (`count: 0, price: 0, worker_price: 0, type_sklad: null, status_count: false`).
3. Har bir tanlangan sklad uchun `POST /sklad-product/` — `{ warehouse, type_sklad, count: 0, real_price, cr_date, status_count: false }`.

Muammolar: ko'p so'rov, tranzaksiya yo'q (o'rtada xato bo'lsa yarim saqlanadi), "karta bor-yo'qligi" tekshiruvi frontda (poyga holati — ikki kishi bir vaqtda qo'shsa dublikat karta chiqadi), dublikat tekshiruvi ham frontda.

## Kerakli yangi endpoint

Bitta so'rov, bitta tranzaksiya.

```
POST /warehouse/bulk-create/        (yoki /sklad-product/bulk-create/ — nomini o'zingiz tanlang)
```

### Request

```json
{
  "type_sklads": [1, 4, 7],
  "cr_date": "2026-10-15",
  "comment": "ixtiyoriy izoh",
  "items": [
    {
      "brand": 3,
      "product_category": 12,
      "type": 2,
      "size": "40",
      "real_price": "6.00"
    }
  ]
}
```

| Maydon | Tur | Izoh |
|---|---|---|
| `type_sklads` | int[] | **Majburiy, kamida 1 ta.** Butun so'rov uchun bitta ro'yxat (multiselect): `items` dagi har bir tovar shu skladlarning **hammasiga** qo'shiladi. Sklad `items` ichida emas. |
| `cr_date` | `YYYY-MM-DD` | Majburiy. Karta (yangi bo'lsa) va sklad qatorlarining `cr_date` si. |
| `comment` | string | Ixtiyoriy. Faqat **yangi** karta yaratilsa shu kartaga yoziladi. |
| `items[]` | array | Kamida 1 ta. |
| `items[].brand` | int | Majburiy. |
| `items[].product_category` | int | Majburiy. |
| `items[].type` | int \| null | O'lcham turi (brand-size-type). |
| `items[].size` | string/number | Majburiy. |
| `items[].real_price` | decimal | Majburiy, `>= 0`. Hamma tanlangan skladlar uchun bir xil. |

Natijada `len(items) × len(type_sklads)` ta `SkladProduct` yaratiladi.

`company` — token/foydalanuvchining joriy kompaniyasidan olinadi (frontdan yuborilmaydi), `created_by`/`updated_by` ham backendda qo'yiladi.

### Backend mantig'i (bitta `transaction.atomic()` ichida)

Har bir `item` uchun:

1. **Kartani topish yoki yaratish** — `(company, brand, product_category, type, size)` bo'yicha. Topilsa o'shani ishlatish; topilmasa yaratish (`count=0, price=0, worker_price=0, status_count=false, type_sklad=null`). `select_for_update` yoki `get_or_create` + DB unique constraint bilan poyga holatini yopish.
2. **`type_sklads` dagi har bir sklad uchun** `SkladProduct` yaratish: `warehouse=karta`, `type_sklad`, `count=0`, `real_price`, `cr_date`, `status_count=false`.
3. `(warehouse, type_sklad)` juftligi allaqachon bor bo'lsa — **butun so'rovni rad etish** (`400`), qaysi sklad(lar) band ekanini aytib (pastdagi xato formatiga qarang). Jimgina o'tkazib yubormang: front foydalanuvchiga "oldin qo'shilgan" deb ko'rsatadi.
4. Bir so'rov ichida bir xil `(karta, sklad)` ikki marta kelmasligi kerak: `type_sklads` da takror id yoki `items` da bir xil tovar takrorlansa `400`.
5. Hamma narsa muvaffaqiyatli bo'lsa commit, aks holda hech narsa saqlanmaydi.

Tekshiruvlar: `brand`, `product_category`, `type`, `type_sklads` shu kompaniyaga tegishli ekani; `product_category` shu `brand` ga tegishli ekani; mos `brand-size` (o'lcham) mavjudligi (hozir front shu ro'yxatdan tanlatadi).

### Response `201 Created`

```json
{
  "results": [
    {
      "warehouse": 55,
      "warehouse_created": true,
      "sklad_products": [
        { "id": 901, "type_sklad": 1, "real_price": "6.00" },
        { "id": 902, "type_sklad": 4, "real_price": "6.00" }
      ]
    }
  ]
}
```

`items` bilan bir xil tartibda qaytsin. `warehouse_created` — karta shu so'rovda yaratilgan-yaratilmaganini bildiradi.

### Xatolar `400`

Frontda `getApiErrorMessage` ishlatiladi, shuning uchun mavjud DRF formatini saqlang. Dublikat uchun:

```json
{
  "items": [
    {
      "non_field_errors": ["Bu mahsulot oldin qo'shilgan: Ombor 1, Ombor 4"]
    }
  ]
}
```

(`items` — massiv, indeks = qator tartibi; xato bo'lmagan qatorlar uchun `{}`.) Skladning o'ziga tegishli xatolar (bo'sh ro'yxat, begona sklad) `"type_sklads": ["..."]` kalitida qaytsin.

## Qo'shimcha: dublikatni oldindan tekshirish (ixtiyoriy, tavsiya)

Front hozir (har bir qator uchun) kartani topib, uning `GET /sklad-product/?warehouse=<id>&limit=100` ro'yxatidan tanlangan skladlar ichida bandlarini aniqlaydi (2 ta so'rov). Bitta so'rovga qisqartirish uchun:

```
GET /warehouse/check-skladlar/?brand=&product_category=&type=&size=
→ { "warehouse": 55 | null, "type_sklads": [1, 4] }   // shu tovar allaqachon turgan skladlar
```

Shart emas — `bulk-create` dublikatni baribir rad etadi.

## Tahrirlash (`/warehouse-prices/:id/edit`)

O'zgarmaydi: bitta `SkladProduct` uchun `PATCH /sklad-product/:id/` `{ real_price, cr_date }`. Tahrirlashda sklad multiselect emas — bitta sklad qatori tahrirlanadi.

## Frontda nima o'zgaradi (backend tayyor bo'lgach)

[WarehouseFormPage.tsx](../src/pages/WarehousePage/WarehouseFormPage.tsx) dagi `handleSubmit` ichidagi `findCard → create card → create sklad-product` sikli bitta `POST` ga almashtiriladi. Forma va validatsiya o'zgarmaydi.
