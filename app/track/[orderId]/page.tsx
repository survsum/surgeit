import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TrackingClient from './TrackingClient';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { orderId: string } }): Promise<Metadata> {
  return { title: `Track Order #${params.orderId.slice(-8).toUpperCase()}` };
}

export default async function TrackPage({ params }: { params: { orderId: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
  });

  if (!order) notFound();

  // Only expose safe fields to customer
  const safeOrder = {
    id: order.id,
    customerName: order.customerName,
    status: order.status,
    trackingId: order.trackingId,
    courier: order.courier,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    shippedAt: order.shippedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
  };

  return <TrackingClient order={safeOrder} />;
}
