export default function Loading() {
  return (
    <div role="status" className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-red-950 border-t-red-600 rounded-full animate-spin shadow-[0_0_20px_rgba(220,38,38,0.4)]" />
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">Đang tải...</p>
    </div>
  );
}
