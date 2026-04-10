'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, ShoppingCart, Truck, Package,
  CheckCircle2, ExternalLink, Send, AlertCircle, Copy
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  customerName: string;
  email: string;
  address: string;
  total: number;
  status: string;
  trackingId: string | null;
  courier: string | null;
  createdAt: Date | string;
  shippedAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  parsedItems: OrderItem[];
}

// ── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:   { label: 'Pending',   color: 'text-gray-400',  bg: 'bg-gray-500/10',  border: 'border-gray-500/20',  icon: Package },
  paid:      { label: 'Paid',      color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Package },
  shipped:   { label: 'Shipped',   color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/20',  icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle2 },
};

const NEXT_STATUS: Record<string, string | null> = {
  pending:   'paid',
  paid:      'shipped',
  shipped:   'delivered',
  delivered: null,
};

const COURIERS = ['Shiprocket', 'Delhivery', 'BlueDart', 'DTDC', 'Ecom Express', 'XpressBees', 'FedEx', 'DHL'];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status as keyof typeof STATUS] || STATUS.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function OrderUpdatePanel({ order, onUpdated }: { order: Order; onUpdated: (updated: Order) => void }) {
  const nextStatus = NEXT_STATUS[order.status];
  const [trackingId, setTrackingId] = useState(order.trackingId || '');
  const [courier, setCourier] = useState(order.courier || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (status?: string) => {
    setLoading(true);
    try {
      const body: any = { orderId: order.id };
      if (status) body.status = status;
      if (trackingId) body.trackingId = trackingId;
      if (courier) body.courier = courier;

      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      onUpdated({ ...order, ...data.order, parsedItems: order.parsedItems });
      toast.success(status ? `Order marked as ${status}` : 'Tracking info saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">

      {/* Tracking + Courier inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 block">
            Tracking ID
          </label>
          <input
            value={trackingId}
            onChange={e => setTrackingId(e.target.value)}
            placeholder="e.g. 4345678901234"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:border-blue-500/50 focus:outline-none transition-colors font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 block">
            Courier
          </label>
          <select
            value={courier}
            onChange={e => setCourier(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 focus:outline-none transition-colors"
          >
            <option value="">Select courier…</option>
            {COURIERS.map(c => (
              <option key={c} value={c.toLowerCase()}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Save tracking info */}
        {(trackingId || courier) && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleUpdate()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
          >
            <Send size={12} />
            Save Info
          </motion.button>
        )}

        {/* Advance status button */}
        {nextStatus && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleUpdate(nextStatus)}
            disabled={loading || (nextStatus === 'shipped' && (!trackingId && !order.trackingId))}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              nextStatus === 'shipped'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                : nextStatus === 'delivered'
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/25'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {loading
              ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              : (() => {
                  const Icon = STATUS[nextStatus as keyof typeof STATUS]?.icon || Package;
                  return <Icon size={12} />;
                })()
            }
            Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
          </motion.button>
        )}

        {/* Track link */}
        <a
          href={`/track/${order.id}`}
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white/50 hover:text-white/80 transition-all ml-auto"
        >
          <ExternalLink size={11} />
          Tracking Page
        </a>
      </div>

      {/* Warning if trying to ship without tracking */}
      {nextStatus === 'shipped' && !trackingId && !order.trackingId && (
        <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2">
          <AlertCircle size={12} />
          Add a Tracking ID before marking as shipped
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminOrdersClient({ orders: initial }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const handleUpdated = (updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const filtered = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Order ID copied');
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Orders</h1>
        <p className="text-white/40 text-sm">
          {orders.length} orders · {formatPrice(totalRevenue)} total revenue
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{scrollbarWidth:"none",flexWrap:"nowrap"}}>
        {['all', 'pending', 'paid', 'shipped', 'delivered'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
              statusFilter === s
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
            }`}
          >
            {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center text-center gap-3 rounded-3xl border border-white/5 bg-white/2">
          <ShoppingCart size={40} className="text-white/20" />
          <p className="text-white/30 text-sm">No orders here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Row */}
              <button
                onClick={() => toggle(order.id)}
                className="w-full flex flex-wrap items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <span className="font-semibold text-sm text-white">{order.customerName}</span>
                    <StatusBadge status={order.status} />
                    {order.trackingId && (
                      <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                        {order.trackingId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/30 truncate">{order.email}</p>
                </div>

                <div className="hidden sm:block text-xs text-white/25 max-w-[180px] truncate">
                  {order.address}
                </div>

                <div className="text-right">
                  <div className="text-base font-semibold text-white">{formatPrice(order.total)}</div>
                  <div className="text-xs text-white/25">
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); copyId(order.id); }}
                    className="text-white/20 hover:text-white/50 transition-colors p-1"
                  >
                    <Copy size={12} />
                  </button>
                  {expandedId === order.id
                    ? <ChevronUp size={15} className="text-white/40" />
                    : <ChevronDown size={15} className="text-white/40" />
                  }
                </div>
              </button>

              {/* Expanded */}
              <AnimatePresence>
                {expandedId === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-white/5">

                      {/* Items */}
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mt-4 mb-3">
                        Order Items
                      </p>
                      <div className="space-y-2.5 mb-4">
                        {order.parsedItems.map(item => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/80 truncate">{item.name}</p>
                              <p className="text-xs text-white/30">{formatPrice(item.price)} × {item.quantity}</p>
                            </div>
                            <span className="text-sm font-medium text-white/70">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-xs text-white/25 mb-1">
                        <span>📍 {order.address}</span>
                        <span className="font-semibold text-white/60">Total: {formatPrice(order.total)}</span>
                      </div>

                      {/* Update panel */}
                      <OrderUpdatePanel order={order} onUpdated={handleUpdated} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
