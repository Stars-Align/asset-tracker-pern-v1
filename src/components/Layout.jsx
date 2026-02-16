import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Package, ScanLine, ArrowLeftRight, User } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // 定义哪些路径不需要显示底部导航
  const hideNavPaths = ['/auth', '/scan'];
  const showNav = !hideNavPaths.includes(location.pathname);

  // 导航配置
  const navItems = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/search', label: 'Items', icon: Package },
    { path: '/lending', label: 'Lending', icon: ArrowLeftRight },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    // 1. 外层容器：模拟电脑桌面，灰色背景，Flex 居中
    <div className="min-h-screen bg-gray-200 flex justify-center items-center font-sans text-slate-900">

      {/* 2. 手机仿真容器：限制宽度(430px)，高度占满屏幕，强制白色背景，阴影 */}
      <div className="w-full max-w-[430px] h-[100dvh] bg-[#F8F9FB] shadow-2xl flex flex-col relative overflow-hidden border-x border-gray-300">

        {/* 3. 核心内容区域：flex-1 自动占据剩余空间，允许内部滚动 */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
          {children}
        </main>

        {/* 4. 底部导航栏：flex-shrink-0 防止被压缩，固定在容器底部 */}
        {showNav && (
          <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-2 pb-6 flex justify-between items-end z-50">

            {/* 左侧按钮 */}
            {navItems.slice(0, 2).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 w-14 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              );
            })}

            {/* 中间悬浮扫描按钮 */}
            <div className="relative -top-6">
              <button
                onClick={() => navigate('/scan')}
                className="w-16 h-16 bg-primary rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform border-4 border-[#F8F9FB]"
              >
                <ScanLine size={28} />
              </button>
            </div>

            {/* 右侧按钮 */}
            {navItems.slice(2, 4).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 w-14 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}