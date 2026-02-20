'use client'
import React, { useState, useEffect, useMemo } from "react";
import { 
  Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Card, CardHeader, CardBody, Spinner, Input, Pagination 
} from "@nextui-org/react";
import { Trash2Icon, UploadCloudIcon, ArrowLeftIcon, SearchIcon, Edit3Icon } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function QuanLyBieuMau() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  
  // State phục vụ tìm kiếm và phân trang
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; 

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) setTemplates(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  // Logic lọc dữ liệu dựa trên searchQuery
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.file.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, templates]);

  // Logic phân trang
  const pages = Math.ceil(filteredTemplates.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredTemplates.slice(start, end);
  }, [currentPage, filteredTemplates]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    await fetch('/api/templates', { method: 'POST', body: formData });
    setUploading(false);
    fetchTemplates();
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Xác nhận xóa mẫu: ${fileName}?`)) return;
    await fetch(`/api/templates?fileName=${fileName}`, { method: 'DELETE' });
    fetchTemplates();
  };

  // HÀM ĐỔI TÊN ĐÃ ĐƯỢC FIX LỖI ASYNC/AWAIT
  const handleRename = async (item: any) => {
    // 1. Hiện thông báo nhập tên mới
    const newName = prompt("Nhập tên mới cho biểu mẫu (không cần đuôi .docx):", item.name);
    
    // Nếu bấm Hủy, để trống hoặc không đổi tên thì thoát
    if (!newName || newName.trim() === "" || newName.trim().toUpperCase() === item.name) return;

    try {
      setIsRenaming(true);
      const res = await fetch('/api/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldName: item.file,    // Khớp với 'oldName' ở Backend của bạn
          newName: newName.trim() // Tên mới người dùng nhập
        })
      });

      if (res.ok) {
        alert("Đã đổi tên biểu mẫu thành công!");
        fetchTemplates(); // Tải lại danh sách để cập nhật giao diện
      } else {
        const err = await res.json();
        alert("Lỗi: " + err.error);
      }
    } catch (error) {
      alert("Không thể kết nối máy chủ");
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 text-black">
      <Button variant="light" startContent={<ArrowLeftIcon size={18}/>} onPress={() => router.push('/')} className="mb-4 text-blue-600 font-bold"> Quay lại trang chủ</Button>
      
      <Card shadow="sm" className="border">
        <CardHeader className="flex flex-col gap-4 p-6 border-b items-start">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-black uppercase text-blue-600">Kho biểu mẫu hệ thống</h2>
            <div>
              <input type="file" id="upload-file" hidden accept=".docx" onChange={handleUpload} />
              <Button as="label" htmlFor="upload-file" color="primary" className="font-bold shadow-lg" isLoading={uploading} startContent={<UploadCloudIcon size={20}/>}>
                Tải lên (.docx)
              </Button>
            </div>
          </div>

          <Input
            isClearable
            className="w-full"
            placeholder="Tìm kiếm tên biểu mẫu..."
            startContent={<SearchIcon className="text-slate-400" size={18} />}
            value={searchQuery}
            onValueChange={(v) => {
              setSearchQuery(v);
              setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
            }}
            variant="bordered"
          />
        </CardHeader>

        <CardBody className="p-0">
          <Table 
            aria-label="Template table" 
            removeWrapper
            bottomContent={
              pages > 1 ? (
                <div className="flex w-full justify-center py-4 border-t">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={currentPage}
                    total={pages}
                    onChange={(page) => setCurrentPage(page)}
                  />
                </div>
              ) : null
            }
          >
            <TableHeader>
              <TableColumn className="bg-slate-50 uppercase font-bold">Tên mẫu hệ thống</TableColumn>
              <TableColumn align="center" width={120} className="bg-slate-50 uppercase font-bold">Thao tác</TableColumn>
            </TableHeader>
            <TableBody 
              items={items} 
              emptyContent={loading ? <Spinner label="Đang tải..." /> : "Không tìm thấy biểu mẫu nào phù hợp."}
            >
              {(item: any) => (
                <TableRow key={item.file} className="hover:bg-blue-50/50 transition-colors border-b last:border-0">
                  <TableCell className="font-bold py-4 text-slate-700">{item.name}</TableCell>
                  <TableCell align="center">
                    <div className="flex justify-center gap-2">
                      {/* NÚT ĐỔI TÊN MỚI THÊM */}
                      <Button isIconOnly color="warning" variant="flat" size="sm" onPress={() => handleRename(item)} isLoading={isRenaming}>
                        <Edit3Icon size={16} />
                      </Button>

                      {/* NÚT XÓA TẠM ẨN ĐỂ TRÁNH XÓA NHẦM - BỎ CHÚ THÍCH NẾU MUỐN SỬ DỤNG LẠI */}
                      {/*
                      <Button isIconOnly color="danger" variant="light" size="sm" onPress={() => handleDelete(item.file)}>
                        <Trash2Icon size={16} />
                      </Button> 
                      */}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
      
      <div className="mt-4 text-[10px] text-slate-400 uppercase font-bold text-center italic">
        Lưu ý: Mọi thay đổi về tên file sẽ ảnh hưởng trực tiếp đến dữ liệu mẫu trong hệ thống.
      </div>
    </div>
  );
}