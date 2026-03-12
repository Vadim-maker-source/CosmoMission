'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Rocket, 
  Star, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle,
  Clock,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Luggage,
  AlertCircle,
  Plane,
  UserIcon,
  MailIcon,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllBookings, updateBookingStatus } from '@/app/lib/api/booking';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DisplayBooking {
  id: string;
  bookingNumber: string;
  departureDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  passengers: any[];
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<DisplayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    confirmed: 0,
    paid: 0,
    cancelled: 0,
    completed: 0,
    pendingCertificates: 0
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    const result = await getAllBookings();
    if (result.success && result.bookings) {
      const formattedBookings: DisplayBooking[] = result.bookings.map(booking => ({
        ...booking,
        departureDate: booking.departureDate.toString(),
        createdAt: booking.createdAt.toString(),
        passengers: booking.passengers.map(p => ({
          ...p,
          birthDate: p.birthDate.toString(),
          passportIssuedAt: p.passportIssuedAt.toString(),
          medicalCertificates: p.medicalCertificates.map(c => ({
            ...c,
            uploadDate: c.uploadDate.toString()
          }))
        }))
      }));
      
      setBookings(formattedBookings);
      
      const newStats = {
        total: result.bookings.length,
        draft: result.bookings.filter(b => b.status === 'DRAFT').length,
        confirmed: result.bookings.filter(b => b.status === 'CONFIRMED').length,
        paid: result.bookings.filter(b => b.status === 'PAID').length,
        cancelled: result.bookings.filter(b => b.status === 'CANCELLED').length,
        completed: result.bookings.filter(b => b.status === 'COMPLETED').length,
        pendingCertificates: result.bookings.reduce((acc, booking) => 
          acc + booking.passengers.reduce((pAcc: number, p: any) => 
            pAcc + p.medicalCertificates.filter((c: any) => c.status === 'pending').length, 0
          ), 0
        )
      };
      setStats(newStats);
    } else {
      toast.error(result.error || 'Ошибка загрузки', {
        className: 'error-toast',
        duration: 3000,
    });
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const result = await updateBookingStatus(bookingId, newStatus as any);
    if (result.success) {
      toast.success('Статус обновлен', {
        className: 'success-toast',
        duration: 3000,
    });
      loadBookings();
    } else {
      toast.error(result.error || 'Ошибка', {
        className: 'error-toast',
        duration: 3000,
    });
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter !== 'all' && booking.status !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.bookingNumber.toLowerCase().includes(searchLower) ||
        booking.user?.email?.toLowerCase().includes(searchLower) ||
        booking.user?.firstName?.toLowerCase().includes(searchLower) ||
        booking.user?.lastName?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PAID': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'CANCELLED': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'COMPLETED': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Подтверждено';
      case 'PAID': return 'Оплачено';
      case 'CANCELLED': return 'Отменено';
      case 'COMPLETED': return 'Завершено';
      default: return 'Новое';
    }
  };

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

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Панель администратора
          </h1>
          <p className="text-xl text-purple-200">
            Управление космическими путешествиями
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-purple-500/30">
            <p className="text-purple-200 text-sm">Всего</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-yellow-500/10 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/30">
            <p className="text-yellow-200 text-sm">Новые</p>
            <p className="text-2xl font-bold text-yellow-300">{stats.draft}</p>
          </div>
          <div className="bg-blue-500/10 backdrop-blur-lg rounded-xl p-4 border border-blue-500/30">
            <p className="text-blue-200 text-sm">Подтверждено</p>
            <p className="text-2xl font-bold text-blue-300">{stats.confirmed}</p>
          </div>
          <div className="bg-green-500/10 backdrop-blur-lg rounded-xl p-4 border border-green-500/30">
            <p className="text-green-200 text-sm">Оплачено</p>
            <p className="text-2xl font-bold text-green-300">{stats.paid}</p>
          </div>
          <div className="bg-purple-500/10 backdrop-blur-lg rounded-xl p-4 border border-purple-500/30">
            <p className="text-purple-200 text-sm">Завершено</p>
            <p className="text-2xl font-bold text-purple-300">{stats.completed}</p>
          </div>
          <div className="bg-red-500/10 backdrop-blur-lg rounded-xl p-4 border border-red-500/30">
            <p className="text-red-200 text-sm">Отменено</p>
            <p className="text-2xl font-bold text-red-300">{stats.cancelled}</p>
          </div>
          <div className="bg-orange-500/10 backdrop-blur-lg rounded-xl p-4 border border-orange-500/30">
            <p className="text-orange-200 text-sm">Справок</p>
            <p className="text-2xl font-bold text-orange-300">{stats.pendingCertificates}</p>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-purple-500/30 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Поиск по номеру, email, имени..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-purple-400 w-5 h-5" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
              >
                <option value="all">Все статусы</option>
                <option value="DRAFT">Новые</option>
                <option value="CONFIRMED">Подтвержденные</option>
                <option value="PAID">Оплаченные</option>
                <option value="COMPLETED">Завершенные</option>
                <option value="CANCELLED">Отмененные</option>
              </select>
              <button
                onClick={loadBookings}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-purple-500/30 text-purple-300"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Список бронирований */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-center flex flex-col justify-center items-center">
              <Loader2 className="text-purple-400 w-8 h-8" />
              <p className="text-purple-200 mt-4">Загрузка...</p>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-purple-500/30 text-center">
            <Luggage className="w-20 h-20 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Нет бронирований</h3>
            <p className="text-purple-200">По вашему запросу ничего не найдено</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="block bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/30 hover:bg-white/20 transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                        <Plane className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            {booking.bookingNumber}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-purple-300">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(new Date(booking.departureDate), 'd MMM yyyy, HH:mm', { locale: ru })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {booking.passengers.length} чел.
                          </span>
                          {booking.user && (
                            <>
                              <span className="flex items-center gap-1">
                                <UserIcon className="w-4" /> {booking.user.firstName} {booking.user.lastName}
                              </span>
                              <span className="flex items-center gap-1">
                                <MailIcon className="w-4" /> {booking.user.email}
                              </span>
                            </>
                          )}
                        </div>
                        {booking.passengers.some((p: any) => 
                          p.medicalCertificates?.some((c: any) => c.status === 'pending')
                        ) && (
                          <div className="mt-2 flex items-center gap-2 text-yellow-400 text-sm">
                            <AlertCircle size={14} />
                            <span>Есть справки на проверку</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {booking.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={(e) => handleStatusUpdate(booking.id, 'CONFIRMED', e)}
                            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/30 transition-colors"
                          >
                            Подтвердить
                          </button>
                          <button
                            onClick={(e) => handleStatusUpdate(booking.id, 'CANCELLED', e)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 transition-colors"
                          >
                            Отклонить
                          </button>
                        </>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={(e) => handleStatusUpdate(booking.id, 'PAID', e)}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition-colors"
                        >
                          Оплачено
                        </button>
                      )}
                      {booking.status === 'PAID' && (
                        <button
                          onClick={(e) => handleStatusUpdate(booking.id, 'COMPLETED', e)}
                          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 transition-colors"
                        >
                          Завершить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}