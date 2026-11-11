import { redirect } from "next/navigation";

// Trang cũ: quản lý đơn hàng đã có ở /admin
export default function AdminTrackPage() {
  redirect("/admin");
}
