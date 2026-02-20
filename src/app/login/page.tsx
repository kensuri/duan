'use client'
import React, { useState } from "react";
import { Card, CardBody, Input, Button, Checkbox } from "@nextui-org/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LockIcon, MailIcon, ShieldCheckIcon } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push("/");
      router.refresh(); 
    } else {
      alert("Đăng nhập thất bại! Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.");
    }
    setLoading(false);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-tr from-blue-100 via-white to-blue-50 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-[120px] opacity-50" />

      <Card className="w-full max-w-[420px] border-none bg-white/70 backdrop-blur-md shadow-2xl p-4">
        <CardBody className="overflow-hidden py-10">
          {/* Logo & Header */}
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <ShieldCheckIcon className="text-white" size={32} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Hệ thống Soạn thảo Hồ sơ</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Cổng đăng nhập nội bộ</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <Input
              label="Email / Tài khoản"
              placeholder="admin@mobifonedongnai.com.vn"
              variant="bordered"
              labelPlacement="outside"
              radius="lg"
              classNames={{
                label: "font-bold text-slate-600",
                inputWrapper: "h-12 border-slate-200 focus-within:border-blue-500",
              }}
              startContent={<MailIcon className="text-slate-400" size={20}/>}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isRequired
            />

            <div className="flex flex-col gap-3">
              <Input
                label="Mật khẩu"
                placeholder="••••••••"
                type="password"
                variant="bordered"
                labelPlacement="outside"
                radius="lg"
                classNames={{
                  label: "font-bold text-slate-600",
                  inputWrapper: "h-12 border-slate-200 focus-within:border-blue-500",
                }}
                startContent={<LockIcon className="text-slate-400" size={20}/>}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isRequired
              />
              <div className="flex items-center px-1">
                <Checkbox size="sm" classNames={{ label: "text-slate-500 font-medium" }}>
                  Ghi nhớ đăng nhập
                </Checkbox>
              </div>
            </div>

            <Button 
              color="primary" 
              type="submit" 
              className="font-black uppercase h-12 shadow-xl shadow-blue-200 bg-blue-600 hover:bg-blue-700 transition-all text-sm tracking-widest"
              isLoading={loading}
            >
              Đăng nhập hệ thống
            </Button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase">
            © 2026 - PHÒNG DATH TTGPS MBFĐN
          </p>
        </CardBody>
      </Card>
    </div>
  );
}