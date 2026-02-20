import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // Đường dẫn đến trang đăng nhập của bạn
  },
});

export const config = { 
  // Chặn tất cả các trang, ngoại trừ trang login và các file tĩnh
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};