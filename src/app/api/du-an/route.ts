import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Lấy danh sách tất cả dự án (Dùng cho trang chủ)
export async function GET() {
  try {
    const projects = await prisma.dulieuduan.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách:", error);
    return NextResponse.json({ error: "Lỗi lấy danh sách" }, { status: 500 });
  }
}

// Tạo dự án mới
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Đảm bảo các trường ngày tháng là Object Date hoặc null
    const data = {
      ...body,
      ngay_chu_truong: body.ngay_chu_truong ? new Date(body.ngay_chu_truong) : null,
      // Các trường số mặc định là 0 nếu không nhập
      gia_trung_binh_bao_gia: 0,
      phan_tram_thue: 0,
      // ... thêm các giá trị mặc định nếu Schema yêu cầu isRequired
    };

    const newProject = await prisma.dulieuduan.create({
      data: data
    });

    return NextResponse.json(newProject);
  } catch (error: any) {
    console.error("LỖI TẠO DỰ ÁN:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}