'use client'
import React, { useState, useEffect, useMemo } from "react";
import { 
  Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, 
  Card, CardHeader, CardBody, Spinner, Input, Pagination 
} from "@nextui-org/react";
import { Trash2Icon, UploadCloudIcon, ArrowLeftIcon, SearchIcon, Edit3Icon } from "lucide-react";
import { useRouter } from 'next/navigation';
// Import thư viện upload của Vercel
import { upload } from '@vercel/blob/client';

export default function QuanLyBieuMau() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10; 

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) setTemplates(await res.json());
    } catch (error) {
      console.error("Lỗi khi tải danh sách mẫu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.file && t.file.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, templates]);

  const pages = Math.ceil(filteredTemplates.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredTemplates.slice(start, start + rowsPerPage);
  }, [currentPage, filteredTemplates]);

  // --- LOGIC UPLOAD MỚI DÙNG VERCEL BLOB ---
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading(true);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/templates', {
      method: 'POST',
      body: formData, // Gửi FormData chứa file
    });

    if (res.ok) {
      alert("Tải lên thành công!");
      fetchTemplates();
    } else {
      alert("Máy chủ báo lỗi. Hãy kiểm tra Token trong .env");
    }
  } catch (error) {
    alert("Lỗi kết nối Localhost");
  } finally {
    setUploading(false);
    e.target.value = ""; 
  }
};

  const handleDelete = async (item: any) => {
    if (!confirm(`Xác nhận xóa mẫu: ${item.name}?`)) return;
    
    try {
      // Xóa trong Database (API của Bản nên xử lý xóa cả trên Blob nếu cần)
      const res = await fetch(`/api/templates?id=${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Đã xóa biểu mẫu");
        fetchTemplates();
      }
    } catch (error) {
      alert("Lỗi khi xóa");
    }
  };

  const handleRename = async (item: any) => {
  const newName = prompt("Nhập tên mới cho biểu mẫu:", item.name);
  
  // Nếu bấm Hủy hoặc không thay đổi thì thoát
  if (!newName || newName.trim() === "" || newName.trim() === item.name) return;

  try {
    setIsRenaming(true);
    const res = await fetch('/api/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,       // Gửi ID của bản ghi trong Neon
        newName: newName.trim()
      })
    });

    if (res.ok) {
      alert("Đã đổi tên biểu mẫu thành công!");
      fetchTemplates(); // Tải lại danh sách
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
            <h2 className="text-xl font-black uppercase text-blue-600">Kho biểu mẫu Vercel Cloud</h2>
            <div>
              <input type="file" id="upload-file" hidden accept=".docx" onChange={handleUpload} />
              <Button as="label" htmlFor="upload-file" color="primary" className="font-bold shadow-lg cursor-pointer" isLoading={uploading} startContent={<UploadCloudIcon size={20}/>}>
                {uploading ? "Đang tải..." : "Tải lên (.docx)"}
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
              setCurrentPage(1);
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
                  <Pagination isCompact showControls showShadow color="primary" page={currentPage} total={pages} onChange={setCurrentPage} />
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
              emptyContent={loading ? <Spinner label="Đang tải..." /> : "Không tìm thấy biểu mẫu nào."}
            >
              {(item: any) => (
                <TableRow key={item.id || item.url} className="hover:bg-blue-50/50 transition-colors border-b last:border-0">
                  <TableCell className="font-bold py-4 text-slate-700">
                    <div className="flex flex-col">
                       <span>{item.name}</span>
                       <span className="text-[9px] text-slate-400 font-normal truncate max-w-[300px]">{item.url}</span>
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <div className="flex justify-center gap-2">
                      <Button isIconOnly color="warning" variant="flat" size="sm" onPress={() => handleRename(item)} isLoading={isRenaming}>
                        <Edit3Icon size={16} />
                      </Button>
                      <Button isIconOnly color="danger" variant="flat" size="sm" onPress={() => handleDelete(item)}>
                        <Trash2Icon size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
      
      <div className="mt-4 text-[10px] text-slate-400 uppercase font-bold text-center italic">
        Lưu ý: Biểu mẫu được lưu trữ an toàn trên Vercel Blob Storage.
      </div>
    </div>
  );
}