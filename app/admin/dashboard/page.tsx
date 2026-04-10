import { prisma } from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const [products, orders, users] = await Promise.all([
    prisma.product.count(),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.user.count().catch(()=>0),
  ]);
  const revenue = orders.reduce((s,o)=>s+o.total,0);
  const recent  = orders.slice(0,8);
  return <AdminDashboardClient stats={{products,orders:orders.length,revenue,customers:users}} recentOrders={recent} />;
}
