import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const templatesDirectory = path.join(process.cwd(), 'public/templates');

// Đảm bảo thư mục tồn tại khi khởi chạy
if (!fs.existsSync(templatesDirectory)) {
  fs.mkdirSync(templatesDirectory, { recursive: true });
}

// 1. GET: Lấy danh sách file
export async function GET() {
  try {
    const fileNames = fs.readdirSync(templatesDirectory);
    const templates = fileNames
      .filter(file => file.endsWith('.docx'))
      .map(file => ({
        id: file, // Dùng tên file làm ID tạm thời
        file: file,
        name: file.replace('.docx', '').replace(/_/g, ' ').toUpperCase()
      }));
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json([]);
  }
}

// 2. POST: Upload file mới
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/\s+/g, '_'); // Thay khoảng trắng bằng gạch dưới
    const filePath = path.join(templatesDirectory, safeName);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ message: "Tải lên thành công", fileName: safeName });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi tải file" }, { status: 500 });
  }
}

// 3. PATCH: Đổi tên file
export async function PATCH(req: Request) {
  try {
    const { oldName, newName } = await req.json();
    const oldPath = path.join(templatesDirectory, oldName);
    // Đảm bảo đuôi file luôn là .docx
    const formattedNewName = newName.trim().replace(/\.docx$/i, '') + '.docx';
    const newPath = path.join(templatesDirectory, formattedNewName);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      return NextResponse.json({ message: "Đổi tên thành công" });
    }
    return NextResponse.json({ error: "Không tìm thấy file cũ" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi đổi tên" }, { status: 500 });
  }
}

// 4. DELETE: Xóa file
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) return NextResponse.json({ error: "Thiếu tên file" }, { status: 400 });

    const filePath = path.join(templatesDirectory, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ message: "Xóa file thành công" });
    }
    return NextResponse.json({ error: "File không tồn tại" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi khi xóa" }, { status: 500 });
  }
}