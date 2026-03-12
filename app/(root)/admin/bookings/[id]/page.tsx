'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  MapPin, 
  Globe, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock,
  Download,
  Shield,
  Mail,
  Phone,
  User,
  Star,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getBookingById, updateBookingStatus, approveMedicalCertificate, rejectMedicalCertificate, getCertificateDownloadUrl } from '@/app/lib/api/booking';
import { SPACE_PATHS } from '@/app/lib/ways';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MedicalCertificate {
  id: string;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  uploadDate: string;
}

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: string;
  phone: string;
  email: string | null;
  passportSeries: string;
  passportNumber: string;
  passportIssuedBy: string;
  passportIssuedAt: string;
  passportCode: string | null;
  isMainContact: boolean;
  medicalCertificates: MedicalCertificate[];
}

interface BookingDisplay {
  id: string;
  bookingNumber: string;
  routeIds: string[];
  departureDate: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  notes: string | null;
  passengers: Passenger[];
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    age: number;
  };
}

export default function AdminBookingPage() {
  const router = useRouter();
  const params = useParams();
  const [booking, setBooking] = useState<BookingDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ certificateId: string; passengerName: string } | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadBooking = async () => {
      const id = params.id as string;
      const result = await getBookingById(id);
      if (result.success && result.booking) {
        const formattedBooking: BookingDisplay = {
          ...result.booking,
          departureDate: result.booking.departureDate.toString(),
          createdAt: result.booking.createdAt.toString(),
          passengers: result.booking.passengers.map(p => ({
            ...p,
            birthDate: p.birthDate.toString(),
            passportIssuedAt: p.passportIssuedAt.toString(),
            medicalCertificates: p.medicalCertificates.map(c => ({
              ...c,
              uploadDate: c.uploadDate.toString()
            }))
          }))
        };
        setBooking(formattedBooking);
      } else {
        toast.error('Бронирование не найдено', {
          className: 'error-toast',
          duration: 3000,
      });
        router.push('/admin');
      }
      setLoading(false);
    };

    loadBooking();
  }, [params.id, router]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;
    
    const result = await updateBookingStatus(booking.id, newStatus as any);
    if (result.success) {
      toast.success('Статус обновлен', {
        className: 'success-toast',
        duration: 3000,
    });
      router.refresh();
    } else {
      toast.error(result.error || 'Ошибка', {
        className: 'error-toast',
        duration: 3000,
    });
    }
  };

  const handleApproveCertificate = async (certificateId: string) => {
    const result = await approveMedicalCertificate(certificateId);
    if (result.success) {
      toast.success('Справка одобрена', {
        className: 'success-toast',
        duration: 3000,
    });
      router.refresh();
    } else {
      toast.error(result.error || 'Ошибка', {
        className: 'error-toast',
        duration: 3000,
    });
    }
  };

  const handleRejectCertificate = async () => {
    if (!rejectModal) return;
    if (!rejectComment.trim()) {
      toast.error('Укажите причину отклонения', {
        className: 'error-toast',
        duration: 3000,
    });
      return;
    }

    setSubmitting(true);
    const result = await rejectMedicalCertificate(rejectModal.certificateId, rejectComment);
    setSubmitting(false);

    if (result.success) {
      toast.success('Справка отклонена', {
        className: 'success-toast',
        duration: 3000,
    });
      setRejectModal(null);
      setRejectComment('');
      router.refresh();
    } else {
      toast.error(result.error || 'Ошибка', {
        className: 'error-toast',
        duration: 3000,
    });
    }
  };

  const handleDownloadCertificate = async (fileKey: string, fileName: string) => {
    const result = await getCertificateDownloadUrl(fileKey);
    if (result.success && result.downloadUrl) {
      window.open(result.downloadUrl, '_blank');
    } else {
      toast.error('Ошибка при скачивании', {
        className: 'error-toast',
        duration: 3000,
    });
    }
  };

  const getPathName = (pathId: string) => {
    const path = SPACE_PATHS.find((p: any) => p.id === pathId);
    return path ? `${path.icon} ${path.name}` : pathId;
  };

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

  const getCertificateStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} className="text-green-400" />;
      case 'rejected': return <XCircle size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-yellow-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center flex flex-col justify-center items-center">
          <Loader2 className="text-purple-400 w-8 h-8" />
          <p className="text-purple-200 mt-4">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/images/error-payment.png" alt="Ошибка" />
          <p className="text-purple-200">Бронирование не найдено</p>
        </div>
      </div>
    );
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

      <div className="relative max-w-7xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-100 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Вернуться к списку
        </Link>

        {/* Заголовок */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {booking.bookingNumber}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>
              <p className="text-purple-200">
                Создано: {format(new Date(booking.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
              </p>
            </div>
            <div className="flex gap-2">
              {booking.status === 'DRAFT' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('CONFIRMED')}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/30 transition-colors"
                  >
                    Подтвердить
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('CANCELLED')}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 transition-colors"
                  >
                    Отклонить
                  </button>
                </>
              )}
              {booking.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleStatusUpdate('PAID')}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition-colors"
                >
                  Отметить оплату
                </button>
              )}
              {booking.status === 'PAID' && (
                <button
                  onClick={() => handleStatusUpdate('COMPLETED')}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 transition-colors"
                >
                  Завершить
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка */}
          <div className="lg:col-span-2 space-y-6">
            {/* Информация о клиенте - показываем только если есть user */}
            {booking.user && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <User className="text-purple-400" />
                  Информация о клиенте
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-300">Имя</p>
                    <p className="text-white font-semibold">
                      {booking.user.firstName} {booking.user.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-300">Email</p>
                    <p className="text-white font-semibold flex items-center gap-2">
                      <Mail size={14} />
                      {booking.user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-300">Телефон</p>
                    <p className="text-white font-semibold flex items-center gap-2">
                      <Phone size={14} />
                      {booking.user.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-300">Возраст</p>
                    <p className="text-white font-semibold">{booking.user.age} лет</p>
                  </div>
                </div>
              </div>
            )}

            {/* Маршрут */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="text-purple-400" />
                Маршрут
              </h2>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {booking.routeIds.map((pathId, index) => (
                  <div key={index} className="flex items-center">
                    <span className="px-3 py-1 bg-purple-600/20 rounded-lg text-white text-sm border border-purple-500/30">
                      {index + 1}. {getPathName(pathId)}
                    </span>
                    {index < booking.routeIds.length - 1 && (
                      <span className="mx-2 text-purple-400">→</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-purple-300">
                <Calendar size={16} />
                <span>Дата вылета: {format(new Date(booking.departureDate), 'd MMMM yyyy, HH:mm', { locale: ru })} (МСК)</span>
              </div>
            </div>

            {/* Пассажиры и справки */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="text-purple-400" />
                Пассажиры и медицинские справки
              </h2>
              
              <div className="space-y-6">
                {booking.passengers.map((passenger, index) => (
                  <div key={passenger.id} className="border-t border-purple-500/30 pt-4 first:border-0 first:pt-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {passenger.lastName} {passenger.firstName} {passenger.middleName}
                          </h3>
                          {passenger.isMainContact && (
                            <span className="px-2 py-0.5 bg-purple-600/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                              Главный
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-purple-300 mt-1">
                          Дата рождения: {format(new Date(passenger.birthDate), 'dd.MM.yyyy')}
                        </p>
                        <p className="text-sm text-purple-300">
                          Телефон: {passenger.phone} {passenger.email && `• ${passenger.email}`}
                        </p>
                        <p className="text-xs text-purple-400 mt-1">
                          Паспорт: {passenger.passportSeries} {passenger.passportNumber}, выдан {passenger.passportIssuedBy}, {format(new Date(passenger.passportIssuedAt), 'dd.MM.yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Медсправки */}
                    <div className="mt-3">
                      <p className="text-sm text-purple-200 mb-2">Медицинские справки:</p>
                      {passenger.medicalCertificates.length > 0 ? (
                        <div className="space-y-2">
                          {passenger.medicalCertificates.map((cert) => (
                            <div
                              key={cert.id}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-purple-500/30"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {getCertificateStatusIcon(cert.status)}
                                <div>
                                  <p className="text-sm text-white">{cert.fileName}</p>
                                  <p className="text-xs text-purple-300">
                                    Загружено: {format(new Date(cert.uploadDate), 'dd.MM.yyyy HH:mm')}
                                  </p>
                                  {cert.status === 'rejected' && cert.comment && (
                                    <p className="text-xs text-red-400 mt-1">
                                      Причина: {cert.comment}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDownloadCertificate(cert.fileKey, cert.fileName)}
                                  className="p-2 hover:bg-white/10 rounded-lg text-purple-300"
                                  title="Скачать"
                                >
                                  <Download size={16} />
                                </button>
                                {cert.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveCertificate(cert.id)}
                                      className="p-2 hover:bg-white/10 rounded-lg text-green-400"
                                      title="Одобрить"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                    <button
                                      onClick={() => setRejectModal({
                                        certificateId: cert.id,
                                        passengerName: `${passenger.firstName} ${passenger.lastName}`
                                      })}
                                      className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                                      title="Отклонить"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-purple-300 italic">Нет загруженных справок</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Пожелания */}
            {booking.notes && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="text-purple-400" />
                  Пожелания
                </h2>
                <p className="text-purple-200 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Правая колонка - дополнительная информация */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-lg font-semibold text-white mb-4">Информация о бронировании</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-purple-300">Номер бронирования</p>
                  <p className="text-white font-mono">{booking.bookingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Дата создания</p>
                  <p className="text-white">{format(new Date(booking.createdAt), 'd MMMM yyyy, HH:mm', { locale: ru })}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Количество пассажиров</p>
                  <p className="text-white">{booking.passengers.length}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-300">Количество станций</p>
                  <p className="text-white">{booking.routeIds.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модалка отклонения */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-linear-to-br from-slate-900 to-purple-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-2">Отклонить справку</h3>
            <p className="text-purple-200 mb-4">
              Укажите причину отклонения справки для {rejectModal.passengerName}
            </p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Причина отклонения..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleRejectCertificate}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Отправка...' : 'Отклонить'}
              </button>
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectComment('');
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-purple-200 rounded-lg border border-purple-500/30 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}