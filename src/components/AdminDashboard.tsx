import { Link } from "react-router-dom";

export function AdminDashboard() {
  return (
    <main className="memoir-bg flex min-h-screen items-center justify-center px-5 py-12 text-ink">
      <section className="glass w-full max-w-xl rounded-lg p-8 text-center">
        <p className="text-sm font-bold tracking-[0.22em] text-clay">EDITOR</p>
        <h1 className="mt-3 text-4xl font-semibold">请回到前台编辑</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink/62">
          现在的回忆录已经把编辑入口放在成品预览页右上角，添加封面、年份、照片和视频都在那里完成。
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-ink px-8 text-lg font-bold text-paper shadow-soft"
        >
          打开回忆录
        </Link>
      </section>
    </main>
  );
}
