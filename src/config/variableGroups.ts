export const VARIABLE_GROUPS = [
  {
    id: "group_main",
    name: "1. Nhóm dữ liệu chính dự án/gói thầu",
    color: "primary",
    fields: [
      { key: "ma_du_an", label: "Mã dự án", type: "text" },
      { key: "ten_du_an", label: "Tên dự án", type: "text" },
      { key: "ma_goi_thau", label: "Mã gói thầu", type: "text" },
      { key: "ten_goi_thau", label: "Tên gói thầu", type: "text" },
      { key: "loai_goi_thau", label: "Loại gói thầu", type: "text" },
      { key: "linh_vuc", label: "Lĩnh vực", type: "text" },
      { key: "ngay_phe_duyet_chu_truong", label: "Ngày phê duyệt chủ trương", type: "date" },
      { key: "gia_ke_hoach_sau_thue", label: "Giá kế hoạch (có thuế)", type: "number" },
      // ... Thêm đầy đủ các trường bạn đã liệt kê vào đây
    ]
  },
  {
    id: "group_bidding",
    name: "2. Nhóm dữ liệu đấu thầu",
    color: "warning",
    fields: [
      { key: "so_hieu_hsm", label: "Số hiệu HSMT", type: "text" },
      { key: "ngay_trinh_hsm", label: "Ngày trình HSMT", type: "date" },
      { key: "ngay_mo_thau", label: "Ngày mở thầu", type: "date" },
      { key: "so_nha_thau_tham_du", label: "Số nhà thầu tham dự", type: "number" },
    ]
  },
  {
    id: "group_contract",
    name: "3. Nhóm dữ liệu ký hợp đồng",
    color: "success",
    fields: [
      { key: "nha_thau_trung_thau", label: "Nhà thầu trúng thầu", type: "text" },
      { key: "so_hop_dong", label: "Số hợp đồng", type: "text" },
      { key: "ngay_ky_hop_dong", label: "Ngày ký hợp đồng", type: "date" },
      { key: "gia_tri_hop_dong_sau_thue", label: "Giá trị hợp đồng", type: "number" },
    ]
  },
  {
    id: "group_settlement",
    name: "4. Nhóm nghiệm thu thanh quyết toán",
    color: "danger",
    fields: [
      { key: "ngay_nghiem_thu", label: "Ngày nghiệm thu", type: "date" },
      { key: "gia_tri_quyet_toan_sau_thue", label: "Giá trị quyết toán", type: "number" },
      { key: "ghi_chu", label: "Ghi chú", type: "text" },
    ]
  }
];