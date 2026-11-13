import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hitRateLimit } from "@/lib/rate-limit";
import { buildIndex, searchProducts, isInStock } from "@/lib/chatbot-search";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

// API tra cứu sản phẩm cho chatbot Botpress.
//
// GET /api/chatbot/products?q=laptop asus dưới 20 triệu
//   q          từ khóa hoặc cả câu hỏi của khách (hiểu được "dưới 20 triệu", "tầm 15tr", "rẻ nhất"...)
//   category   slug hoặc tên danh mục (vd. "laptop", "Điện thoại")
//   brand      hãng (vd. "ASUS")
//   min_price  giá thấp nhất, tính bằng đồng
//   max_price  giá cao nhất, tính bằng đồng
//   sort       price_asc | price_desc
//   limit      số sản phẩm trả về, 1-20 (mặc định 5)
// Không truyền gì: trả về sản phẩm nổi bật của từng danh mục.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (body, status = 200, headers = {}) =>
  NextResponse.json(body, { status, headers: { ...CORS, "Cache-Control": "no-store", ...headers } });

export function OPTIONS(request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS,
      "Access-Control-Allow-Headers":
        request.headers.get("access-control-request-headers") || "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// Botpress gọi từ một vài IP chung cho mọi cuộc trò chuyện, nên giới hạn phải rộng
const RATE = { scope: "chatbot-products", limit: 120, windowSeconds: 60 };

// Giữ danh sách sản phẩm trong bộ nhớ 60 giây để không đọc database ở mỗi câu hỏi
const CACHE_MS = 60_000;
let cached = null; // { at, index }
let loading = null;

async function loadIndex() {
  const [products, categories] = await Promise.all([
    supabase.from("products").select("*").order("id"),
    supabase.from("categories").select("slug, name, sort_order").order("sort_order"),
  ]);
  if (products.error) throw products.error;
  // Thiếu bảng danh mục vẫn tìm được, chỉ mất tên hiển thị của danh mục
  if (categories.error) console.error("Chatbot: không tải được danh mục:", categories.error.message);
  return buildIndex(products.data ?? [], categories.data ?? []);
}

async function getIndex() {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.index;
  loading ??= loadIndex()
    .then((index) => {
      cached = { at: Date.now(), index };
      return index;
    })
    .catch((err) => {
      // Database trục trặc tạm thời: dùng tiếp dữ liệu cũ còn hơn để chatbot báo lỗi
      if (!cached) throw err;
      console.error("Chatbot: không làm mới được sản phẩm, dùng dữ liệu cũ:", err?.message);
      return cached.index;
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

const absoluteUrl = (path) => (/^https?:\/\//i.test(path) ? path : `${SITE.url}${path.startsWith("/") ? "" : "/"}${path}`);

// Các dòng thông số chỉ lặp lại giá và mô tả đã có sẵn ở trường riêng
const REDUNDANT_SPECS = new Set(["Giá bán", "Mô tả"]);

function toPublic(p, categoryNames) {
  const price = typeof p.price === "number" && p.price > 0 ? p.price : null;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand ?? null,
    category: p.category ?? null,
    category_name: categoryNames.get(p.category) ?? null,
    price: formatPrice(price), // "17.490.000 đ" hoặc "Liên hệ"
    price_value: price, // số, để so sánh; null nếu chưa niêm yết
    price_note: p.price_note ?? null,
    in_stock: isInStock(p),
    description: p.description ?? null,
    specs: Array.isArray(p.specs)
      ? p.specs
          .filter((s) => s?.label && s.value != null && !REDUNDANT_SPECS.has(s.label))
          .map(({ label, value }) => ({ label, value }))
      : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    variants: p.variants ?? null,
    pros: p.pros ?? null,
    cons: p.cons ?? null,
    url: `${SITE.url}/products/${encodeURIComponent(p.id)}`,
    // Cùng thứ tự ưu tiên với ProductImage trên web
    image: absoluteUrl(p.image_url || p.image || `/images/${p.id}.jpg`),
  };
}

const formatRange = (min, max) =>
  min != null && max != null
    ? `từ ${formatPrice(min)} đến ${formatPrice(max)}`
    : min != null
      ? `từ ${formatPrice(min)} trở lên`
      : `từ ${formatPrice(max)} trở xuống`;

export async function GET(request) {
  try {
    if (await hitRateLimit(request, RATE)) {
      return json(
        { success: false, error: "Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút." },
        429,
        { "Retry-After": String(RATE.windowSeconds) }
      );
    }

    const params = new URL(request.url).searchParams;
    const q = (params.get("q") ?? "").trim().slice(0, 200);

    const index = await getIndex();
    const result = searchProducts(index, {
      q,
      category: params.get("category"),
      brand: params.get("brand"),
      minPrice: params.get("min_price"),
      maxPrice: params.get("max_price"),
      sort: params.get("sort")?.replace("-", "_"),
      limit: params.get("limit"),
    });

    const categoryNames = new Map(index.categories.map((c) => [c.slug, c.name]));
    const products = result.products.map((p) => toPublic(p, categoryNames));
    const nearby = result.nearby.map((p) => toPublic(p, categoryNames));
    const { min_price: min, max_price: max } = result.filters;

    // Câu tóm tắt để bot dùng ngay khi không có kết quả hoặc có phần không tìm thấy
    let message = null;
    if (!products.length) {
      message = nearby.length
        ? `Không có sản phẩm phù hợp trong khoảng giá ${formatRange(min, max)}. Các sản phẩm gần mức giá này nhất nằm trong outside_price_range.`
        : "Không tìm thấy sản phẩm phù hợp.";
    } else if (result.unmatchedTerms.length) {
      message = `Cửa hàng không có sản phẩm nào khớp với: ${result.unmatchedTerms.join(", ")}. Kết quả chỉ khớp với phần còn lại của câu hỏi.`;
    }

    return json({
      success: true,
      query: q || null,
      total: products.length, // số sản phẩm trả về
      total_matched: result.totalMatched, // tổng số sản phẩm khớp, kể cả phần chưa trả về
      filters: result.filters, // cách API hiểu câu hỏi: danh mục, hãng, khoảng giá, thứ tự
      unmatched_terms: result.unmatchedTerms,
      message,
      products,
      outside_price_range: nearby,
    });
  } catch (err) {
    console.error("Lỗi API chatbot/products:", err?.message ?? err);
    return json({ success: false, error: "Lỗi Server" }, 500);
  }
}
