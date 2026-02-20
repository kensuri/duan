'use client'
import React, { useState, useEffect, useMemo } from "react";
import {
  Button, Divider, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Spinner, Accordion, AccordionItem, Chip, Textarea, Pagination
} from "@nextui-org/react";
import {
  PlusIcon, FileTextIcon, FolderIcon, RefreshCw,
  DatabaseIcon, Trash2Icon, TableIcon, LogOutIcon, SearchIcon
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { signOut } from "next-auth/react";

/* ======================================================
    UTILS: ĐỊNH DẠNG & ĐỌC SỐ
====================================================== */
const formatMoney = (value: any) => {
  if (value === null || value === undefined || value === "") return "";
  const numStr = value.toString().replace(/\D/g, '');
  if (!numStr) return "";
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseMoney = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === 'number') return value;
  return parseFloat(value.toString().replace(/\./g, "")) || 0;
};

const docSoThanhChu = (so: number): string => {
  if (!so || so === 0) return "";
  const ChuSo = [" không", " một", " hai", " ba", " bốn", " năm", " sáu", " bảy", " tám", " chín"];
  const Tien = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];

  const docSo3ChuSo = (baso: number) => {
    let tram = Math.floor(baso / 100);
    let chuc = Math.floor((baso % 100) / 10);
    let donvi = baso % 10;
    let kq = "";
    if (tram > 0) kq += ChuSo[tram] + " trăm";
    if (chuc > 0) {
      if (chuc === 1) kq += " mười";
      else kq += ChuSo[chuc] + " mươi";
    } else if (tram > 0 && donvi > 0) kq += " lẻ";
    if (donvi > 0) {
      if (donvi === 1 && chuc > 1) kq += " mốt";
      else if (donvi === 5 && chuc > 0) kq += " lăm";
      else kq += ChuSo[donvi];
    }
    return kq;
  };

  let s = Math.abs(Math.floor(so)).toString();
  let mang: string[] = [];
  while (s.length > 0) {
    mang.push(s.substring(Math.max(0, s.length - 3), s.length));
    s = s.substring(0, Math.max(0, s.length - 3));
  }
  let chuoi = "";
  for (let i = mang.length - 1; i >= 0; i--) {
    let tmp = docSo3ChuSo(parseInt(mang[i]));
    if (tmp !== "") chuoi += tmp + Tien[i];
  }
  chuoi = chuoi.trim();
  if (!chuoi) return "";
  return chuoi.charAt(0).toUpperCase() + chuoi.slice(1) + " đồng.";
};

/* ======================================================
    DYNAMITC TABLE COMPONENT
====================================================== */
const SuperDynamicTable = ({ value, onChange }: any) => {
  const [columns, setColumns] = useState<{ key: string; label: string }[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [pasteText, setPasteText] = useState("");

  useEffect(() => {
    if (value) {
      try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        if (parsed?.columns) setColumns(parsed.columns);
        if (parsed?.rows) setRows(parsed.rows);
      } catch { console.error("Lỗi parse bảng"); }
    }
  }, [value]);

  const updateParent = (cols: any[], rs: any[]) => {
    onChange(JSON.stringify({ columns: cols, rows: rs }));
  };

  const addColumn = () => {
    const idx = columns.length + 1;
    const nextCols = [...columns, { key: `col_${idx}`, label: `Cột ${idx}` }];
    setColumns(nextCols); updateParent(nextCols, rows);
  };

  const addRow = () => {
    const newRow = columns.reduce((acc: any, c) => ({ ...acc, [c.key]: "" }), {});
    const nextRows = [...rows, newRow];
    setRows(nextRows); updateParent(columns, nextRows);
  };

  const parsePaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split(/\r?\n/).map(l => l.split("\t"));
    if (lines.length < 2) return alert("Cần tiêu đề và ít nhất 1 dòng dữ liệu");
    const headers = lines[0];
    const cols = headers.map((h, i) => ({ key: `col_${i + 1}`, label: h || `Cột ${i + 1}` }));
    const rs = lines.slice(1).map(line => {
      const r: any = {};
      cols.forEach((c, i) => r[c.key] = line[i] ?? "");
      return r;
    });
    setColumns(cols); setRows(rs); updateParent(cols, rs); setPasteText("");
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-dashed my-2 text-black">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 flex gap-2 items-center uppercase"><TableIcon size={16} /> Bảng dữ liệu động</span>
        <div className="flex gap-2">
          <Button size="sm" variant="flat" onPress={addColumn}>+ Cột</Button>
          <Button size="sm" color="success" variant="flat" onPress={addRow}>+ Dòng</Button>
        </div>
      </div>
      <Textarea label="Dán từ Excel" placeholder="Copy từ Excel rồi dán vào đây..." value={pasteText} onChange={e => setPasteText(e.target.value)} />
      <Button size="sm" color="primary" variant="ghost" onPress={parsePaste}>Khởi tạo nhanh</Button>
      <div className="overflow-x-auto bg-white border rounded-xl">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} className="border p-2 bg-slate-100 text-xs font-bold uppercase">
                  <input className="w-full text-center bg-transparent outline-none" value={c.label} onChange={e => {
                    const next = columns.map(x => x.key === c.key ? {...x, label: e.target.value} : x);
                    setColumns(next); updateParent(next, rows);
                  }} />
                </th>
              ))}
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td key={c.key} className="border p-1">
                    <input className="w-full p-1 text-sm outline-none" value={r[c.key] || ""} onChange={e => {
                      const next = [...rows]; next[i] = { ...next[i], [c.key]: e.target.value };
                      setRows(next); updateParent(columns, next);
                    }} />
                  </td>
                ))}
                <td className="text-center">
                  <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => {
                    const next = rows.filter((_, idx) => idx !== i);
                    setRows(next); updateParent(columns, next);
                  }}><Trash2Icon size={14} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ======================================================
    MAIN PAGE COMPONENT
====================================================== */
export default function Home() {
  const router = useRouter();
  const { isOpen: isProjectOpen, onOpen: onProjectOpen, onOpenChange: onProjectOpenChange } = useDisclosure();
  const { isOpen: isVarOpen, onOpen: onVarOpen, onOpenChange: onVarOpenChange } = useDisclosure();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [dynamicFields, setDynamicFields] = useState<string[]>([]);
  const [searchField, setSearchField] = useState("");
  const [formData, setFormData] = useState<any>({});
  const [suggestions, setSuggestions] = useState<any>({});
  const [searchProject, setSearchProject] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [DanhBaDonVi, setDanhBaDonVi] = useState<any[]>([]);

  const fetchData = async () => {
    setFetching(true);
    try {
      const [pRes, cRes, dRes, sRes] = await Promise.all([
        fetch("/api/du-an"),
        fetch("/api/admin/columns"),
        fetch("/api/don-vi"),
        fetch("/api/goi-y")
      ]);
      if (pRes.ok) setProjects(await pRes.json());
      if (dRes.ok) setDanhBaDonVi(await dRes.json());
      if (sRes.ok) setSuggestions(await sRes.json());
      if (cRes.ok) {
        const cData = await cRes.json();
        const clean = cData.details
          .filter((d: any) => !['id', 'createdAt', 'updatedAt', 'trang_thai', 'nguoi_tao', 'createdat', 'updatedat'].includes(d.column_name.toLowerCase()))
          .map((d: any) => d.column_name);
        setDynamicFields(clean);
      }
    } catch (e) {
      console.error("Lỗi tải dữ liệu:", e);
    } finally { setFetching(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (isVarOpen && selectedProject) {
      setFormData({ ...selectedProject });
    }
  }, [isVarOpen, selectedProject]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) =>
      p.ten_du_an_du_toan_mua_sam?.toLowerCase().includes(searchProject.toLowerCase()) ||
      p.ten_goi_thau?.toLowerCase().includes(searchProject.toLowerCase())
    );
  }, [projects, searchProject]);

  const pages = Math.ceil(filteredProjects.length / rowsPerPage);
  const items = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredProjects.slice(start, end);
  }, [currentPage, filteredProjects]);

  const getGroupedFields = useMemo(() => {
    const groups = [
      { id: "g1", name: "1. THÔNG TIN CHUNG", keywords: ["ten_du_an_du_toan_mua_sam", "ten_goi_thau", "so_tt_bcdx_chu_truong", "ngay_chu_truong", "don_vi_trinh_chu_truong", "cap_co_tham_quyen", "nguoi_co_tham_quyen", "chu_dau_tu", "don_vi_trinh_chu_dau_tu", "don_vi_bao_gia_1", "gia_bao_gia_sau_thue_1", "don_vi_bao_gia_2", "gia_bao_gia_sau_thue_2", "don_vi_bao_gia_3", "gia_bao_gia_sau_thue_3", "gia_trung_binh_bao_gia", "du_toan_goi_thau_truoc_thue", "phan_tram_thue", "tien_thue_du_toan", "tien_du_toan_goi_thau_sau_thue", "bang_chu_du_toan_sau_thue", "nguon_von", "bang_quy_mo"], fields: [] as string[] },
      { id: "g2", name: "2. LỰA CHỌN NHÀ THẦU", keywords: ["so_tt_khclnt", "ngay_tt_khlcnt", "thoi_gian_thuc_hien", "dia_diem_thuc_hien", "nam_tai_chinh", "hinh_thuc_lua_chon_nha_thau", "phuong_thuc_lua_chon_nha_thau", "thoi_gian_to_chuc_lua_chon_nha_thau", "thoi_gian_bat_dau_to_chuc_lua_chon_nha_thau", "loai_hop_dong", "thoi_gian_thuc_hien_goi_thau", "tuy_chon_mua_them", "so_qd_khclnt", "ngay_qd_khlcnt", "ngay_dang_tai_khlcnt", "ma_khlcnt", "so_etbmt", "gia_tri_bao_lanh_du_thau", "ngay_thong_bao_moi_thau", "ngay_dong_thau"], fields: [] as string[] },
      { id: "g3", name: "3. THƯƠNG THẢO & KẾT QUẢ", keywords: ["ngay_hoan_thien_hop_dong", "so_van_ban_phe_duyet_ket_qua", "ngay_van_ban_phe_duyet_ket_qua", "so_hop_dong", "ngay_hop_dong"], fields: [] as string[] },
      { id: "g4", name: "4. CHỦ ĐẦU TƯ & NHÀ THẦU", keywords: ["dai_dien_chu_dau_tu", "chuc_vu_dai_dien_chu_dau_tu", "dia_chi_chu_dau_tu", "ma_so_thue_chu_dau_tu", "cq_quan_ly_thue_chu_dau_tu", "ma_qhns_chu_dau_tu", "dien_thoai_chu_dau_tu", "tai_khoan_chu_dau_tu", "uy_quyen_chu_dau_tu", "nha_thau", "dai_dien_nha_thau", "chuc_vu_dai_dien_nha_thau", "dia_chi_nha_thau", "ma_so_thue_nha_thau", "cq_quan_ly_thue_nha_thau", "dien_thoai_nha_thau", "tai_khoan_nha_thau", "uy_quyen_nha_thau"], fields: [] as string[] },
      { id: "g5", name: "5. HỢP ĐỒNG & NGHIỆM THU", keywords: ["gia_tri_hop_dong_truoc_thue", "gia_tri_thue_hop_dong", "gia_tri_hop_dong_sau_thue", "bang_chu_hop_dong_sau_thue", "bang_hop_dong", "gia_tri_bao_lanh_hop_dong", "gia_tri_tam_ung_hop_dong", "ngay_nghiem_thu_ban_giao", "ngay_thanh_ly_hop_dong"], fields: [] as string[] },
      { id: "g6", name: "6. CÁC BIẾN KHÁC", keywords: [], fields: [] as string[] }
    ];
    if (!dynamicFields) return groups;
    dynamicFields.forEach(field => {
      const fieldLower = field.toLowerCase();
      const group = groups.find(g => g.keywords.some(k => k.toLowerCase() === fieldLower));
      if (group) group.fields.push(field);
      else groups[5].fields.push(field);
    });
    return groups;
  }, [dynamicFields]);

  const handleFieldChange = (name: string, value: any) => {
    let updated = { ...formData, [name]: value };
    const autoFillMap = [
      { trigger: 'chu_dau_tu', prefix: '_chu_dau_tu' },
      { trigger: 'nha_thau', prefix: '_nha_thau' }
    ];

    autoFillMap.forEach(item => {
      if (name === item.trigger) {
        const found = DanhBaDonVi.find(dv => dv.ten_don_vi === value);
        if (found) {
          updated[`dia_chi${item.prefix}`] = found.dia_chi || "";
          updated[`dai_dien${item.prefix}`] = found.dai_dien || "";
          updated[`chuc_vu_dai_dien${item.prefix}`] = found.chuc_vu || "";
          updated[`ma_so_thue${item.prefix}`] = found.ma_so_thue || "";
          updated[`cq_quan_ly_thue${item.prefix}`] = found.cq_quan_ly_thue || "";
          updated[`dien_thoai${item.prefix}`] = found.dien_thoai || "";
          updated[`uy_quyen${item.prefix}`] = found.uy_quyen || "";
          if (found.so_tai_khoan) {
            updated[`tai_khoan${item.prefix}`] = `${found.so_tai_khoan}${found.ngan_hang ? ' tại ' + found.ngan_hang : ''}`;
          }
        }
      }
    });

    if (['du_toan_goi_thau_truoc_thue', 'phan_tram_thue', 'tien_thue_du_toan'].includes(name)) {
      const truocThue = name === 'du_toan_goi_thau_truoc_thue' ? parseMoney(value) : parseMoney(updated.du_toan_goi_thau_truoc_thue);
      const ptThue = name === 'phan_tram_thue' ? parseFloat(value.toString().replace(',', '.')) || 0 : parseFloat((updated.phan_tram_thue || 0).toString().replace(',', '.'));
      let tienThue = parseMoney(name === 'tien_thue_du_toan' ? value : updated.tien_thue_du_toan);
      if (name !== 'tien_thue_du_toan' && truocThue) {
        tienThue = (truocThue * ptThue) / 100;
        updated.tien_thue_du_toan = tienThue;
      }
      const tongSauThue = (truocThue || 0) + (tienThue || 0);
      updated.tien_du_toan_goi_thau_sau_thue = tongSauThue;
      updated.bang_chu_du_toan_sau_thue = docSoThanhChu(tongSauThue);
    }

    if (['gia_tri_hop_dong_truoc_thue', 'gia_tri_thue_hop_dong'].includes(name)) {
      const g1 = name === 'gia_tri_hop_dong_truoc_thue' ? parseMoney(value) : parseMoney(updated.gia_tri_hop_dong_truoc_thue);
      const g2 = name === 'gia_tri_thue_hop_dong' ? parseMoney(value) : parseMoney(updated.gia_tri_thue_hop_dong);
      const tongHD = (g1 || 0) + (g2 || 0);
      updated.gia_tri_hop_dong_sau_thue = tongHD;
      updated.bang_chu_hop_dong_sau_thue = docSoThanhChu(tongHD);
    }
    setFormData(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload: any = {};
    Object.keys(formData).forEach(key => {
      const val = formData[key];
      const isNumericField = (key.includes('gia_') || key.includes('tien_') || key.includes('phan_tram_') || key.includes('du_toan_')) &&
                             !key.includes('don_vi') && !key.includes('ten_') && !key.includes('bang_chu_') && !key.includes('nguoi_');
      if (isNumericField) {
        if (val === "" || val === null || val === undefined) payload[key] = null;
        else {
          const cleanNum = val.toString().replace(/\./g, "").replace(",", ".");
          const parsed = parseFloat(cleanNum);
          payload[key] = isNaN(parsed) ? null : parsed;
        }
      } else if (key.startsWith('ngay_')) {
        payload[key] = val ? new Date(val).toISOString() : null;
      } else {
        payload[key] = val === "" ? null : val;
      }
    });
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;

    try {
      const res = await fetch(`/api/du-an/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) { await fetchData(); onVarOpenChange(); }
      else { const errorData = await res.json(); alert("Lỗi: " + errorData.error); }
    } catch (err) { alert("Lỗi kết nối server."); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 text-black">
      <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">Quản lý Hồ sơ Dự án</h1>
          <p className="text-xs text-slate-400 font-bold uppercase">PHÒNG DATH TTGPS • MOBIFONE ĐỒNG NAI</p>
        </div>
        <div className="flex gap-2">
          <Button isIconOnly variant="flat" onPress={fetchData} isLoading={fetching}><RefreshCw size={20} /></Button>
          <Button color="warning" variant="flat" className="font-bold" startContent={<TableIcon size={20} />} onPress={() => router.push('/quan-ly-don-vi')}>Danh bạ</Button>
          <Button color="secondary" variant="flat" className="font-bold" startContent={<FolderIcon size={20} />} onPress={() => router.push('/quan-ly-bieu-mau')}>Biểu mẫu</Button>
          <Button color="primary" onPress={onProjectOpen} startContent={<PlusIcon size={20} />} className="font-bold">Tạo Dự án</Button>
          <Button isIconOnly color="danger" variant="flat" onPress={() => signOut()}><LogOutIcon size={20} /></Button>
        </div>
      </header>

      <div className="mb-4 flex justify-end">
        <Input isClearable className="w-full sm:max-w-[44%]" placeholder="Tìm kiếm nhanh dự án..." startContent={<SearchIcon size={18} />} value={searchProject} onValueChange={(v) => { setSearchProject(v); setCurrentPage(1); }} />
      </div>

      <Table 
        aria-label="Projects table"
        bottomContent={pages > 1 ? (
          <div className="flex w-full justify-center">
            <Pagination isCompact showControls showShadow color="primary" page={currentPage} total={pages} onChange={(page) => setCurrentPage(page)} />
          </div>
        ) : null}
      >
        <TableHeader>
          <TableColumn>TÊN DỰ ÁN / GÓI THẦU</TableColumn>
          <TableColumn align="center">HÀNH ĐỘNG</TableColumn>
        </TableHeader>
        <TableBody items={items} emptyContent={fetching ? <Spinner /> : "Không có dữ liệu."}>
          {(item: any) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-bold text-blue-900 uppercase">{item.ten_du_an_du_toan_mua_sam}</div>
                <div className="text-[10px] text-slate-400 mt-1 italic">{item.ten_goi_thau}</div>
              </TableCell>
              <TableCell align="center">
                <div className="flex justify-center gap-2">
                  <Button size="sm" color="warning" variant="flat" className="font-bold" startContent={<DatabaseIcon size={14} />} onPress={() => { setSelectedProject(item); onVarOpen(); }}>NHẬP BIẾN</Button>
                  <Button size="sm" color="secondary" variant="flat" className="font-bold" startContent={<FileTextIcon size={14} />} onPress={() => router.push(`/soan-ho-so/${item.id}`)}>SOẠN FILE</Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={isVarOpen} onOpenChange={onVarOpenChange} size="5xl" scrollBehavior="inside">
        <ModalContent className="text-black">
          {(onClose) => (
            <form onSubmit={handleSave}>
              <ModalHeader className="border-b text-blue-700 font-bold uppercase py-4">Kê khai biến số</ModalHeader>
              <ModalBody className="py-6 bg-slate-50/50">
                <datalist id="list-danh-ba">
                  {DanhBaDonVi.map((dv, idx) => (<option key={idx} value={dv.ten_don_vi} />))}
                </datalist>
                {Object.keys(suggestions).map((key) => (
                  <datalist id={`suggest-${key}`} key={key}>
                    {suggestions[key].map((val: string, index: number) => (<option key={index} value={val} />))}
                  </datalist>
                ))}
                <div className="mb-4">
                  <Input placeholder="Tìm nhanh biến..." variant="bordered" startContent={<SearchIcon size={18} />} onValueChange={setSearchField} />
                </div>
                <Accordion selectionMode="multiple" variant="splitted" defaultExpandedKeys={["g1"]}>
                  {getGroupedFields.map(group => {
                    const visibleFields = group.fields.filter(f => f.toLowerCase().includes(searchField.toLowerCase()));
                    if (visibleFields.length === 0) return null;
                    return (
                      <AccordionItem key={group.id} textValue={group.name} title={<span className="font-bold text-xs text-blue-800 uppercase">{group.name}</span>}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
                          {visibleFields.map(f => {
                            const isTable = f === 'bang_quy_mo' || f === 'bang_hop_dong';
                            const isDate = f.startsWith('ngay_');
                            const isNumeric = (f.includes('gia_') || f.includes('tien_') || f.includes('phan_tram_') || f.includes('du_toan_')) &&
                                              !f.includes('don_vi') && !f.includes('ten_') && !f.includes('bang_chu_') && !f.includes('nguoi_');
                            const isAutocomplete = ['don_vi_bao_gia_1', 'don_vi_bao_gia_2', 'don_vi_bao_gia_3', 'cap_co_tham_quyen', 'chu_dau_tu', 'nha_thau'].includes(f);
                            const hasSuggestion = suggestions[f] && suggestions[f].length > 0;
                            const listId = isAutocomplete ? "list-danh-ba" : (hasSuggestion ? `suggest-${f}` : undefined);

                            return (
                              <div key={f} className={isTable ? "col-span-1 md:col-span-3" : "col-span-1"}>
                                {isTable ? (
                                  <SuperDynamicTable value={formData[f]} onChange={(v: string) => handleFieldChange(f, v)} />
                                ) : (
                                  <Input 
                                    name={f} label={f.replace(/_/g, ' ').toUpperCase()} labelPlacement="outside" variant="bordered"
                                    list={listId} type={isDate ? "date" : "text"} 
                                    value={isNumeric ? formatMoney(formData[f]) : (isDate && formData[f] ? formData[f].split('T')[0] : formData[f] || "")}
                                    onChange={(e) => handleFieldChange(f, e.target.value)}
                                    placeholder={isDate ? "dd/mm/yyyy" : (listId ? "Chọn nhanh..." : "...")}
                                    className="font-medium"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </ModalBody>
              <ModalFooter className="border-t">
                <Button variant="light" onPress={onClose}>Hủy</Button>
                <Button color="primary" type="submit" isLoading={loading} className="px-10 font-bold">LƯU DỮ LIỆU</Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isProjectOpen} onOpenChange={onProjectOpenChange} size="2xl">
        <ModalContent className="text-black">
          {(onClose) => (
            <form onSubmit={async (e) => {
              e.preventDefault(); setLoading(true);
              try {
                const fd = new FormData(e.currentTarget);
                const data: any = Object.fromEntries(fd.entries());
                if (data.ngay_chu_truong) {
                  const d = new Date(data.ngay_chu_truong);
                  data.ngay_chu_truong = isNaN(d.getTime()) ? null : d.toISOString();
                } else data.ngay_chu_truong = null;
                const res = await fetch("/api/du-an", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
                if (res.ok) { onProjectOpenChange(); fetchData(); }
                else { const ed = await res.json(); alert("Lỗi: " + ed.error); }
              } catch (error) { alert("Lỗi kết nối."); } finally { setLoading(false); }
            }}>
              <ModalHeader className="text-blue-600 font-bold border-b uppercase">Khởi tạo dự án</ModalHeader>
              <ModalBody className="gap-6 py-8">
                <Input name="ten_du_an_du_toan_mua_sam" label="TÊN DỰ ÁN" labelPlacement="outside" variant="bordered" isRequired />
                <Input name="ten_goi_thau" label="TÊN GÓI THẦU" labelPlacement="outside" variant="bordered" isRequired />
                <div className="flex gap-4">
                  <Input name="so_tt_bcdx_chu_truong" label="SỐ BÁO CÁO/TỜ TRÌNH CHỦ TRƯƠNG" labelPlacement="outside" variant="bordered" />
                  <Input name="ngay_chu_truong" label="NGÀY CHỦ TRƯƠNG" type="date" labelPlacement="outside" variant="bordered" />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Đóng</Button>
                <Button color="primary" type="submit" isLoading={loading} className="px-10 font-bold">TẠO MỚI</Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}