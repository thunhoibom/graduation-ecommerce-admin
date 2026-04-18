📋 PLAN — Mono Studio Admin (E-Commerce)
🏗️ Cấu trúc project (khung)

src/
├── app/
│   ├── (auth)/login/           ← Login page
│   ├── (dashboard)/            ← Protected layout
│   │   ├── _layout.tsx         ← MainLayout (sidebar + header)
│   │   ├── dashboard/          ← Dashboard trang chủ
│   │   ├── products/          ← Quản lý sản phẩm
│   │   ├── categories/        ← Quản lý danh mục (cây)
│   │   ├── orders/            ← Quản lý đơn hàng
│   │   ├── returns/           ← Quản lý đổi/trả
│   │   ├── customers/         ← Quản lý khách hàng
│   │   ├── discount-codes/    ← Quản lý mã giảm giá
│   │   ├── shipping/           ← Quản lý vận chuyển
│   │   ├── media/              ← Quản lý hình ảnh
│   │   └── settings/           ← Cấu hình hệ thống
│   ├── login/
│   ├── error/403, 404, 500/
│   └── layout.tsx
├── components/                 ← Shared UI components
│   ├── antd/                   ← Ant Design wrappers
│   ├── ui/                     ← Pure UI (tables, modals, filters)
│   └── layout/                 ← Header, Sidebar, Breadcrumb
├── services/                   ← API layer (giữ nguyên)
│   └── rest-api/app-api/
├── hooks/                      ← Shared hooks
├── lib/                        ← Utils, constants, env
└── types/                      ← Shared TypeScript types
📺 Các màn hình chi tiết
Phase 1 — Nền tảng (5 screens)
#	Route	Tên màn	Mô tả
1	/login	Login	Form đăng nhập (email + password), JWT token, redirect sau login
2	/ → redirect	Dashboard trang chủ	Thống kê tổng quan: doanh thu, đơn hàng, sản phẩm bán chạy, cảnh báo tồn kho thấp
3	/dashboard	Dashboard Statistics	Cards KPI + biểu đồ doanh thu theo ngày/tuần/tháng + top sản phẩm + order status breakdown
4	—	AppSidebar động	Menu lấy từ API /api/access, collapse, highlight active
5	—	AppHeader	Breadcrumb, user info dropdown (profile, logout), notifications
Phase 2 — Sản phẩm (4 screens)
#	Route	Tên màn	Mô tả
6	/products	Danh sách sản phẩm	Table: barcode, tên, giá, tồn kho, danh mục, rating. Filter: tìm kiếm, danh mục, khoảng giá, trạng thái. Action: Thêm, Sửa, Xóa, Xem chi tiết
7	/products/new + /products/[id]	Tạo / Sửa sản phẩm	Form: barcode, tên, mô tả, giá, tồn kho, danh mục, hình ảnh, biến thể
8	/products/[id]	Chi tiết sản phẩm	Full product info + danh sách biến thể (SKU, size, color, stock)
9	/products/[id]/variants	Quản lý biến thể	Table biến thể: SKU, size, color, tồn kho, giá. CRUD biến thể
Phase 3 — Danh mục (2 screens)
#	Route	Tên màn	Mô tả
10	/categories	Danh sách danh mục	Tree view danh mục (parent-child), drag-drop sắp xếp, expand/collapse
11	/categories/[id]	Tạo / Sửa danh mục	Form: code, tên, danh mục cha, mô tả
Phase 4 — Đơn hàng (4 screens)
#	Route	Tên màn	Mô tả
12	/orders	Danh sách đơn hàng	Table: order ID, khách hàng, ngày, tổng tiền, trạng thái, shipper. Filter: trạng thái, ngày, khách hàng, mã vận đơn
13	/orders/[id]	Chi tiết đơn hàng	Full order: thông tin khách hàng, địa chỉ giao hàng, items, payment, timeline trạng thái
14	/orders/[id]/edit-status	Cập nhật trạng thái	Dialog: chuyển trạng thái đơn hàng (8 statuses: Pending → Delivery Complete), thêm ghi chú, cập nhật mã vận đơn
15	/orders/new	Tạo đơn hàng thủ công	Form tạo order cho khách hàng (admin only)
Phase 5 — Đổi / Trả hàng (2 screens)
#	Route	Tên màn	Mô tả
16	/returns	Danh sách yêu cầu trả hàng	Table: mã yêu cầu, đơn hàng gốc, khách hàng, ngày, trạng thái, tổng hoàn tiền
17	/returns/[id]	Chi tiết / Xử lý trả hàng	Chi tiết yêu cầu, danh sách items, phương thức hoàn tiền, form xử lý duyệt/từ chối
Phase 6 — Khách hàng & Mã giảm giá (3 screens)
#	Route	Tên màn	Mô tả
18	/customers	Danh sách khách hàng	Table: tên, email, SĐT, địa chỉ, số đơn hàng. Filter: tìm kiếm, ngày đăng ký
19	/customers/[id]	Chi tiết khách hàng	Profile khách hàng + lịch sử đơn hàng + địa chỉ giao hàng
20	/discount-codes	Quản lý mã giảm giá	Table mã: code, loại (%, fixed), giá trị, số lần dùng, ngày hết hạn, trạng thái. CRUD + toggle active
Phase 7 — Vận chuyển & Hệ thống (3 screens)
#	Route	Tên màn	Mô tả
21	/shipping	Quản lý phương thức giao hàng	Table: tên, phí cơ bản, ngưỡng miễn phí, ngày giao dự kiến, trạng thái
22	/media	Quản lý hình ảnh	Grid/table hình ảnh sản phẩm, upload (nếu API hỗ trợ), xóa
23	/settings	Cấu hình hệ thống	Params (system config), thông tin shop, cấu hình thanh toán
🔧 Kiến trúc code (pattern tuân thủ)

Mỗi module (products, orders, ...):
├── page.tsx                    ← metadata + Suspense wrapper
├── _components/
│   ├── ListView.tsx            ← Layout chính (filter + table)
│   ├── FilterToolbar.tsx       ← Search + filter inputs
│   ├── DataTable.tsx           ← Ant Table + pagination + actions
│   ├── FormModal.tsx           ← Create/Edit modal
│   └── DetailDrawer.tsx        ← View details drawer
├── _hooks/
│   └── useFetchTableData.ts    ← SWR/fetch + params state
└── types.ts                    ← Type definitions
Shared components (tái sử dụng):

AppTable — wrapper Ant Table (loading, empty, pagination)
AppButton — button styled
FilterBar — reusable filter row
DetailDrawer — slide-out detail panel
ConfirmModal — confirm delete / action
⏱️ Thứ tự ưu tiên triển khai

1. Login page + Auth (JWT)          ← Nền tảng
2. Layout (Sidebar + Header)        ← Nền tảng
3. Dashboard Statistics             ← High value, ấn tượng đầu tiên
4. Products CRUD                    ← Core business
5. Orders Management                 ← Core business
6. Categories Tree                  ← Core business
7. Customers                        ← Core business
8. Returns Management               ← Core business
9. Discount Codes                   ← Thường dùng
10. Shipping Methods                ← Thường dùng
11. Media Gallery                   ← Low priority
12. Settings                        ← Low priority