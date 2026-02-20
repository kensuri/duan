'use client'
import React, { useEffect, useState, use, useMemo } from 'react';
import { Card, Button, Input, Spinner, Chip, Pagination } from "@nextui-org/react";
import { FileDownIcon, SaveIcon, SearchIcon } from "lucide-react";
import { useRouter } from 'next/navigation';

// Các thư viện xử lý Word
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

/* ======================================================
    UTILS: ĐỊNH DẠNG SỐ TIỀN (BỔ SUNG ĐỂ TRÁNH LỖI)
====================================================== */
const formatMoney = (value: any) => {
  if (value === null || value === undefined || value === "") return "";
  const numStr = value.toString().replace(/\D/g, '');
  if (!numStr) return "";
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function SoanHoSoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  
  const [searchTemplate, setSearchTemplate] = useState("");
  const [templatePage, setTemplatePage] = useState(1);
  const templatesPerPage = 10;
  const [suggestions, setSuggestions] = useState<any>({});

  useEffect(() => {
    async function initPage() {
      try {
        const [projectRes, templateRes, suggestRes] = await Promise.all([
          fetch(`/api/du-an/${id}`),
          fetch('/api/templates'),
          fetch('/api/goi-y')
        ]);
        if (projectRes.ok) setProject(await projectRes.json());
        if (templateRes.ok) setTemplates(await templateRes.json());
        if (suggestRes.ok) setSuggestions(await suggestRes.json());
      } catch (error) {
        console.error("Lỗi khởi tạo:", error);
      } finally {
        setLoading(false);
      }
    }
    initPage();
  }, [id]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => t.name.toLowerCase().includes(searchTemplate.toLowerCase()));
  }, [templates, searchTemplate]);

  const totalTemplatePages = Math.ceil(filteredTemplates.length / templatesPerPage);
  const displayedTemplates = useMemo(() => {
    const start = (templatePage - 1) * templatesPerPage;
    return filteredTemplates.slice(start, start + templatesPerPage);
  }, [templatePage, filteredTemplates]);

  const getSafeValue = (field: string) => {
    if (!project) return "";
    const val = project[field];
    if (val === null || val === undefined || (val === 0 && !field.includes('gia_') && !field.includes('tien_'))) return "";
    return val;
  };

  const updateField = (field: string, value: any) => {
    setProject((prev: any) => ({ ...prev, [field]: value }));
  };

  const inspectTemplate = async (template: any) => {
    setScanning(true);
    setSelectedTemplate(template);
    setRequiredFields([]); // Reset danh sách trường cũ
    
    try {
      // FIX TẠI ĐÂY: Sử dụng template.url (link Vercel Blob) thay vì template.file
      const fileUrl = template.url || `/templates/${template.file}`;
      const response = await fetch(fileUrl);
      
      if (!response.ok) throw new Error("Không thể tải file từ Cloud");
      
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const content = zip.files["word/document.xml"].asText();
      
      // Logic tìm biến {bien_so_1} trong file Word
      const regex = /\{(.+?)\}/g;
      let match;
      const fields = new Set<string>();
      const blackList = ['id', 'ID', 'createdAt', 'updatedAt', 'content', 'trang_thai', 'url'];

      while ((match = regex.exec(content)) !== null) {
        let name = match[1].replace(/<[^>]+>/g, "").trim().replace(/[#/]/g, "");
        if (name && !blackList.includes(name) && name.length < 35 && !name.includes(':')) {
          fields.add(name);
        }
      }
      setRequiredFields(Array.from(fields));
    } catch (e) {
      console.error("Lỗi phân tích template:", e);
      alert("Không thể đọc nội dung file mẫu này. Hãy kiểm tra lại file Word.");
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/du-an/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      if (res.ok) {
        const result = await res.json();
        setProject((prev: any) => ({ ...prev, ...result }));
        alert("Đã lưu hồ sơ thành công!");
      } else { alert("Lỗi khi lưu!"); }
    } catch (e) { alert("Lỗi kết nối server!"); } finally { setUpdating(false); }
  };

  // --- HÀM XUẤT WORD HOÀN THIỆN ---
  const handleExportWord = async () => {
    if (!selectedTemplate || !project) return;
    try {
      const fileUrl = selectedTemplate.url || `/templates/${selectedTemplate.file}`;
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      
      const doc = new Docxtemplater(zip, { 
        paragraphLoop: true, 
        linebreaks: true,
        nullGetter() { return ""; } 
      });

      const dataToRender: any = {};
      
      // Bước 1: Duyệt qua TẤT CẢ các tag thực tế tìm thấy trong file Word (Bao gồm cả viết HOA)
      // Việc này giúp xử lý triệt để {TEN_VIET_HOA} và các biến dài
      requiredFields.forEach(tag => {
        const lowerTag = tag.toLowerCase().trim();
        let val = project[lowerTag];

        // Xử lý các trường hợp đặc biệt bị sai giá trị hoặc thiếu
        if (lowerTag === 'don_vi_bao_gia_2') val = project.don_vi_bao_gia_2;
        if (lowerTag === 'thoi_gian_to_chuc_lua_chon_nha_thau') val = project.thoi_gian_to_chuc_lua_chon_nha_thau;
        if (lowerTag === 'thoi_gian_bat_dau_to_chuc_lua_chon_nha_thau') val = project.thoi_gian_bat_dau_to_chuc_lua_chon_nha_thau;

        // A. XỬ LÝ NGÀY THÁNG
        if (lowerTag.startsWith('ngay_') && val) {
          const date = new Date(val);
          if (!isNaN(date.getTime())) {
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = date.getFullYear();
            val = `${d}/${m}/${y}`;
          }
        } 
        // B. XỬ LÝ SỐ TIỀN
        else if ((lowerTag.includes('gia_') || lowerTag.includes('tien_') || lowerTag.includes('du_toan_')) && 
                 !lowerTag.includes('bang_chu_') && val !== null && val !== "") {
          val = formatMoney(val);
        }

        // C. XỬ LÝ VIẾT HOA THEO YÊU CẦU
        // Nếu tag trong Word là HOA TOÀN BỘ -> Xuất giá trị HOA
        if (tag === tag.toUpperCase() && typeof val === 'string') {
          dataToRender[tag] = val.toUpperCase();
        } else {
          dataToRender[tag] = val ?? "";
        }
      });

      // Bước 2: Xử lý dữ liệu bảng (Giữ nguyên logic bang_quy_mo và bang_hop_dong của Bản)
      const dynamicTableFields = ['bang_quy_mo', 'bang_hop_dong'];
      dynamicTableFields.forEach(field => {
        const rawValue = project[field];
        if (rawValue) {
          try {
            const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
            dataToRender[field] = (parsed.rows || []).map((row: any) => ({
              col_1: row.col_1 || "", col_2: row.col_2 || "", col_3: row.col_3 || "",
              col_4: row.col_4 || "", col_5: row.col_5 || "", col_6: row.col_6 || "",
            }));
            const prefix = field === 'bang_quy_mo' ? 'h' : 'g';
            if (parsed.columns) {
              parsed.columns.forEach((col: any, index: number) => {
                dataToRender[`${prefix}${index + 1}`] = col.label || "";
              });
            }
          } catch (e) { console.error(e); }
        }
      });

      doc.render(dataToRender);
      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      saveAs(out, `${selectedTemplate.name}_Export.docx`);
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Lỗi xuất file! Kiểm tra lại các biến dài trong Word.");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner label="Đang tải..." /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 font-sans text-slate-800">
      <Button variant="light" size="sm" onPress={() => router.push('/')} className="mb-4">← Quay lại danh sách</Button>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-3">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 sticky top-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest px-2">Danh mục mẫu</p>
            <Input size="sm" variant="bordered" placeholder="Tìm mẫu..." startContent={<SearchIcon size={14} />} className="mb-4" value={searchTemplate} onValueChange={(v) => { setSearchTemplate(v); setTemplatePage(1); }} />
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[55vh] mb-4">
              {displayedTemplates.map((t) => (
                <button key={t.id} onClick={() => inspectTemplate(t)} className={`text-left p-3 rounded-xl text-[11px] font-bold transition-all ${selectedTemplate?.id === t.id ? "bg-blue-600 text-white" : "bg-white border"}`}>{t.name}</button>
              ))}
            </div>
            {totalTemplatePages > 1 && (<div className="flex justify-center border-t pt-4"><Pagination size="sm" isCompact showControls total={totalTemplatePages} page={templatePage} onChange={setTemplatePage} color="primary" /></div>)}
          </div>
        </div>
        <div className="col-span-9">
          <Card className="p-8 shadow-none border border-gray-100 bg-white">
            {!selectedTemplate ? (
              <div className="h-96 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed rounded-3xl"><p>Chọn một mẫu bên trái để nhập liệu</p></div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b pb-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-black uppercase text-blue-600 tracking-tight">{selectedTemplate.name}</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SOẠN THẢO HỒ SƠ DỰ ÁN</p>
                  </div>
                  <Chip size="sm" color="primary" variant="flat" className="font-bold">{requiredFields.length} TRƯỜNG DỮ LIỆU</Chip>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {requiredFields.map((field) => {
                    const val = getSafeValue(field);
                    if (field === 'bang_quy_mo' || field === 'bang_hop_dong') return null; 
                    return (
                      <div key={field} className="flex flex-col gap-3">
                        {suggestions[field] && (<datalist id={`list-${field}`}>{suggestions[field].map((item: string, idx: number) => <option key={idx} value={item} />)}</datalist>)}
                        <label className="text-[11px] font-bold uppercase text-gray-400 px-1">{field.replace(/_/g, ' ')}</label>
                        <Input variant="bordered" placeholder="Nhập hoặc chọn gợi ý..." value={String(val || "")} onValueChange={(v) => updateField(field, v)} list={suggestions[field] ? `list-${field}` : undefined} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 pt-10 border-t">
                  <Button color="primary" className="flex-1 font-black h-14 text-lg shadow-lg" onPress={handleSave} isLoading={updating} startContent={<SaveIcon size={20}/>}>LƯU HỒ SƠ</Button>
                  <Button color="success" className="flex-1 text-white font-black h-14 text-lg shadow-lg" onPress={handleExportWord} startContent={<FileDownIcon size={20}/>}>XUẤT WORD</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}