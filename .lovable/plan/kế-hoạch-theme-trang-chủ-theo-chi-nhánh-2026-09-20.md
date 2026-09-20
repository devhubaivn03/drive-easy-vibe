# Kế hoạch: Theme Trang chủ theo Chi nhánh

## Mục tiêu
Mỗi chi nhánh chọn độc lập **Theme 1** (giao diện hiện tại) hoặc **Theme 2** (Ivory/Graphite + vàng đồng theo ảnh mẫu). Superadmin bắt buộc chọn chi nhánh trước khi chỉnh sửa; không còn mục “Nội dung chung/mặc định”.

## Thay đổi
- Trong **Quản lý nội dung Trang chủ**, thêm bộ chọn Theme 1/Theme 2 và lưu lựa chọn cùng nội dung của chi nhánh.
- Superadmin ban đầu chỉ thấy danh sách chi nhánh; phần chỉnh sửa và nút lưu chỉ xuất hiện sau khi chọn một chi nhánh.
- Admin tự động chỉnh sửa đúng chi nhánh của mình.
- Khi chọn chi nhánh chưa có dữ liệu riêng, nạp nội dung chung hiện có làm bản khởi tạo trong biểu mẫu, nhưng mọi lần lưu đều tạo dữ liệu riêng cho chi nhánh.
- Trang chủ đọc theme theo mã chi nhánh và hiển thị:
  - **Theme 1:** giữ nguyên giao diện hiện tại.
  - **Theme 2:** bố cục gọn, tông Ivory/Graphite và vàng đồng, navbar tinh giản, phần mở đầu bất đối xứng, thẻ khóa học/thống kê/dịch vụ đồng bộ ảnh mẫu; hỗ trợ Light/Dark.
- Giữ nguyên toàn bộ nội dung động, ảnh luân phiên, biểu mẫu liên hệ và chat hiện có.
- Ghi lại tiến độ triển khai.

## Kiểm tra
- Kiểm tra Superadmin không thể chỉnh sửa khi chưa chọn chi nhánh.
- Kiểm tra đổi theme và lưu độc lập giữa hai chi nhánh.
- Kiểm tra Theme 1 không bị thay đổi và Theme 2 hiển thị tốt trên desktop/mobile, Light/Dark.
