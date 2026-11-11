import { CartProvider } from "./CartContext";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer"; 
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { getProducts, getCategories } from "@/lib/products";
import Script from "next/script"; 
import "./globals.css";

// SỬ DỤNG ALIAS @/ THAY VÌ ĐƯỜNG DẪN TƯƠNG ĐỐI
import HellEmbers from "./HellEmbers";

// Khôi phục font mặc định cho toàn trang
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "DOOM - Cửa hàng công nghệ",
  description: "Website bán đồ công nghệ tích hợp chatbot",
};

export default async function RootLayout({ children }) {
  const allProducts = await getProducts();
  const rawCategories = await getCategories();
  
  const categories = rawCategories.filter((c) => c.slug !== "pc-theo-nganh");
  
  const searchList = allProducts.map(({ id, name, price, category, brand }) => ({
    id, name, price, category, brand,
  }));

  return (
    <html lang="vi" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen bg-[#050505] text-gray-100 antialiased overflow-x-hidden`}>
        
        {/* Hiệu ứng lửa bay */}
        <HellEmbers />

        <CartProvider>
          <Sidebar categories={categories} /> 
          
          <div className="ml-0 md:ml-[70px] flex flex-col min-h-screen transition-all duration-300">
            
            <Header products={searchList} /> 
            
            <main className="flex-grow relative z-10">
              {children}
            </main>
            
            <Footer /> 
          </div>

          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: '#111',
                color: '#fff',
                border: '1px solid #dc2626',
              },
            }}
          />
        </CartProvider>

        {/* Tích hợp Chatbot Botpress */}
        <Script 
          src="https://cdn.botpress.cloud/webchat/v3.7/inject.js" 
          strategy="afterInteractive" 
        />
        <Script 
          src="https://files.bpcontent.cloud/2026/11/10/15/20261110150010-LNBRJIJG.js" 
          strategy="afterInteractive" 
        />
        
      </body>
    </html>
  );
}
