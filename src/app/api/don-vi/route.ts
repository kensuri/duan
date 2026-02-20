import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. Lấy danh sách đơn vị
export async function GET() {
  try {
    const data = await prisma.donvi.findMany({ 
      orderBy: { ten_don_vi: 'asc' }
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi tải danh sách" }, { status: 500 });
  }
}

// 2. Thêm mới đơn vị
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newDonVi = await prisma.donvi.create({ data: body });
    return NextResponse.json(newDonVi);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lưu" }, { status: 500 });
  }
}

// 3. Chỉnh sửa đơn vị
export async function PATCH(req: Request) {
  try {
    const { id, ...data } = await req.json();
    const updated = await prisma.donvi.update({
      where: { id: id },
      data: data
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}

// 4. Xóa đơn vị
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });

    await prisma.donvi.delete({ where: { id: id } });
    return NextResponse.json({ message: "Xóa thành công" });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi xóa dữ liệu" }, { status: 500 });
  }
}