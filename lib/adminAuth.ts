import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export function isAdminAuthenticated(): boolean {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('admin_session');
    return session?.value === 'authenticated';
  } catch {
    return false;
  }
}

export function isAdminAuthenticatedFromRequest(req: NextRequest): boolean {
  const session = req.cookies.get('admin_session');
  return session?.value === 'authenticated';
}
