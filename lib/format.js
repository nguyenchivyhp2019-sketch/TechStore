// Giá null/0 nghĩa là chưa có giá niêm yết
export const formatPrice = (p) =>
  p ? p.toLocaleString("vi-VN") + " đ" : "Liên hệ";
