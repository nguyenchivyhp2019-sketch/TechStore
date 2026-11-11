import { Geist } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./CartContext";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import HellEmbers from "./HellEmbers";
import BotpressChat from "./BotpressChat";
import { getProducts, getCategories } from "@/lib/products";
import { SITE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "vietnamese"] });

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} – Laptop, điện thoại, linh kiện chính hãng`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Mua laptop, điện thoại, máy tính bảng, linh kiện PC, tai nghe và phụ kiện chính hãng. Giao hàng miễn phí toàn quốc, bảo hành đầy đủ.",
  openGraph: { siteName: SITE.name, locale: "vi_VN", type: "website" },
};

export const viewport = { themeColor: "#050505" };

export default async function RootLayout({ children }) {
  const [allProducts, rawCategories] = await Promise.all([getProducts(), getCategories()]);
  const categories = rawCategories.filter((c) => c.slug !== "pc-theo-nganh");

  // Danh sách rút gọn cho ô tìm kiếm gợi ý trên header
  const searchList = allProducts.map(({ id, name, price, category, brand, image, image_url }) => ({
    id, name, price, category, brand, image: image_url || image || null,
  }));

  return (
    <html lang="vi" className="dark">
      <body className={`${geistSans.variable} font-sans min-h-screen bg-[#050505] text-gray-100 antialiased overflow-x-hidden selection:bg-red-600 selection:text-white`}>
        <HellEmbers />

        <CartProvider>
          <Sidebar categories={categories} />

          <div className="ml-0 md:ml-[70px] flex flex-col min-h-screen">
            <Header products={searchList} />
            <main className="flex-grow relative z-10">{children}</main>
            <Footer categories={categories} />
          </div>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: "#111", color: "#fff", border: "1px solid #dc2626", borderRadius: 0 },
              success: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
            }}
          />
        </CartProvider>

        <BotpressChat />
      </body>
    </html>
  );
}
