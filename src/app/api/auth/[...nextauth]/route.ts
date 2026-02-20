import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs"; // npm install bcryptjs

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // Tìm người dùng trong database
        const user = await (prisma as any).user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) return null;

        // Kiểm tra mật khẩu (Sử dụng bcrypt để bảo mật)
        // const isPasswordValid = await compare(credentials.password, user.password);
        // Tạm thời so sánh trực tiếp nếu bạn chưa hash mật khẩu:
        const isPasswordValid = credentials.password === user.password;

        if (!isPasswordValid) return null;

        return { id: user.id, name: user.name, email: user.email };
      }
    })
  ],
  pages: {
    signIn: '/login', // Trang đăng nhập tùy chỉnh của bạn
  },
  session: { strategy: "jwt" }
});

export { handler as GET, handler as POST };