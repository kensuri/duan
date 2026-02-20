import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Lấy tất cả dữ liệu dự án
    const projects = await prisma.dulieuduan.findMany({
      select: {
        don_vi_trinh_chu_truong: true,
        cap_co_tham_quyen: true,
        nguoi_co_tham_quyen: true,
        nguon_von: true,
        chu_dau_tu: true,
        don_vi_trinh_chu_dau_tu: true,
        dia_diem_thuc_hien: true,
        hinh_thuc_lua_chon_nha_thau: true,
        phuong_thuc_lua_chon_nha_thau: true,
        thoi_gian_to_chuc_lua_chon_nha_thau: true,
        thoi_gian_bat_dau_to_chuc_lua_chon_nha_thau: true,
        loai_hop_dong: true,
        thoi_gian_thuc_hien_goi_thau: true,
        dai_dien_chu_dau_tu: true,
        chuc_vu_dai_dien_chu_dau_tu: true,
        dia_chi_chu_dau_tu: true,
        ma_so_thue_chu_dau_tu: true,
        cq_quan_ly_thue_chu_dau_tu: true,
        ma_qhns_chu_dau_tu: true,
        dien_thoai_chu_dau_tu: true,
        tai_khoan_chu_dau_tu: true, 
        uy_quyen_chu_dau_tu: true,
        nha_thau: true,
        dai_dien_nha_thau: true,
        chuc_vu_dai_dien_nha_thau: true,
        dia_chi_nha_thau: true,
        ma_so_thue_nha_thau : true,
        cq_quan_ly_thue_nha_thau: true,
        dien_thoai_nha_thau: true,
        tai_khoan_nha_thau: true,
        uy_quyen_nha_thau: true,
      }
    });

    // Hàm helper để lọc ra các giá trị duy nhất và không rỗng cho từng cột
    const getUnique = (key: string) => {
      return Array.from(new Set(projects.map((p: any) => p[key]).filter(v => v && v !== "")));
    };

    const suggestions = {
      don_vi_trinh_chu_truong: getUnique('don_vi_trinh_chu_truong'),
      cap_co_tham_quyen: getUnique('cap_co_tham_quyen'),
      nguoi_co_tham_quyen: getUnique('nguoi_co_tham_quyen'),
      nguon_von: getUnique('nguon_von'),
      chu_dau_tu: getUnique('chu_dau_tu'),
      don_vi_trinh_chu_dau_tu: getUnique('don_vi_trinh_chu_dau_tu'),
      dia_diem_thuc_hien: getUnique('dia_diem_thuc_hien'),
      hinh_thuc_lua_chon_nha_thau: getUnique('hinh_thuc_lua_chon_nha_thau'),
      phuong_thuc_lua_chon_nha_thau: getUnique('phuong_thuc_lua_chon_nha_thau'),
      thoi_gian_to_chuc_lua_chon_nha_thau: getUnique('thoi_gian_to_chuc_lua_chon_nha_thau'),
      thoi_gian_bat_dau_to_chuc_lua_chon_nha_thau: getUnique('thoi_gian_bat_dau_to_chuc_lua_chon_nha_thau'),
      loai_hop_dong: getUnique('loai_hop_dong'),
      thoi_gian_thuc_hien_goi_thau: getUnique('thoi_gian_thuc_hien_goi_thau'),
      dai_dien_chu_dau_tu: getUnique('dai_dien_chu_dau_tu'),
      chuc_vu_dai_dien_chu_dau_tu: getUnique('chuc_vu_dai_dien_chu_dau_tu'),
      dia_chi_chu_dau_tu: getUnique('dia_chi_chu_dau_tu'),
      ma_so_thue_chu_dau_tu: getUnique('ma_so_thue_chu_dau_tu'),
      cq_quan_ly_thue_chu_dau_tu: getUnique('cq_quan_ly_thue_chu_dau_tu'),
      ma_qhns_chu_dau_tu: getUnique('ma_qhns_chu_dau_tu'),
      dien_thoai_chu_dau_tu: getUnique('dien_thoai_chu_dau_tu'),
      tai_khoan_chu_dau_tu: getUnique('tai_khoan_chu_dau_tu'),
      uy_quyen_chu_dau_tu: getUnique('uy_quyen_chu_dau_tu'),
      nha_thau: getUnique('nha_thau'),
      dai_dien_nha_thau: getUnique('dai_dien_nha_thau'),
      chuc_vu_dai_dien_nha_thau: getUnique('chuc_vu_dai_dien_nha_thau'),
      dia_chi_nha_thau: getUnique('dia_chi_nha_thau'),
      ma_so_thue_nha_thau: getUnique('ma_so_thue_nha_thau'),
      cq_quan_ly_thue_nha_thau: getUnique('cq_quan_ly_thue_nha_thau'),
      dien_thoai_nha_thau: getUnique('dien_thoai_nha_thau'),
      tai_khoan_nha_thau: getUnique('tai_khoan_nha_thau'),
      uy_quyen_nha_thau: getUnique('uy_quyen_nha_thau'),  
    };

    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi tải gợi ý" }, { status: 500 });
  }
}