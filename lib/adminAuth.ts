import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function verifyAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('nava_session')?.value;

  if (!adminId) {
    return { success: false, message: 'عدم احراز هویت', status: 401 };
  }

  // بررسی اینکه کاربر وجود دارد و ادمین است
  const currentAdmin = await prisma.user.findUnique({ where: { id: adminId } });
  
  if (!currentAdmin || (!currentAdmin.isAdmin && currentAdmin.role !== 'ADMIN' as any)) {
    return { success: false, message: 'شما دسترسی ادمین ندارید', status: 403 };
  }

  return { success: true, admin: currentAdmin };
}