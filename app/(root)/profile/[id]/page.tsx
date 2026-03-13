'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Rocket, 
  Star, 
  Luggage,
  Settings,
  Edit,
  Shield,
  UsersIcon,
  Loader2
} from 'lucide-react'
import { User as UserType } from '@/app/lib/types'
import { toast } from 'sonner'
import { getUserBookings } from '@/app/lib/api/booking'
import { getCurrentUser } from '@/app/lib/api/user'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

interface Booking {
  id: string
  bookingNumber: string
  departureDate: string
  status: string
  totalPassengers: number
}

export default function ProfilePage({ params }: PageProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setUserId(resolvedParams.id)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return

      try {
        const current = await getCurrentUser()
        if (!current) {
          router.push('/sign-in')
          return
        }
        setCurrentUser(current)

        if (current.id !== userId && current.role !== 'admin') {
          router.push('/')
          return
        }

        const result = await getUserBookings(userId)
        if (result.success && result.bookings) {
          const formattedBookings = result.bookings.map(booking => ({
            ...booking,
            departureDate: booking.departureDate.toString(),
            createdAt: booking.createdAt.toString()
          }))
          setBookings(formattedBookings)
        }

        setUser(current)
        
      } catch (error) {
        console.error(error)
        toast.error('Ошибка загрузки профиля', {
          className: 'error-toast',
          duration: 3000,
      })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, router])

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-400'
      case 'PAID': return 'text-blue-400'
      case 'CANCELLED': return 'text-red-400'
      case 'COMPLETED': return 'text-purple-400'
      default: return 'text-yellow-400'
    }
  }

  const getBookingStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Подтверждено'
      case 'PAID': return 'Оплачено'
      case 'CANCELLED': return 'Отменено'
      case 'COMPLETED': return 'Завершено'
      default: return 'Черновик'
    }
  }

  const inDeveloping = () => {
    toast.warning("Упс! Этот раздел ещё в разработке!")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center flex flex-col justify-center items-center">
          <Loader2 className="text-purple-400 w-8 h-8" />
          <p className="text-purple-200 mt-4">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user || !currentUser || !userId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Rocket className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
          <p className="text-purple-200">Пользователь не найден</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-12 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            <Star className="text-white/30 w-1 h-1" />
          </div>
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <Rocket className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Личный кабинет
          </h1>
          <p className="text-xl text-purple-200">
            Добро пожаловать, {user.firstName}!
          </p>
          {currentUser.role === 'ADMIN' && (
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 rounded-full border border-purple-500/30">
              <Shield size={16} className="text-purple-400" />
              <span className="text-purple-200 text-sm">Администратор</span>
            </div>
          )}
        </div>

        {/* Основная информация */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Аватар и имя */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 text-center">
            <div className="w-24 h-24 mx-auto bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-purple-300 text-sm mb-4">Космический путешественник</p>
            {currentUser.id === user.id && (
              <Link
                href={`/profile/${user.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-purple-200 transition-colors"
              >
                <Edit size={16} />
                Редактировать
              </Link>
            )}
          </div>

          {/* Контактная информация */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-lg font-semibold text-white mb-4">Контактная информация</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-purple-200">
                <Mail size={18} className="text-purple-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-purple-200">
                <Phone size={18} className="text-purple-400" />
                <span>{user.phone}</span>
              </div>
              {user.region && (
                <div className="flex items-center gap-3 text-purple-200">
                  <MapPin size={18} className="text-purple-400" />
                  <span>{user.region}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-purple-200">
                <Calendar size={18} className="text-purple-400" />
                <span>{user.age} лет</span>
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
            <h3 className="text-lg font-semibold text-white mb-4">Статистика</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-200">Завершенных полетов</span>
                <span className="text-white font-bold">
                  {bookings.filter(b => b.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-200">Предстоящих полетов</span>
                <span className="text-white font-bold">
                  {bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PAID').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-200">Всего бронирований</span>
                <span className="text-white font-bold">{bookings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-200">На сайте с</span>
                <span className="text-white font-bold">
                  {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Последние бронирования */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">Последние бронирования</h3>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-purple-200 mb-4">У вас пока нет бронирований</p>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Rocket size={20} />
                Забронировать путешествие
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 3).map((booking) => (
                <Link
                  key={booking.id}
                  href={`/profile/${user.id}/booking`}
                  className="block p-4 bg-white/5 rounded-lg border border-purple-500/30 hover:bg-white/10 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white font-semibold">{booking.bookingNumber}</span>
                        <span className={`text-xs ${getBookingStatusColor(booking.status)}`}>
                          {getBookingStatusText(booking.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-purple-300">
                        <span>📅 {new Date(booking.departureDate).toLocaleDateString('ru-RU')}</span>
                        <span className="flex items-center gap-1"><UsersIcon className="w-4" /> {booking.totalPassengers} чел</span>
                      </div>
                    </div>
                    <span className="text-purple-400">→</span>
                  </div>
                </Link>
              ))}
              {bookings.length > 3 && (
                <Link
                  href={`/profile/${user.id}/bookings`}
                  className="block text-center text-purple-300 hover:text-purple-100 py-2"
                >
                  Показать все бронирования →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Навигация */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/profile/${user.id}/booking`}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:bg-white/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Luggage className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Мои бронирования</h3>
                <p className="text-purple-300 text-sm">Просмотр и управление полетами</p>
              </div>
            </div>
          </Link>

          {currentUser.id === user.id && (
            <button
              onClick={inDeveloping}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:bg-white/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col items-start">
                  <h3 className="text-xl font-bold text-white mb-1">Настройки</h3>
                  <p className="text-purple-300 text-sm">Изменить личные данные</p>
                </div>
              </div>
            </button>
          )}

          {currentUser.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:bg-white/20 transition-all md:col-span-2"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Панель администратора</h3>
                  <p className="text-purple-300 text-sm">Управление бронированиями и справками</p>
                </div>
              </div>
            </Link>
          )}

          <Link
            href="/booking"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:bg-white/20 transition-all md:col-span-2"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Новое путешествие</h3>
                <p className="text-purple-300 text-sm">Забронировать полет к звездам</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}