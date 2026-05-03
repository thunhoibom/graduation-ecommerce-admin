# CONTEXT HỆ THỐNG QUẢN TRỊ (ADMIN DASHBOARD) - MONO STUDIO

Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc, công nghệ và các tính năng của trang quản trị (Admin Dashboard) thuộc dự án website thương mại điện tử thời trang **Mono Studio**.

---

## 1. Tổng quan dự án (Project Overview)
- **Tên dự án**: Mono Studio Admin Dashboard
- **Vai trò**: Hệ thống quản trị trung tâm, cho phép nhân viên và quản lý điều hành toàn bộ hoạt động kinh doanh, từ quản lý sản phẩm, xử lý đơn hàng đến chăm sóc khách hàng và theo dõi tài chính.
- **Đối tượng sử dụng**: Admin, Quản lý kho, Nhân viên bán hàng, Nhân viên hỗ trợ khách hàng.

## 2. Công nghệ cốt lõi (Technology Stack)
Hệ thống được xây dựng trên nền tảng công nghệ hiện đại, ưu tiên tính hiệu năng, bảo mật và khả năng mở rộng.

- **Framework chính**: Next.js 16 (App Router) - Tận dụng Server Components và cơ chế routing mới nhất.
- **Ngôn ngữ**: TypeScript - Đảm bảo tính chặt chẽ về dữ liệu và giảm thiểu lỗi runtime.
- **UI/UX Library**: Ant Design (antd) 6.x - Hệ thống component chuyên nghiệp cho ứng dụng doanh nghiệp.
- **Quản lý dữ liệu (Data Fetching)**: 
    - **SWR**: Caching dữ liệu tại client, tối ưu tốc độ phản hồi và UX.
    - **Axios**: Xử lý các request API RESTful.
- **Xác thực & Phân quyền**: NextAuth.js - Quản lý phiên đăng nhập qua JWT.
- **Xử lý thời gian**: Day.js.
- **Tiện ích**: Lodash-es, query-string.

---

## 3. Kiến trúc mã nguồn (Architecture)
Project tuân thủ cấu trúc module hóa, tách biệt rõ ràng giữa giao diện, logic và dịch vụ.

```text
src/
├── app/                  # Routing và Giao diện chính (App Router)
│   ├── (auth)/           # Luồng đăng nhập/xác thực
│   ├── (dashboard)/      # Layout và các trang quản trị sau khi login
│   │   ├── products/     # Module quản lý sản phẩm
│   │   ├── orders/       # Module quản lý đơn hàng
│   │   ├── customers/    # Module quản lý khách hàng
│   │   └── ...           # Các module khác
├── layouts/              # Các thành phần layout chung (Sidebar, Header, Footer)
├── services/             # Lớp giao tiếp với API Backend
│   └── rest-api/         # Định nghĩa các endpoint và instance axios
├── shared/               # Các component, hooks, utils dùng chung toàn dự án
├── types/                # Định nghĩa kiểu dữ liệu TypeScript (Interfaces/Types)
└── constants/            # Các giá trị hằng số, cấu hình hệ thống
```

---

## 4. Các Module tính năng chính

### 4.1. Dashboard & Thống kê
- Cung cấp cái nhìn tổng quan qua các chỉ số KPI: Doanh thu, số lượng đơn hàng, số khách hàng mới.
- Biểu đồ tăng trưởng doanh thu theo thời gian (ngày/tuần/tháng).
- Top sản phẩm bán chạy và cảnh báo tồn kho thấp.

### 4.2. Quản lý Catalog (Sản phẩm & Danh mục)
- **Sản phẩm**: Quản lý thông tin chi tiết (tên, mô tả, giá), quản lý biến thể (Variants) dựa trên kích thước (Size) và màu sắc (Color).
- **Danh mục**: Quản lý cấu trúc cây danh mục sản phẩm (Parent-Child), giúp phân loại hàng hóa khoa học.
- **Media**: Tích hợp thư viện quản lý hình ảnh, hỗ trợ upload và tối ưu hóa hiển thị.

### 4.3. Quản lý Đơn hàng (Order Lifecycle)
- Theo dõi toàn bộ quy trình từ: Chờ xử lý → Đang giao → Hoàn thành → Đã hủy.
- Chi tiết đơn hàng: Thông tin khách hàng, địa chỉ giao hàng, danh sách sản phẩm, phương thức thanh toán và lịch sử trạng thái.
- Xử lý hoàn trả (Returns) và hoàn tiền (Refunds).

### 4.4. Quản lý Khách hàng (CRM)
- Lưu trữ thông tin khách hàng, lịch sử mua hàng và địa chỉ nhận hàng.
- Phân khúc và theo dõi mức độ tương tác của khách hàng với thương hiệu.

### 4.5. Marketing & Khuyến mãi
- **Mã giảm giá (Discounts)**: Tạo và quản lý các mã coupon (giảm theo % hoặc số tiền cố định).
- **Quy tắc khuyến mãi (Promotion Rules)**: Thiết lập các chương trình ưu đãi tự động dựa trên điều kiện đơn hàng.

### 4.6. Vận chuyển & Kho vận
- Cấu hình các phương thức vận chuyển và phí ship.
- **Tồn kho (Inventory)**: Theo dõi số lượng hàng hóa tại kho, hỗ trợ điều chỉnh tồn kho thủ công (Stock Adjustments).

### 4.7. Tài chính & Đối soát
- Theo dõi các giao dịch thanh toán thành công/thất bại.
- Đối soát dữ liệu giữa hệ thống và cổng thanh toán.

---

## 5. Thiết kế UI/UX & Trải nghiệm người dùng
- **Thiết kế chuyên nghiệp**: Sử dụng ngôn ngữ thiết kế của Ant Design, mang lại cảm giác tin cậy và hiệu suất cao.
- **Giao diện Responsive**: Tương thích tốt trên cả máy tính bảng và màn hình lớn.
- **Tương tác thông minh**: Sử dụng các Drawer, Modal để hiển thị thông tin chi tiết mà không làm gián đoạn luồng làm việc của người dùng.
- **Phản hồi tức thì**: Loading states, skeleton screens và các thông báo (toast/notification) rõ ràng.

---

## 6. Bảo mật & Luồng dữ liệu
- **Xác thực**: Sử dụng JWT Token lưu trữ an toàn trong session.
- **Luồng dữ liệu**:
    1. Người dùng thao tác trên UI.
    2. Component gọi Hook (useSWR) hoặc Service.
    3. Service gửi request (Axios) đính kèm Token đến Backend.
    4. Backend trả về dữ liệu → UI cập nhật tự động nhờ cơ chế của React/SWR.

---

## 7. Định hướng phát triển (Future Work)
- Tích hợp sâu hơn với các cổng thanh toán phổ biến tại Việt Nam (VNPay, MoMo).
- Hệ thống thông báo thời gian thực (Real-time notifications) cho các sự kiện quan trọng (đơn hàng mới, hết hàng).
- Mở rộng báo cáo phân tích nâng cao (Advanced Analytics).
