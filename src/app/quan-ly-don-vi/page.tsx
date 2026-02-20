'use client'
import React, { useState, useEffect, useMemo } from "react";
import {
  Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
  Card, CardBody, Spinner, Pagination
} from "@nextui-org/react";
import { PlusIcon, Trash2Icon, Edit3Icon, ArrowLeftIcon, SearchIcon } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function QuanLyDonVi() {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [danhSach, setDanhSach] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);

  // Cấu hình phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const fetchData = async () => {
    setFetching(true);
    const res = await fetch("/api/don-vi");
    if (res.ok) setDanhSach(await res.json());
    setFetching(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const method = editingItem ? "PATCH" : "POST";

    try {
      const res = await fetch("/api/don-vi", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem ? { ...data, id: editingItem.id } : data)
      });
      if (res.ok) {
        fetchData();
        onOpenChange();
        setEditingItem(null);
      }
    } catch (error) {
      alert("Lỗi khi lưu dữ liệu");
    } finally { setLoading(false); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Xác nhận xóa đơn vị này khỏi danh bạ?")) return;
    const res = await fetch(`/api/don-vi?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  // Logic lọc dữ liệu
  const filteredData = useMemo(() => {
    return danhSach.filter(item => 
      item.ten_don_vi.toLowerCase().includes(search.toLowerCase()) ||
      (item.ma_so_thue && item.ma_so_thue.includes(search))
    );
  }, [danhSach, search]);

  // Logic phân trang
  const pages = Math.ceil(filteredData.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredData.slice(start, end);
  }, [currentPage, filteredData]);

  return (
    <div className="max-w-7xl mx-auto p-8 text-black min-h-screen bg-white">
      <div className="flex justify-between items-center mb-6">
        <Button variant="flat" startContent={<ArrowLeftIcon size={18}/>} onPress={() => router.push('/')}>Quay lại</Button>
        <h1 className="text-2xl font-black text-blue-700 uppercase">Danh bạ Pháp nhân</h1>
        <Button color="primary" className="font-bold" startContent={<PlusIcon />} onPress={() => { setEditingItem(null); onOpen(); }}>Thêm Mới</Button>
      </div>

      <Card className="mb-6 shadow-sm border">
        <CardBody>
          <Input 
            placeholder="Tìm theo tên đơn vị hoặc mã số thuế..." 
            startContent={<SearchIcon className="text-slate-400" size={18}/>}
            value={search}
            onValueChange={(v) => {
              setSearch(v);
              setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
            }}
            variant="bordered"
            isClearable
          />
        </CardBody>
      </Card>

      <Table 
        aria-label="Table danh bạ"
        bottomContent={
          pages > 1 ? (
            <div className="flex w-full justify-center">
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
          <TableColumn>TÊN ĐƠN VỊ (CÔNG TY)</TableColumn>
          <TableColumn>MÃ SỐ THUẾ</TableColumn>
          <TableColumn>ĐẠI DIỆN / CHỨC VỤ</TableColumn>
          <TableColumn align="center">THAO TÁC</TableColumn>
        </TableHeader>
        <TableBody items={items} emptyContent={fetching ? <Spinner /> : "Chưa có đơn vị nào trong danh bạ"}>
          {(item) => (
            <TableRow key={item.id}>
              <TableCell className="font-bold text-blue-800">{item.ten_don_vi}</TableCell>
              <TableCell>{item.ma_so_thue || "---"}</TableCell>
              <TableCell>
                <div className="text-xs">{item.dai_dien}</div>
                <div className="text-[10px] text-slate-400 italic">{item.chuc_vu}</div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Button isIconOnly size="sm" variant="flat" color="warning" onPress={() => { setEditingItem(item); onOpen(); }}><Edit3Icon size={16}/></Button>
                  
                  {/* NÚT XÓA ĐÃ ĐƯỢC ẨN ĐỂ HẠN CHẾ XÓA NHẦM - BẬT LẠI KHI CẦN THIẾT */}
                  {/*
                  <Button isIconOnly size="sm" variant="flat" color="danger" onPress={() => deleteItem(item.id)}>
                    <Trash2Icon size={16}/>
                  </Button> 
                  */}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" scrollBehavior="inside">
        <ModalContent className="text-black">
          {(onClose) => (
            <form onSubmit={handleSubmit}>
              <ModalHeader className="uppercase text-blue-600 border-b font-bold">
                {editingItem ? "Cập nhật thông tin" : "Tạo pháp nhân mới"}
              </ModalHeader>
              <ModalBody className="grid grid-cols-2 gap-4 py-6 bg-slate-50">
                <Input name="ten_don_vi" label="Tên Đơn vị" isRequired className="col-span-2" defaultValue={editingItem?.ten_don_vi} variant="bordered" />
                <Input name="dia_chi" label="Địa chỉ" className="col-span-2" defaultValue={editingItem?.dia_chi} variant="bordered" />
                <Input name="dai_dien" label="Người đại diện" defaultValue={editingItem?.dai_dien} variant="bordered" />
                <Input name="chuc_vu" label="Chức vụ" defaultValue={editingItem?.chuc_vu} variant="bordered" />
                <Input name="ma_so_thue" label="Mã số thuế" defaultValue={editingItem?.ma_so_thue} variant="bordered" />
                <Input name="dien_thoai" label="Điện thoại" defaultValue={editingItem?.dien_thoai} variant="bordered" />
                <Input name="so_tai_khoan" label="Số tài khoản" defaultValue={editingItem?.so_tai_khoan} variant="bordered" />
                <Input name="ngan_hang" label="Tại ngân hàng" defaultValue={editingItem?.ngan_hang} variant="bordered" />
                <Input name="cq_quan_ly_thue" label="Cơ quan thuế" defaultValue={editingItem?.cq_quan_ly_thue} variant="bordered" />
                <Input name="uy_quyen" label="Ủy quyền" defaultValue={editingItem?.uy_quyen} variant="bordered" />
              </ModalBody>
              <ModalFooter className="border-t">
                <Button variant="light" onPress={onClose}>Đóng</Button>
                <Button color="primary" type="submit" isLoading={loading} className="font-bold px-8">LƯU DANH BẠ</Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}