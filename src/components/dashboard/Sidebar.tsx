'use client';

import { Plus, Minus, Bell, Sun, Moon, Power, LayoutGrid, SquarePlus } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SidebarProps {
    onAddModule: () => void;
    onAddPage: () => void;
    customPages: Array<{ id: string; name: string; initial: string }>;
}

export default function Sidebar({ onAddModule, onAddPage, customPages }: SidebarProps) {
    const [fontSize, setFontSize] = useState(6);
    const { theme, toggleTheme } = useTheme();

    const handleAddModuleClick = () => {
        console.log('Add module button clicked in Sidebar!');
        onAddModule();
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFontSize(Number(e.target.value));
    };

    const increaseFontSize = () => {
        if (fontSize < 10) setFontSize(fontSize + 1);
    };

    const decreaseFontSize = () => {
        if (fontSize > 0) setFontSize(fontSize - 1);
    };

    return (
        <aside className="mt-[5px] ml-[1px] w-[60px] bg-white dark:bg-componentBackground flex flex-col items-center py-6 border-r border-gray-300 dark:border-gray-700/50 rounded-r-full rounded-l-full overflow-visible relative transition-colors duration-300">
            {/* Top Icons */}
            <div className="flex flex-col items-center gap-6">
                {/* Default Page Icon - Image (TopIcon.webp) */}
                <div className="relative group">
                    <button className="rounded-lg flex items-center justify-center transition-colors shadow-sm overflow-hidden hover:bg-white dark:hover:bg-transparent p-1">
                        <img src="/assets/Dashboard/SidebarComponent/TopIcon.webp" alt="Top icon" className="w-[40px] h-[40px]" />
                    </button>
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        Giao diện mặc định
                    </div>
                </div>

                {/* Custom Pages */}
                {customPages.map((page) => (
                    <div key={page.id} className='w-[45px] h-[45px] flex items-center justify-center bg-[rgba(14,13,21,0.6)] rounded-[4px] relative group hover:bg-white dark:hover:bg-[rgba(14,13,21,0.6)] transition-colors'>
                        <button className="w-8 h-8 rounded-full border-2 border-white-500 flex items-center justify-center hover:border-white-400 transition-colors">
                            <span className="text-white text-xl">{page.initial}</span>
                        </button>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            {page.name}
                        </div>
                    </div>
                ))}

                {/* Add Page Button (G) */}
                <div className='w-[45px] h-[45px] flex items-center justify-center bg-[rgba(14,13,21,0.6)] rounded-[4px] relative group hover:bg-white dark:hover:bg-[rgba(14,13,21,0.6)] transition-colors'>
                    <button className="w-8 h-8 rounded-full border-2 border-white-500 flex items-center justify-center hover:border-white-400 transition-colors">
                        <span className="text-white text-xl">G</span>
                    </button>
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        Giao diện khác
                    </div>
                </div>

                {/* Grid Icon */}
                <div className="relative group">
                    <button 
                        onClick={onAddPage}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                        <LayoutGrid className="w-10 h-10 text-white-400" strokeWidth={2} />
                    </button>
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        Thêm module vào page
                    </div>
                </div>
            </div>

        
            {/* Spacer */}
            <div className="flex-1 " />

            {/* Bottom Icons - Outer container with translucent background */}
            <div className="bg-white/5 rounded-full p-1 mx-2">
                <div className="flex flex-col items-center gap-4">
                    {/* Add Module Icon with green dot and ping animation */}
                    <div className="text-center hover:bg-gray-700/500 rounded-lg transition-colors cursor-pointer relative group">
                        <div className="relative">
                            <span className="absolute inset-0 flex items-center justify-center">
                                <div className="h-5 w-5 animate-ping rounded-full bg-green-500 opacity-75"></div>
                            </span>
                            <button type="button" onClick={handleAddModuleClick} className="relative z-10 ani-pop font-medium rounded-full text-sm gap-x-1.5 p-1.5 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 inline-flex items-center">
                                <SquarePlus className="flex-shrink-0 h-6 w-6 text-gray-200" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Thêm module vào page
                        </div>
                    </div>

                    {/* Sun/Moon Icon - Theme Toggle */}
                    <div className="relative group">
                        <button 
                            onClick={toggleTheme}
                            className="w-10 h-10 flex items-center justify-center hover:bg-gray-700/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-6 h-6 text-yellow-400" strokeWidth={2} />
                            ) : (
                                <Moon className="w-6 h-6 text-gray-700" strokeWidth={2} />
                            )}
                        </button>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
                        </div>
                    </div>

                    {/* Font Size Control - Plus/Minus with Range Slider */}
                    <div className="relative inline-flex group">
                        <div className="relative w-8 flex flex-col items-center">
                            <div className="absolute z-10 inset-0 flex flex-col justify-between items-center py-1">
                                <button 
                                    onClick={increaseFontSize}
                                    type="button" 
                                    className="ani-pop font-medium rounded-full text-xs gap-x-1 p-[0.4rem] text-white-900 dark:text-white hover:bg-dark dark:hover:bg-gray-900 inline-flex items-center"
                                >
                                    <Plus className="h-5 w-5" strokeWidth={2} />
                                </button>
                                <button 
                                    onClick={decreaseFontSize}
                                    type="button" 
                                    className="ani-pop font-medium rounded-full text-xs gap-x-1 p-[0.4rem] text-white-900 dark:text-white hover:bg-dark dark:hover:bg-gray-900 inline-flex items-center"
                                >
                                    <Minus className="h-5 w-5" strokeWidth={2} />
                                </button>
                            </div>
                            <input 
                                className="w-9 h-20 appearance-none rounded-full cursor-pointer [writing-mode:vertical-lr]"
                                style={{
                                    background: `linear-gradient(to top, rgba(107, 114, 128, 0.4) ${fontSize * 10}%, #1a1a1a ${fontSize * 10}%)`
                                }}
                                type="range" 
                                min="0" 
                                max="10" 
                                step="1" 
                                value={fontSize}
                                onChange={handleFontSizeChange}
                            />
                        </div>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Phông chữ
                        </div>
                    </div>

                    {/* Green Bell Icon with notification dot */}
                    <div className="relative group">
                        <button className="w-10 h-10 rounded-full bg-accentGreen flex items-center justify-center hover:bg-green-600 transition-colors relative">
                            <Bell className="w-5 h-5 text-white" strokeWidth={2} fill="transparent" />
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-accentGreen rounded-full border-2 border-notification"></span>
                        </button>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Thông báo hệ thống
                        </div>
                    </div>

                    {/* Power Icon - White background */}
                    <div className="relative group">
                        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <Power className="w-5 h-5 text-gray-800" strokeWidth={2} />
                        </button>
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Đăng xuất
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}