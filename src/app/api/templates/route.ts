import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { put, del } from '@vercel/blob';

// 1. LẤY DANH SÁCH (GET)
export async function GET() {
  try {
    const data = await prisma.template.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

// 2. UPLOAD FILE (POST) - CHẠY TRÊN SERVER ĐỂ TRÁNH CORS
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: "Thiếu file" }, { status: 400 });

    // Đẩy trực tiếp từ Server lên Cloud
    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN 
    });

    // Lưu link vào Database
    const newTemplate = await prisma.template.create({
      data: {
        name: file.name.replace('.docx', ''),
        url: blob.url,
      }
    });

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error("Lỗi Server:", error);
    return NextResponse.json({ error: "Lỗi xử lý upload" }, { status: 500 });
  }
}

// 3. XÓA FILE (DELETE)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });

    const item = await prisma.template.findUnique({ where: { id } });
    if (item?.url) {
      await del(item.url); // Xóa file trên Cloud
    }
    await prisma.template.delete({ where: { id } });

    return NextResponse.json({ message: "Đã xóa" });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi xóa" }, { status: 500 });
  }
}

// 4. ĐỔI TÊN BIỂU MẪU (PATCH)
export async function PATCH(req: Request) {
  try {
    const { id, newName } = await req.json();

    if (!id || !newName) {
      return NextResponse.json({ error: "Thiếu ID hoặc tên mới" }, { status: 400 });
    }

    // Cập nhật tên hiển thị trong Database Neon
    const updated = await prisma.template.update({
      where: { id: id },
      data: { 
        // Loại bỏ đuôi .docx nếu người dùng lỡ nhập vào để tên hiển thị đẹp hơn
        name: newName.trim().replace(/\.docx$/i, '') 
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Lỗi đổi tên:", error);
    return NextResponse.json({ error: "Không thể đổi tên trong hệ thống" }, { status: 500 });
  }
}