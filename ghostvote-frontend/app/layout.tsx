import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-50 backdrop-blur-md bg-white/30 border-b border-white/20">
            <div className="max-w-6xl mx-auto px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">💡</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold heading-gradient">IdeaHub</h1>
                    <p className="text-sm text-gray-500">创意提案投票平台</p>
                  </div>
                </div>
                <nav className="flex gap-2">
                  <Link href="/" className="nav-item">🏠 提案广场</Link>
                  <Link href="/upload" className="nav-item">💡 提交创意</Link>
                  <Link href="/rank" className="nav-item">🏆 热门榜单</Link>
                  <Link href="/me" className="nav-item">👤 我的</Link>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-8 py-12">
            {children}
          </main>

          {/* Footer */}
          <footer className="text-center py-16 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
            <div className="proposal-card inline-block">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <p className="font-bold text-gray-800">IdeaHub • 让好创意被看见</p>
                  <p className="text-sm text-gray-500">基于 FHEVM 的隐私保护投票系统</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}