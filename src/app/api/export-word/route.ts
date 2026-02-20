import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Hàm xử lý định dạng hiển thị cho file Word
function formatValue(key: string, val: any) {
  if (!val) return "";
  
  // Định dạng ngày: DD/MM/YYYY
  if (key.startsWith('ngay_')) {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString('vi-VN');
  }
  
  // Định dạng số tiền: 1.000.000
  if ((key.includes('gia_') || key.includes('tien_') || key.includes('du_toan_')) && 
      !isNaN(Number(val)) && typeof val !== 'boolean') {
    return Number(val).toLocaleString('vi-VN');
  }
  return val;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Truy vấn dữ liệu từ bảng dulieuduan
    const project = await prisma.dulieuduan.findUnique({ where: { id: String(id) } });

    if (!project) return NextResponse.json({ error: "Không tìm thấy dự án" }, { status: 404 });

    // Ép kiểu 'any' để truy cập trường content mà không bị TypeScript báo lỗi
    const projectAny = project as any;
    const content = projectAny.content || {};

    // 1. Xử lý các biến đơn (don_vi_bao_gia_1, ten_du_an...)
    const formattedContent: Record<string, any> = {};
    Object.keys(content).forEach(key => {
      if (!Array.isArray(content[key])) {
        formattedContent[key] = formatValue(key, content[key]);
      }
    });

    // 2. Xử lý dữ liệu bảng động (bang_quy_mo, bang_hop_dong)
    const tables: Record<string, any> = {};
    ['bang_quy_mo', 'bang_hop_dong'].forEach(tableName => {
      const tableData = content[tableName];
      if (Array.isArray(tableData)) {
        tables[tableName] = tableData.map((row: any) => ({
          ...row,
          c1: formatValue('c1', row.c1),
          c2: formatValue('c2', row.c2),
          c3: formatValue('c3', row.c3),
        }));
      } else {
        tables[tableName] = []; // Đảm bảo không bị crash template nếu bảng trống
      }
    });

    // 3. Gộp tất cả dữ liệu để gửi về Frontend
    const exportData = {
      ...project,           // Dữ liệu từ các cột DB
      ...formattedContent,  // Dữ liệu biến đơn từ cột content
      ...tables,            // Dữ liệu bảng từ cột content
      rows_quy_mo: tables.bang_quy_mo,      // Hỗ trợ template cũ
      rows_hop_dong: tables.bang_hop_dong,
    };

    // Xử lý lỗi BigInt nếu có trong dữ liệu Database
    const safeData = JSON.parse(JSON.stringify(exportData, (_, v) =>
      typeof v === "bigint" ? v.toString() : v
    ));

    return NextResponse.json({ success: true, data: safeData });
  } catch (error: any) {
    console.error("❌ EXPORT WORD ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}