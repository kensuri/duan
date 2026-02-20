import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Hàm helper để xử lý an toàn dữ liệu trả về (BigInt nếu có)
function serializeData(data: any) {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // 1. Phẳng hóa dữ liệu và loại bỏ các trường hệ thống
    const rawData = body.content ? { ...body, ...body.content } : body;
    const { content, id: _id, createdAt, updatedAt, createdat, updatedat, ...rest } = rawData;

    const finalData: any = {};

    // 2. Danh sách trường SỐ (Dựa trên Schema thực tế của bạn)
    const NUMBER_FIELDS = [
      'gia_bao_gia_sau_thue_1', 'gia_bao_gia_sau_thue_2', 'gia_bao_gia_sau_thue_3',
      'gia_trung_binh_bao_gia', 'du_toan_goi_thau_truoc_thue', 'phan_tram_thue',
      'tien_thue_du_toan', 'tien_du_toan_goi_thau_sau_thue', 'gia_tri_bao_lanh_du_thau',
      'gia_tri_hop_dong_truoc_thue', 'gia_tri_thue_hop_dong', 'gia_tri_hop_dong_sau_thue',
      'gia_tri_bao_lanh_hop_dong', 'gia_tri_tam_ung_hop_dong'
    ];

    // 3. Xử lý ép kiểu dữ liệu cực kỳ chặt chẽ
    Object.entries(rest).forEach(([key, value]) => {
      if (value === undefined) return;

      const stringValue = String(value).trim();

      // TRƯỜNG HỢP 1: Xử lý các trường SỐ (Tiền, Thuế, Dự toán)
      const isNumeric = NUMBER_FIELDS.includes(key) || (
        (key.includes('gia_') || key.includes('tien_') || key.includes('phan_tram_') || key.includes('du_toan_')) &&
        !key.includes('don_vi') && !key.includes('ten_') && !key.includes('bang_chu_') && !key.includes('nguoi_')
      );

      if (isNumeric) {
        if (stringValue === "" || value === null) {
          finalData[key] = 0; // Tránh gửi null nếu DB không cho phép
        } else {
          // Xử lý định dạng dấu chấm phân cách nghìn (1.000.000 -> 1000000)
          const cleanNum = stringValue.replace(/\./g, "").replace(",", ".");
          const parsed = parseFloat(cleanNum);
          finalData[key] = isNaN(parsed) ? 0 : parsed;
        }
      } 
      // TRƯỜNG HỢP 2: Xử lý NGÀY THÁNG (Khắc phục lỗi ISO-8601 DateTime)
      else if (key.startsWith('ngay_')) {
        if (!stringValue || stringValue === "" || value === null) {
          finalData[key] = null; // Gửi null sạch sẽ cho Prisma
        } else {
          const d = new Date(stringValue);
          if (!isNaN(d.getTime())) {
            finalData[key] = d; // Prisma tự động chuyển object Date sang ISO-8601
          } else {
            finalData[key] = null;
          }
        }
      }
      // TRƯỜNG HỢP 3: Xử lý BẢNG BIỂU (JSON)
      else if (typeof value === 'object' && value !== null) {
        finalData[key] = value;
      }
      // TRƯỜNG HỢP 4: Xử lý VĂN BẢN (String) - Khắc phục lỗi "provided Int"
      else {
        // Tuyệt đối không để null hoặc số cho trường String
        if (value === null || value === 0 || stringValue === "") {
          finalData[key] = ""; 
        } else {
          finalData[key] = stringValue;
        }
      }
    });

    // 4. Thực thi Update
    const updatedProject = await prisma.dulieuduan.update({
      where: { id: id },
      data: finalData,
    });

    console.log(`✅ DATABASE UPDATED SUCCESSFULLY: ${id}`);
    return NextResponse.json(serializeData(updatedProject));

  } catch (error: any) {
    console.error("❌ LỖI TẠI API PATCH:", error.message);
    return NextResponse.json(
      { error: "Lỗi cập nhật dữ liệu", detail: error.message }, 
      { status: 500 }
    );
  }
}

// Hàm GET chi tiết dự án
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.dulieuduan.findUnique({
      where: { id: id }
    });

    if (!project) {
      return NextResponse.json({ error: "Không tìm thấy dự án" }, { status: 404 });
    }

    return NextResponse.json(serializeData(project));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}