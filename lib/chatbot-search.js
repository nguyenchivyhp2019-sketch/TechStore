// Tìm kiếm sản phẩm cho chatbot.
// Module thuần (không import gì) để có thể chạy thử độc lập bằng node.

// ---------- Chuẩn hóa văn bản ----------

export const removeAccents = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();

// Các cách viết khác nhau của cùng một từ
const CANONICAL = { gaming: "game", games: "game", gamer: "game" };

// Tách từ: giữ cả dạng có dấu (raw) lẫn không dấu (norm). "15,6" -> "15.6".
function tokenize(text) {
  const lower = String(text ?? "").normalize("NFC").toLowerCase().replace(/(\d),(?=\d)/g, "$1.");
  const tokens = [];
  for (const [raw] of lower.matchAll(/[\p{L}\p{N}]+(?:\.\d+)*/gu)) {
    const norm = removeAccents(raw);
    const canonical = CANONICAL[norm];
    if (canonical) tokens.push({ raw: canonical, norm: canonical });
    else if (norm) tokens.push({ raw, norm });
  }
  return tokens;
}

// Cụm nhiều từ được gộp thành một từ khóa để "tai nghe sony" không khớp nhầm
// mọi thứ có chữ "tai" hay "nghe". Cụm dài đứng trước.
const PHRASES = [
  ["may tinh xach tay", "laptop"],
  ["may tinh bang", "maytinhbang"],
  ["kinh thong minh", "kinhai"],
  ["card man hinh", "carddohoa"],
  ["card do hoa", "carddohoa"],
  ["bo mach chu", "mainboard"],
  ["vi xu ly", "cpu"],
  ["tai nghe", "tainghe"],
  ["dien thoai", "dienthoai"],
  ["ban phim", "banphim"],
  ["kinh ai", "kinhai"],
  ["linh kien", "linhkien"],
  ["khong day", "khongday"],
  ["co day", "coday"],
  ["bo nguon", "nguon"],
  ["cơ bản", "coban"], // viết có dấu: chỉ gộp khi đúng dấu, vì "co ban" còn là "có bán"
].map(([phrase, to]) => [phrase.split(" "), to]);

function joinPhrases(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; ) {
    const hit = PHRASES.find(([words]) =>
      words.every((w, k) => (w === removeAccents(w) ? tokens[i + k]?.norm : tokens[i + k]?.raw) === w)
    );
    if (hit) {
      out.push({ raw: hit[1], norm: hit[1], fixed: true });
      i += hit[0].length;
    } else {
      out.push(tokens[i++]);
    }
  }
  return out;
}

// Từ đồng nghĩa một từ (chỉ áp dụng cho câu hỏi)
const SYNONYMS = {
  vga: "carddohoa", psu: "nguon", main: "mainboard", wireless: "khongday",
  dt: "dienthoai", smartphone: "dienthoai", tablet: "maytinhbang", notebook: "laptop",
  mouse: "chuot", keyboard: "banphim", speaker: "loa", speakers: "loa", kinh: "kinhai",
  headphone: "tainghe", headphones: "tainghe", headset: "tainghe",
  earphone: "tainghe", earphones: "tainghe", earbuds: "tainghe",
};

// Từ đệm không mang nghĩa tìm kiếm. Viết có dấu để phân biệt "có" (bỏ) với "cơ" (giữ).
const STOP_ACCENTED = new Set(
  ("tôi mình em anh chị bạn shop ad ơi ạ nhé nha xin chào hello hi cho hỏi muốn cần tìm mua xem kiếm lấy đặt " +
    "có không ko là gì nào thì mà và với hay hoặc của đang sẽ đã được bị các những một vài cái chiếc con " +
    "loại mẫu màu dòng sản phẩm hàng hãng giá bao nhiêu tiền tốt nhất rẻ đẹp ngon nên giúp tư vấn gợi ý " +
    "giới thiệu về này đó kia vậy đi nhỉ khoảng tầm dưới trên từ đến triệu nghìn ngàn đồng vnd bán còn hết " +
    "cửa để dùng thôi inch").split(" ")
);
const STOP_PLAIN = new Set([...STOP_ACCENTED].map(removeAccents));

// Người gõ không dấu thì không phân biệt được, nên so với danh sách không dấu.
const isStopword = (t) => !t.fixed && (STOP_ACCENTED.has(t.raw) || (t.raw === t.norm && STOP_PLAIN.has(t.norm)));

// "rtx4060" -> ["rtx", "4060"], "16gb" -> ["16"], "s24" -> ["24"]. Bỏ mảnh quá ngắn (đơn vị, 1 chữ số).
function splitParts(token) {
  const parts = token.match(/[a-z]+|\d+(?:\.\d+)?/g) ?? [];
  if (parts.length < 2) return [];
  return parts.filter((p) => (/^\d/.test(p) ? p.length >= 2 : p.length >= 3));
}

// Sai khác tối đa 1 ký tự (thêm, bớt, thay, đảo 2 ký tự kề nhau)
function withinOneEdit(a, b) {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  const [short, long] = la < lb ? [a, b] : [b, a];
  return short.slice(i) === long.slice(i + 1);
}

// ---------- Lập chỉ mục ----------

const WEIGHT = { main: 10, lead: 8, sub: 6, desc: 4, detail: 3 };
const PREFIX_FACTOR = 0.9; // "logi" -> "logitech"
const FUZZY_FACTOR = 0.9; // "ipone" -> "iphone"
const ACCENT_FACTOR = 0.5; // gõ "cơ" nhưng sản phẩm chỉ có "có"
const STRONG = 6; // từ mức này trở lên coi là khớp chắc (tên, hãng, danh mục, loại sản phẩm)
const KEEP_RATIO = 0.6; // giữ sản phẩm đạt ít nhất 60% điểm của sản phẩm khớp nhất
const KEEP_RATIO_STRICT = 0.7; // có lọc/xếp theo giá thì giá quyết định thứ tự, nên lọc độ khớp chặt hơn

// Các dòng thông số chỉ lặp lại giá/mô tả hoặc nói về nhược điểm: không dùng để tìm
const SKIP_SPEC_LABELS = new Set(["gia ban", "mo ta", "nhuoc diem"]);
// Dòng dạng lời văn: chỉ lấy nội dung, tên dòng ("Ưu điểm") không phải đặc điểm sản phẩm
const PROSE_SPEC_LABELS = new Set(["uu diem", "ly do chon"]);
const isNegative = (value) => /^(khong|chua)(?![a-z])/.test(removeAccents(value).trim());

export const isInStock = (p) => p.stock == null || p.stock > 0;
const priceOf = (p) => (typeof p.price === "number" && p.price > 0 ? p.price : null);

export function buildIndex(products, categories = []) {
  const categoryNames = new Map(categories.map((c) => [c.slug, c.name]));
  const vocab = new Set();
  const mainVocab = new Set(); // từ trong tên/hãng/danh mục, dùng để sửa lỗi gõ

  const entries = products.map((p) => {
    const weights = new Map(); // theo dạng không dấu
    const exact = new Map(); // theo dạng có dấu, để "cơ" không bị coi là "có"
    const put = (token, w) => {
      if ((weights.get(token) ?? 0) < w) weights.set(token, w);
      vocab.add(token);
      if (w >= WEIGHT.main) mainVocab.add(token);
    };
    const add = (text, w, leadWeight) => {
      joinPhrases(tokenize(text)).forEach(({ raw, norm }, i) => {
        const weight = i === 0 && leadWeight ? leadWeight : w;
        put(norm, weight);
        if ((exact.get(raw) ?? 0) < weight) exact.set(raw, weight);
        for (const part of splitParts(norm)) put(part, w);
      });
    };

    add(p.name, WEIGHT.main);
    if (p.brand && removeAccents(p.brand) !== "khac") add(p.brand, WEIGHT.main);
    add(String(p.category ?? "").replace(/-/g, " "), WEIGHT.main);
    add(categoryNames.get(p.category), WEIGHT.main);
    add(p.subcategory, WEIGHT.sub);
    // Mô tả thường mở đầu bằng loại sản phẩm ("RAM...", "Bộ nguồn...", "Bàn phím cơ...")
    add(p.description, WEIGHT.desc, WEIGHT.lead);
    add(p.pros, WEIGHT.detail);
    if (Array.isArray(p.colors)) add(p.colors.join(" "), WEIGHT.detail);
    if (Array.isArray(p.specs)) {
      for (const spec of p.specs) {
        const label = removeAccents(spec?.label).trim();
        if (!spec || SKIP_SPEC_LABELS.has(label) || isNegative(spec.value)) continue;
        add(spec.value, WEIGHT.detail);
        // "Chống nước: IPX4" -> hỏi "chống nước" vẫn tìm ra
        if (!PROSE_SPEC_LABELS.has(label)) add(spec.label, WEIGHT.detail);
      }
    }
    return { p, weights, exact, price: priceOf(p), inStock: isInStock(p) };
  });

  // Từ khóa gọi tên danh mục ("laptop", "tai nghe"...) -> slug, chỉ tính danh mục đang có hàng
  const categoryWords = new Map();
  const slugs = new Set(products.map((p) => p.category).filter(Boolean));
  for (const slug of slugs) {
    for (const text of [slug.replace(/-/g, " "), categoryNames.get(slug)]) {
      const first = joinPhrases(tokenize(text))[0];
      if (first && !categoryWords.has(first.norm)) categoryWords.set(first.norm, slug);
    }
  }

  return { entries, vocab, mainVocab, categories, categoryWords };
}

// ---------- Hiểu câu hỏi ----------

const MONEY_RE =
  /(?<![a-z0-9.,])(\d+(?:[.,]\d+)*)\s*(?:(trieu|tr)(?:(\d{1,3})|\s+(ruoi))?|(k|nghin|ngan)|(d|dong|vnd|₫))?(?![a-z0-9])/g;
const MAX_KW = /(?:^|[^a-z0-9])(khong vuot qua|khong qua|toi da|nho hon|thap hon|re hon|it hon|duoi|max|<=|<)\s*$/;
const MIN_KW = /(?:^|[^a-z0-9])(toi thieu|it nhat|lon hon|cao hon|dat hon|tren|hon|tu|min|>=|>)\s*$/;
const APPROX_KW = /(?:^|[^a-z0-9])(loanh quanh|xap xi|khoang|quanh|tam|gan|co|gia|~)\s*$/;
const RANGE_KW = /(?:^|[^a-z0-9])(trong khoang|khoang|tam|gia|tu)\s*$/;
const AFTER_KW = /^\s*(tro xuong|do xuong|do lai|tro lai|tro len|do len)(?![a-z0-9])/;
const SORT_ASC = /(?<![a-z0-9])(re nhat|gia re|gia thap|gia mem|re)(?![a-z0-9])/;
const SORT_DESC = /(?<![a-z0-9])(dat tien nhat|cao cap nhat|dat nhat|mac nhat|xin nhat)(?![a-z0-9])/;

function parseNumber(s) {
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, "")); // 20.000.000
  const parts = s.split(/[.,]/);
  return parts.length > 2 ? NaN : Number(parts.join("."));
}

const kwStart = (m) => m.index + m[0].lastIndexOf(m[1]);

// Tách ý định về giá và sắp xếp ra khỏi câu hỏi. Trả về phần chữ còn lại để tìm từ khóa.
function parseIntent(q) {
  // chars[i] (có dấu) và norm[i] (không dấu) luôn cùng vị trí để xóa đúng đoạn đã hiểu
  const chars = Array.from(String(q ?? "").normalize("NFC").toLowerCase());
  const normChars = chars.map((c) => {
    const n = removeAccents(c);
    return n.length === 1 && c.length === 1 ? n : " ";
  });
  let norm = normChars.join("");
  const blank = (from, to) => {
    for (let i = from; i < to; i++) chars[i] = normChars[i] = " ";
    norm = normChars.join("");
  };

  const found = [];
  for (const m of norm.matchAll(MONEY_RE)) {
    const n = parseNumber(m[1]);
    if (!Number.isFinite(n) || n <= 0) continue;
    let mult = 1;
    let value = n;
    let valid;
    if (m[2]) {
      mult = 1e6;
      value = n * 1e6 + (m[3] ? Number(`0.${m[3]}`) * 1e6 : 0) + (m[4] ? 5e5 : 0);
      valid = true;
    } else if (m[5]) {
      mult = 1e3;
      value = n * 1e3;
      valid = n >= 50; // "4k" là độ phân giải, không phải 4 nghìn đồng
    } else {
      valid = Number.isInteger(n) && n >= 50000; // số trần phải đủ lớn mới là tiền
    }
    found.push({ start: m.index, end: m.index + m[0].length, n, mult, value: Math.round(value), valid: valid && value <= 1e10, hasUnit: Boolean(m[2] || m[5] || m[6]) });
  }

  let min;
  let max;
  let target; // "tầm 20 triệu": ưu tiên sản phẩm sát mức giá này
  const spans = [];

  // Khoảng giá: "từ 10 đến 20 triệu", "15tr - 20tr"
  for (let i = 0; i + 1 < found.length; i++) {
    const a = found[i];
    const b = found[i + 1];
    if (a.used || b.used || !b.valid) continue;
    const between = norm.slice(a.end, b.start).trim();
    if (!/^(-|–|—|~|den|toi)$/.test(between)) continue;
    const kw = norm.slice(0, a.start).match(RANGE_KW);
    const wordLink = between === "den" || between === "toi";
    let low;
    if (a.valid) low = a.value;
    else if (!a.hasUnit && (kw || wordLink)) low = Math.round(a.n * b.mult); // số đầu mượn đơn vị số sau
    if (low == null) continue;
    if (!a.valid && low >= b.value) continue;
    min = Math.min(low, b.value);
    max = Math.max(low, b.value);
    a.used = b.used = true;
    spans.push([kw ? kwStart(kw) : a.start, b.end]);
    break;
  }

  // Giá đơn: "dưới 20 triệu", "trên 5tr", "tầm 15 triệu", "20 triệu trở xuống"
  for (const m of found) {
    if (m.used) continue;
    const before = norm.slice(0, m.start);
    const after = norm.slice(m.end);
    const maxKw = before.match(MAX_KW);
    const minKw = maxKw ? null : before.match(MIN_KW);
    const approxKw = maxKw || minKw ? null : before.match(APPROX_KW);
    const afterKw = after.match(AFTER_KW);

    let value = m.value;
    if (!m.valid) {
      // "laptop dưới 20": số trần ngay sau từ chỉ giới hạn và ở cuối câu thì hiểu là triệu
      const bare = !m.hasUnit && (maxKw || minKw) && m.n <= 500 && /^[\s?.!,]*$/.test(after);
      if (!bare) continue;
      value = Math.round(m.n * 1e6);
    }

    let kind = maxKw ? "max" : minKw ? "min" : "approx";
    if (afterKw && kind === "approx") kind = /len$/.test(afterKw[1]) ? "min" : "max";
    if (kind === "max" && max === undefined) max = value;
    else if (kind === "min" && min === undefined) min = value;
    else if (kind === "approx" && min === undefined && max === undefined) {
      min = Math.round(value * 0.8);
      max = Math.round(value * 1.2);
      target = value;
    } else continue;

    const kw = maxKw || minKw || approxKw;
    spans.push([kw ? kwStart(kw) : m.start, m.end + (afterKw ? afterKw[0].length : 0)]);
  }

  for (const [from, to] of spans) blank(from, to);
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];

  let sort = null;
  const desc = norm.match(SORT_DESC);
  const asc = desc ? null : norm.match(SORT_ASC);
  if (desc) sort = "price_desc";
  else if (asc) sort = "price_asc";
  const sortHit = desc || asc;
  if (sortHit) blank(sortHit.index, sortHit.index + sortHit[0].length);

  return { text: chars.join(""), min: min ?? null, max: max ?? null, target: target ?? null, sort };
}

// Đổi câu hỏi thành danh sách từ khóa, mỗi từ kèm các từ trong chỉ mục mà nó có thể khớp
function parseTerms(text, index) {
  let tokens = joinPhrases(tokenize(text));

  // "air pods" -> "airpods", "g 102" -> "g102" khi dạng viết liền mới là từ có trong cửa hàng
  const joined = [];
  for (let i = 0; i < tokens.length; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (b && index.vocab.has(a.norm + b.norm) && !(index.vocab.has(a.norm) && index.vocab.has(b.norm))) {
      joined.push({ raw: a.raw + b.raw, norm: a.norm + b.norm, fixed: true });
      i++;
    } else {
      joined.push(a);
    }
  }

  tokens = joined
    .map((t) => (SYNONYMS[t.norm] ? { raw: t.raw, norm: SYNONYMS[t.norm], fixed: true } : t))
    .filter((t) => !isStopword(t) && (t.norm.length > 1 || /\d/.test(t.norm)));

  const seen = new Set();
  const terms = [];
  for (const t of tokens) {
    if (seen.has(t.norm)) continue;
    seen.add(t.norm);
    terms.push(...resolveTerm(t, index));
  }
  return terms;
}

function resolveTerm(t, { vocab, mainVocab }) {
  const term = (forms) => ({ raw: t.raw, forms });
  // Từ gõ có dấu: khớp đúng dấu được trọn điểm, chỉ khớp không dấu thì nửa điểm
  if (vocab.has(t.norm)) return [{ ...term([[t.norm, 1]]), norm: t.norm, accented: !t.fixed && t.raw !== t.norm }];

  const parts = splitParts(t.norm);
  if (parts.length && parts.every((p) => vocab.has(p))) return parts.map((p) => ({ raw: p, forms: [[p, 1]] }));

  if (t.norm.length >= 3 && /[a-z]/.test(t.norm)) {
    const prefixed = [...vocab].filter((v) => v.startsWith(t.norm));
    if (prefixed.length) return [term(prefixed.map((v) => [v, PREFIX_FACTOR]))];
  }
  if (t.norm.length >= 5 && /^[a-z]+$/.test(t.norm)) {
    const near = [...mainVocab].filter((v) => v.length >= 4 && withinOneEdit(t.norm, v));
    if (near.length) return [term(near.map((v) => [v, FUZZY_FACTOR]))];
  }
  return [term([])];
}

// ---------- Tìm kiếm ----------

const toPrice = (v) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const slugify = (s) => removeAccents(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Nhận cả slug ("dien-thoai") lẫn tên hiển thị ("Điện thoại")
function resolveCategory(value, categories) {
  const wanted = slugify(value);
  if (!wanted) return null;
  return categories.find((c) => c.slug === wanted || slugify(c.name) === wanted)?.slug ?? wanted;
}

// Không có từ khóa: mỗi danh mục lấy sản phẩm cao cấp nhất để danh sách đa dạng
function featured(entries, categories) {
  const order = new Map(categories.map((c, i) => [c.slug, i]));
  const groups = new Map();
  for (const e of entries) {
    if (!e.inStock || e.price == null) continue;
    if (!groups.has(e.p.category)) groups.set(e.p.category, []);
    groups.get(e.p.category).push(e);
  }
  const lists = [...groups.entries()]
    .sort(([a], [b]) => (order.get(a) ?? 999) - (order.get(b) ?? 999) || a.localeCompare(b))
    .map(([, list]) => list.sort((a, b) => b.price - a.price || a.p.name.localeCompare(b.p.name, "vi")));
  const out = [];
  for (let rank = 0; lists.some((l) => l.length > rank); rank++) {
    for (const list of lists) if (list[rank]) out.push(list[rank]);
  }
  return out;
}

export function searchProducts(index, options = {}) {
  const intent = parseIntent(options.q);
  const terms = parseTerms(intent.text, index);

  const explicitMin = toPrice(options.minPrice);
  const explicitMax = toPrice(options.maxPrice);
  let minPrice = explicitMin ?? intent.min;
  let maxPrice = explicitMax ?? intent.max;
  const target = explicitMin == null && explicitMax == null ? intent.target : null;
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  const sort = ["price_asc", "price_desc"].includes(options.sort) ? options.sort : intent.sort;
  let category = options.category ? resolveCategory(options.category, index.categories) : null;
  // Câu hỏi gọi tên danh mục ("chuột logitech") thì chỉ tìm trong danh mục đó
  const named = new Set(terms.map((t) => index.categoryWords.get(t.norm)).filter(Boolean));
  const categories = category ? new Set([category]) : named;
  if (!category && named.size === 1) [category] = named;
  const brand = options.brand ? removeAccents(options.brand).trim() : null;
  const hasPriceFilter = minPrice != null || maxPrice != null;

  const inPriceRange = (e) =>
    e.price != null && (minPrice == null || e.price >= minPrice) && (maxPrice == null || e.price <= maxPrice);

  // Bước 1: lọc theo danh mục/hãng và độ khớp từ khóa, chưa xét giá
  let relevant = index.entries.filter(
    (e) => (!categories.size || categories.has(e.p.category)) && (!brand || removeAccents(e.p.brand).trim() === brand)
  );
  const scores = new Map();
  if (terms.length) {
    const scored = [];
    for (const e of relevant) {
      let score = 0;
      let matched = 0;
      let strong = false;
      for (const { raw, forms, accented } of terms) {
        let w = 0;
        for (const [key, factor] of forms) w = Math.max(w, (e.weights.get(key) ?? 0) * factor);
        if (accented) w = Math.max(e.exact.get(raw) ?? 0, w * ACCENT_FACTOR);
        if (w > 0) matched++;
        // Con số đứng riêng ("1", "15") không đủ để nhận ra sản phẩm
        if (w >= STRONG && !/^[\d.]+$/.test(raw)) strong = true;
        score += w;
      }
      // Phải khớp chắc ít nhất một từ (tên, hãng, danh mục, loại), hoặc khớp đủ mọi từ trong phần chi tiết
      if (score > 0 && (strong || matched === terms.length)) scored.push([e, score]);
    }
    const best = Math.max(0, ...scored.map(([, s]) => s));
    const floor = best * (sort || hasPriceFilter ? KEEP_RATIO_STRICT : KEEP_RATIO) - 1e-9;
    relevant = scored.filter(([, s]) => s >= floor).map(([e, s]) => (scores.set(e, s), e));
  }

  // Bước 2: lọc giá. Không bao giờ trả sản phẩm ngoài khoảng giá trong danh sách chính.
  const hasFilters = Boolean(categories.size || brand || hasPriceFilter || sort);
  let pool = hasPriceFilter ? relevant.filter(inPriceRange) : relevant;
  if (!terms.length && !hasFilters) pool = featured(pool, index.categories);

  // Có sản phẩm đúng ý nhưng lệch giá: gợi ý riêng vài sản phẩm sát khoảng giá nhất
  let nearby = [];
  if (hasPriceFilter && !pool.length && (terms.length || categories.size || brand)) {
    const gap = (e) => (minPrice != null && e.price < minPrice ? minPrice - e.price : e.price - maxPrice);
    nearby = relevant
      .filter((e) => e.price != null)
      .sort((a, b) => gap(a) - gap(b) || (scores.get(b) ?? 0) - (scores.get(a) ?? 0) || a.p.name.localeCompare(b.p.name, "vi"))
      .slice(0, 3);
  }

  if (terms.length || hasFilters) {
    // Không nói gì về thứ tự: "tầm X" ưu tiên sát giá X, "dưới X" ưu tiên máy tốt nhất trong tầm giá, còn lại rẻ trước
    const priceDir = sort === "price_desc" || (!sort && maxPrice != null) ? -1 : 1;
    const rank = (e) => (!sort && target != null ? Math.abs(e.price - target) : e.price * priceDir);
    const byPrice = (a, b) => (a.price == null) - (b.price == null) || (a.price == null ? 0 : rank(a) - rank(b));
    pool.sort(
      (a, b) =>
        (sort ? byPrice(a, b) : 0) ||
        (scores.get(b) ?? 0) - (scores.get(a) ?? 0) ||
        b.inStock - a.inStock ||
        byPrice(a, b) ||
        a.p.name.localeCompare(b.p.name, "vi")
    );
  }

  const limit = Math.min(20, Math.max(1, Math.trunc(Number(options.limit)) || 5));
  return {
    products: pool.slice(0, limit).map((e) => e.p),
    totalMatched: pool.length,
    nearby: nearby.map((e) => e.p),
    filters: { category, brand: options.brand?.trim() || null, min_price: minPrice, max_price: maxPrice, sort },
    unmatchedTerms: terms.filter((t) => !t.forms.length).map((t) => t.raw),
  };
}
