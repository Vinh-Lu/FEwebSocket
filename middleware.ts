import { NextRequest,NextResponse } from 'next/server';

// Danh sách các path không cần kiểm tra token
const excludedPaths = ['/login',"/chat"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bỏ qua nếu path được loại trừ
  if (excludedPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Bỏ qua các file tĩnh hoặc API (ví dụ: /_next/, /favicon.ico, /api/)
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/api');
  if (isStatic) {
    return NextResponse.next();
  }

  // Kiểm tra token
  const token = req.cookies.get('token')?.value;

  if (!token) {
    // Tạo backURL để redirect về trang cũ sau khi login
    const backURL = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/login?backURL=${backURL}`,req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'], // Chỉ áp dụng với các route người dùng
};
