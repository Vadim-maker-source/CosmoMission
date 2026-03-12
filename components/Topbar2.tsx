'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { User } from '@/app/lib/types';
import { getCurrentUser } from '@/app/lib/api/user';
import { LogOut, Menu, UserIcon, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

const Topbar2 = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const currentUser = await getCurrentUser()
            if(currentUser){
                setUser(currentUser)
            }
        }

        checkAuth()
    }, [])

    // Обработка скролла
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY + 50) {
                setIsVisible(false);
                setLastScrollY(currentScrollY);
                setIsMenuOpen(false);
            } else if (currentScrollY < lastScrollY - 10) {
                setIsVisible(true);
                setLastScrollY(currentScrollY);
            }
            
            if (currentScrollY < 100) {
                setIsVisible(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    const handleLogOut = async () => {
        try{
            const result = await signOut({ redirect: false })
    
            if(result){
                setUser(null)
                toast.success('Вы успешно вышли из аккаунта!', {
                    className: 'success-toast',
                    duration: 3000,
                });
                setIsMenuOpen(false);
            }
        } catch (error){
            console.log(error)
            toast.error('Произошла ошибка при выходе из аккаунта', {
                className: 'error-toast',
                duration: 3000,
            });
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const handleLinkClick = () => {
        setIsMenuOpen(false);
    };

    const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
        <Link href={href} className="group relative px-1 py-2">
          <span className="relative inline-block text-white">
            {children}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E64A19] group-hover:w-full transition-all duration-300 ease-out group-hover:left-0"></span>
          </span>
        </Link>
    );

    return (
        <>
            <div
                className={`
                    flex items-center justify-around w-full p-4 bg-black/20 backdrop-blur-md
                    fixed top-0 left-0 right-0 z-50
                    transition-transform duration-300 ease-in-out
                    ${isVisible ? 'translate-y-0' : '-translate-y-full'}
                `}
            >
                {/* Логотип и название */}
                <div className="flex items-center gap-2 lg:gap-4">
                    <Link href="/" className="flex items-center gap-2 lg:gap-4">
                        <img src="/images/logo2.png" alt="Логотип" className="w-10 lg:w-12 aspect-square" />
                        <p className="text-lg lg:text-xl text-gray-100">Космомиссия</p>
                    </Link>
                </div>

                {/* Десктопное меню */}
                <div className="hidden lg:flex items-center justify-center gap-8">
                    <NavLink href="/news">Новости</NavLink>
                    <NavLink href="/how-booking">Как забронировать</NavLink>
                    <NavLink href="/booking">Собрать путешествие</NavLink>
                    <NavLink href="/support">Поддержка</NavLink>
                    
                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link href={`/profile/${user.id}`} className="text-[#E64A19] text-xl hover:opacity-80 duration-200">
                                {user.firstName} {user.lastName}
                            </Link>
                            <button onClick={handleLogOut} className="cursor-pointer">
                                <LogOut className="text-[#E64A19] text-xl hover:opacity-80 duration-200" />
                            </button>
                        </div>
                    ) : (
                        <Link href="/sign-in" className="text-[#E64A19] text-xl hover:opacity-80 duration-200">
                            Войти
                        </Link>
                    )}
                </div>

                {/* Мобильная иконка бургера */}
                <div className="lg:hidden">
                    <button
                        onClick={toggleMenu}
                        className="p-2 text-[#E64A19] hover:bg-white/10 rounded-full transition-colors"
                        aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
                    >
                        {isMenuOpen ? <X size={28} className='cursor-pointer hover:opacity-80 duration-150' /> : <Menu size={28} className='cursor-pointer hover:opacity-80 duration-150' />}
                    </button>
                </div>

                {/* Кнопка входа для мобильных */}
                {!user && (
                    <div className="lg:hidden">
                        <Link href="/sign-in">
                            <button className="px-4 py-1 bg-[#E64A19] hover:bg-[#E64A19]/80 rounded-full cursor-pointer duration-200 text-sm text-white">
                                Войти
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Мобильное dropdown меню */}
            <div
                className={`
                    fixed left-0 right-0 z-60 bg-black backdrop-blur-md border-b border-purple-500/30
                    transition-all duration-300 ease-in-out lg:hidden
                    ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
                    pt-20 pb-6 px-4
                `}
                style={{ top: isVisible ? '72px' : '0' }}
            >
                <div className="flex flex-col space-y-2">
                    <Link href="/news" onClick={handleLinkClick}>
                        <div className="py-3 px-4 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-100">
                            Новости
                        </div>
                    </Link>

                    <Link href="/how-booking" onClick={handleLinkClick}>
                        <div className="py-3 px-4 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-100">
                            Как забронировать
                        </div>
                    </Link>
                    
                    <Link href="/booking" onClick={handleLinkClick}>
                        <div className="py-3 px-4 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-100">
                            Собрать путешествие
                        </div>
                    </Link>
                    
                    <Link href="/support" onClick={handleLinkClick}>
                        <div className="py-3 px-4 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-100">
                            Поддержка
                        </div>
                    </Link>

                    {/* Раздел пользователя */}
                    {user ? (
                        <>
                            <div className="border-t border-purple-500/30 my-2"></div>
                            
                            <Link href={`/profile/${user.id}`} onClick={handleLinkClick}>
                                <div className="py-3 px-4 hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex items-center gap-2 text-gray-100">
                                    <UserIcon className="w-5 aspect-square text-[#E64A19]"/>
                                    <span className="text-[#E64A19]">{user.firstName} {user.lastName}</span>
                                </div>
                            </Link>
                            
                            <button
                                onClick={() => {
                                    handleLogOut();
                                    handleLinkClick();
                                }}
                                className="w-full text-left py-3 px-4 hover:bg-white/10 rounded-lg transition-colors cursor-pointer flex items-center gap-2 text-gray-100"
                            >
                                <LogOut size={20} className="text-[#E64A19]" />
                                <span className="text-[#E64A19]">Выйти</span>
                            </button>
                        </>
                    ) : (
                        <div className="border-t border-purple-500/30 my-2"></div>
                    )}
                </div>
            </div>

            {/* Затемнение фона при открытом меню */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={closeMenu}
                />
            )}
        </>
    )
}

export default Topbar2