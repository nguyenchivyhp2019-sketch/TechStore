import { Clock, PackageCheck, Truck, CheckCircle2, XCircle } from "lucide-react";

// Thứ tự các bước giao hàng (không gồm "cancelled")
export const ORDER_STEPS = ["pending", "processing", "shipping", "delivered"];

export const ORDER_STATUS = {
  pending: { label: "Chờ xử lý", icon: Clock, badge: "border-yellow-700 bg-yellow-950/40 text-yellow-400" },
  processing: { label: "Đang đóng gói", icon: PackageCheck, badge: "border-sky-700 bg-sky-950/40 text-sky-400" },
  shipping: { label: "Đang giao", icon: Truck, badge: "border-orange-700 bg-orange-950/40 text-orange-400" },
  delivered: { label: "Đã giao", icon: CheckCircle2, badge: "border-green-700 bg-green-950/40 text-green-400" },
  cancelled: { label: "Đã hủy", icon: XCircle, badge: "border-red-800 bg-red-950/40 text-red-400" },
};

export const statusOf = (s) => ORDER_STATUS[s] ?? ORDER_STATUS.pending;
