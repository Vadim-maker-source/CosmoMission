'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Rocket, 
  Star, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Download, 
  Trash2, 
  X, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Upload,
  ChevronDown,
  ChevronUp,
  Luggage,
  Plane,
  Globe,
  Sparkles,
  Gift,
  Activity,
  Coffee,
  Camera,
  Moon,
  Loader2
} from 'lucide-react'
import { getUserBookings, cancelBooking, deleteMedicalCertificate, getCertificateDownloadUrl, uploadCertificateAction } from '@/app/lib/api/booking'
import { getCurrentUser } from '@/app/lib/api/user'
import { User } from '@/app/lib/types'
import { SPACE_PATHS, SpacePath } from '@/app/lib/ways'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'

interface MedicalCertificate {
  id: string
  fileName: string
  fileKey: string
  fileUrl: string
  fileSize: number
  status: 'pending' | 'approved' | 'rejected'
  comment?: string | null
  uploadDate: string
}

interface Passenger {
  id: string
  firstName: string
  lastName: string
  middleName?: string | null
  birthDate: string
  phone: string
  email?: string | null
  medicalCertificates: MedicalCertificate[]
}

interface Booking {
  id: string
  bookingNumber: string
  routeIds: string[]
  durations?: { [key: string]: number }
  selectedServices?: Array<{
    serviceId: string
    stationId: string
    quantity: number
  }>
  departureDate: string
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED'
  createdAt: string
  passengers: Passenger[]
  notes?: string | null
}

interface DayActivity {
  day: number
  date: string
  location: string
  locationIcon: string
  activities: string[]
  meals: string[]
  accommodation: string
  highlights: string[]
}

const statusColors = {
  DRAFT: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  CONFIRMED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  PAID: 'bg-green-500/20 text-green-300 border-green-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/30',
  COMPLETED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

const statusLabels = {
  DRAFT: 'Черновик',
  CONFIRMED: 'Подтверждено',
  PAID: 'Оплачено',
  CANCELLED: 'Отменено',
  COMPLETED: 'Завершено',
}

export default function BookingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/sign-in')
        return
      }
      setUser(currentUser)

      const result = await getUserBookings(currentUser.id)
      if (result.success && result.bookings) {
        const formattedBookings: Booking[] = result.bookings.map(booking => ({
          ...booking,
          departureDate: booking.departureDate.toString(),
          createdAt: booking.createdAt.toString(),
          passengers: booking.passengers.map(passenger => ({
            ...passenger,
            birthDate: passenger.birthDate.toString(),
            medicalCertificates: passenger.medicalCertificates.map(cert => ({
              ...cert,
              uploadDate: cert.uploadDate.toString()
            }))
          }))
        }))
        setBookings(formattedBookings)
      }
      setLoading(false)
    }

    loadData()
  }, [router])

  const generateItinerary = (booking: Booking): DayActivity[] => {
    const itinerary: DayActivity[] = []
    const startDate = new Date(booking.departureDate)
    let currentDay = 1
    
    itinerary.push({
      day: currentDay++,
      date: format(addDays(startDate, 0), 'd MMMM yyyy', { locale: ru }),
      location: 'Земля',
      locationIcon: '🌍',
      activities: [
        'Сбор в космическом центре',
        'Предполетный инструктаж',
        'Медицинский осмотр',
        'Посадка в космический корабль',
        'Старт и выход на орбиту'
      ],
      meals: ['Завтрак в отеле', 'Обед в космическом центре', 'Ужин на орбите'],
      accommodation: 'Орбитальная станция',
      highlights: ['Первый взгляд на Землю из космоса', 'Адаптация к невесомости']
    })

    booking.routeIds.forEach((pathId, index) => {
      const path = SPACE_PATHS.find(p => p.id === pathId)
      if (!path) return

      const daysAtStation = booking.durations?.[pathId] || 1
      
      for (let day = 0; day < daysAtStation; day++) {
        const dayActivities: DayActivity = {
          day: currentDay++,
          date: format(addDays(startDate, currentDay - 2 + day), 'd MMMM yyyy', { locale: ru }),
          location: path.name,
          locationIcon: path.icon,
          activities: [],
          meals: ['Завтрак', 'Обед', 'Ужин'],
          accommodation: `Базовый лагерь на ${path.name}`,
          highlights: []
        }

        if (path.id === 'moon') {
          dayActivities.activities = [
            'Выход на поверхность Луны',
            'Прогулка по лунным кратерам',
            'Сбор лунных образцов',
            'Фотосессия с Землей на фоне',
            'Эксперименты в низкой гравитации'
          ]
          dayActivities.highlights = ['Прыжки в 1/6 земной гравитации', 'Вид на восход Земли']
        } else if (path.id === 'mars') {
          dayActivities.activities = [
            'Экскурсия на марсоходе',
            'Исследование марсианских пещер',
            'Поиск следов древней жизни',
            'Забор образцов грунта',
            'Наблюдение за марсианским закатом'
          ]
          dayActivities.highlights = ['Красные пейзажи Марса', 'Вид на Олимп']
        } else if (path.id === 'jupiter') {
          dayActivities.activities = [
            'Облет Юпитера',
            'Наблюдение Большого Красного Пятна',
            'Экскурсия на Европу',
            'Изучение магнитного поля',
            'Фотосессия с газовым гигантом'
          ]
          dayActivities.highlights = ['Северное сияние Юпитера', 'Вулканы на Ио']
        } else if (path.id === 'saturn') {
          dayActivities.activities = [
            'Пролет сквозь кольца',
            'Высадка на Титан',
            'Наблюдение метановых озер',
            'Фотосессия с кольцами',
            'Изучение ледяных спутников'
          ]
          dayActivities.highlights = ['Вид сквозь кольца', 'Метановые дожди на Титане']
        } else {
          dayActivities.activities = [
            `Исследование ${path.name}`,
            'Экскурсионная программа',
            'Научные наблюдения',
            'Фотосессия',
            'Свободное время'
          ]
          dayActivities.highlights = [`Уникальные виды ${path.name}`]
        }

        itinerary.push(dayActivities)
      }

      if (index < booking.routeIds.length - 1) {
        const nextPath = SPACE_PATHS.find(p => p.id === booking.routeIds[index + 1])
        itinerary.push({
          day: currentDay++,
          date: format(addDays(startDate, currentDay - 2), 'd MMMM yyyy', { locale: ru }),
          location: 'Межпланетный перелет',
          locationIcon: '🚀',
          activities: [
            `Перелет с ${path.name} к ${nextPath?.name}`,
            'Наблюдение за звездами',
            'Развлекательная программа на борту',
            'Киносеанс в невесомости'
          ],
          meals: ['Завтрак', 'Обед', 'Ужин'],
          accommodation: 'Космический корабль',
          highlights: ['Вид на пролетающие астероиды', 'Звездное небо за иллюминатором']
        })
      }
    })

    itinerary.push({
      day: currentDay++,
      date: format(addDays(startDate, currentDay - 2), 'd MMMM yyyy', { locale: ru }),
      location: 'Земля',
      locationIcon: '🌍',
      activities: [
        'Вход в атмосферу',
        'Приземление',
        'Медицинский осмотр',
        'Торжественный ужин',
        'Вручение сертификатов'
      ],
      meals: ['Завтрак на орбите', 'Обед в центре', 'Торжественный ужин'],
      accommodation: 'Отель на Земле',
      highlights: ['Вид на планету при спуске', 'Воссоединение с гравитацией']
    })

    return itinerary
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!user) return

    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return

    const daysUntilDeparture = Math.ceil(
      (new Date(booking.departureDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysUntilDeparture < 7) {
      toast.error('Отмена возможна только за 7 и более дней до вылета', {
        className: 'error-toast',
        duration: 3000,
    })
      return
    }

    if (!confirm('Вы уверены, что хотите отменить бронирование?')) return

    setCancellingId(bookingId)
    const result = await cancelBooking(bookingId, user.id)
    setCancellingId(null)

    if (result.success) {
      toast.success('Бронирование отменено', {
        className: 'success-toast',
        duration: 3000,
    })
      const updated = await getUserBookings(user.id)
      if (updated.success && updated.bookings) {
        const formattedBookings: Booking[] = updated.bookings.map(booking => ({
          ...booking,
          departureDate: booking.departureDate.toString(),
          createdAt: booking.createdAt.toString(),
          passengers: booking.passengers.map(passenger => ({
            ...passenger,
            birthDate: passenger.birthDate.toString(),
            medicalCertificates: passenger.medicalCertificates.map(cert => ({
              ...cert,
              uploadDate: cert.uploadDate.toString()
            }))
          }))
        }))
        setBookings(formattedBookings)
      }
    } else {
      toast.error(result.error || 'Ошибка при отмене', {
        className: 'error-toast',
        duration: 3000,
    })
    }
  }

  const handleFileUpload = async (passengerId: string, file: File) => {
    if (!user) return
  
    setUploadingFor(passengerId)
  
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('passengerId', passengerId)
  
      const result = await uploadCertificateAction(formData)
  
      if (!result.success) {
        throw new Error(result.error)
      }
  
      toast.success('Справка успешно загружена', {
        className: 'success-toast',
        duration: 3000,
    })
  
      const updated = await getUserBookings(user.id)
      if (updated.success && updated.bookings) {
        const formattedBookings = updated.bookings.map(booking => ({
          ...booking,
          departureDate: booking.departureDate.toString(),
          createdAt: booking.createdAt.toString(),
          passengers: booking.passengers.map(p => ({
            ...p,
            birthDate: p.birthDate.toString(),
            medicalCertificates: p.medicalCertificates.map(c => ({
              ...c,
              uploadDate: c.uploadDate.toString()
            }))
          }))
        }))
        setBookings(formattedBookings)
      }
    } catch (error) {
      toast.error('Ошибка при загрузке справки', {
        className: 'error-toast',
        duration: 3000,
    })
    } finally {
      setUploadingFor(null)
    }
  }

  const handleDeleteCertificate = async (certificateId: string, fileKey: string) => {
    if (!confirm('Удалить справку?')) return

    const result = await deleteMedicalCertificate(certificateId, fileKey)
    if (result.success) {
      toast.success('Справка удалена', {
        className: 'success-toast',
        duration: 3000,
    })
      if (user) {
        const updated = await getUserBookings(user.id)
        if (updated.success && updated.bookings) {
          const formattedBookings: Booking[] = updated.bookings.map(booking => ({
            ...booking,
            departureDate: booking.departureDate.toString(),
            createdAt: booking.createdAt.toString(),
            passengers: booking.passengers.map(passenger => ({
              ...passenger,
              birthDate: passenger.birthDate.toString(),
              medicalCertificates: passenger.medicalCertificates.map(cert => ({
                ...cert,
                uploadDate: cert.uploadDate.toString()
              }))
            }))
          }))
          setBookings(formattedBookings)
        }
      }
    } else {
      toast.error('Ошибка при удалении', {
        className: 'error-toast',
        duration: 3000,
    })
    }
  }

  const handleDownloadCertificate = async (fileKey: string, fileName: string) => {
    const result = await getCertificateDownloadUrl(fileKey)
    if (result.success && result.downloadUrl) {
      window.open(result.downloadUrl, '_blank')
    } else {
      toast.error('Ошибка при скачивании', {
        className: 'error-toast',
        duration: 3000,
    })
    }
  }

  const toggleBooking = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId)
  }

  const getPathInfo = (pathId: string): SpacePath | undefined => {
    return SPACE_PATHS.find(p => p.id === pathId)
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'd MMMM yyyy', { locale: ru })
  }

  const formatDateTime = (date: string) => {
    return format(new Date(date), 'd MMMM yyyy, HH:mm', { locale: ru })
  }

  const getDaysUntilDeparture = (departureDate: string) => {
    const days = Math.ceil(
      (new Date(departureDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return days
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center flex flex-col justify-center items-center">
          <Loader2 className="text-purple-400 w-8 h-8 animate-spin" />
          <p className="text-purple-200 mt-4">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-12 px-4">
      {/* Звездный фон */}
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
        {/* Кнопка назад */}
        <Link
          href={`/profile/${user?.id}`}
          className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-100 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Вернуться в профиль
        </Link>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <Luggage className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Мои космические путешествия
          </h1>
          <p className="text-xl text-purple-200">
            {user?.firstName}, здесь вы можете управлять своими приключениями
          </p>
        </div>

        {/* Список бронирований */}
        {bookings.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-purple-500/30 text-center">
            <Luggage className="w-20 h-20 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">У вас пока нет бронирований</h3>
            <p className="text-purple-200 mb-6">Отправьтесь в космическое приключение прямо сейчас!</p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              <Rocket size={20} />
              Забронировать путешествие
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const daysUntil = getDaysUntilDeparture(booking.departureDate)
              const canCancel = daysUntil >= 7 && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED'
              const itinerary = generateItinerary(booking)
              
              return (
                <div
                  key={booking.id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl border border-purple-500/30 overflow-hidden"
                >
                  {/* Заголовок бронирования */}
                  <div
                    onClick={() => toggleBooking(booking.id)}
                    className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          <Plane size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-white">
                              {booking.bookingNumber}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[booking.status]}`}>
                              {statusLabels[booking.status]}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-purple-300">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDateTime(booking.departureDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {booking.passengers.length} пассажиров
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {booking.routeIds.length} станций
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {booking.status === 'CONFIRMED' && daysUntil > 0 && (
                          <div className="text-right">
                            <div className="text-sm text-purple-300">До вылета</div>
                            <div className="text-2xl font-bold text-white">{daysUntil} дн.</div>
                          </div>
                        )}
                        {expandedBooking === booking.id ? (
                          <ChevronUp className="w-6 h-6 text-purple-400" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-purple-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Детали бронирования */}
                  {expandedBooking === booking.id && (
                    <div className="border-t border-purple-500/30 p-6 bg-white/5">
                      {/* Детальный маршрут по дням */}
                      <div className="space-y-6">
                        <h4 className="text-xl font-bold text-white flex items-center gap-2">
                          <Globe className="text-purple-400" />
                          Ваше космическое приключение
                        </h4>

                        {/* Таймлайн маршрута */}
                        <div className="relative">
                          {/* Вертикальная линия */}
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-linear-to-b from-purple-600 to-pink-600 opacity-50" />

                          {itinerary.map((day, index) => (
                            <div key={index} className="relative pl-12 pb-8 last:pb-0">
                              {/* Кружок с номером дня */}
                              <div className="absolute left-0 w-8 h-8 bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                                {day.day}
                              </div>
                              
                              {/* Карточка дня */}
                              <div className="bg-white/5 rounded-xl p-4 border border-purple-500/30">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-2xl">{day.locationIcon}</span>
                                      <h5 className="text-lg font-semibold text-white">
                                        {day.location}
                                      </h5>
                                    </div>
                                    <p className="text-sm text-purple-300">{day.date}</p>
                                  </div>
                                </div>

                                {/* Активности */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                  <div>
                                    <h6 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-1">
                                      <Activity size={14} />
                                      Программа дня
                                    </h6>
                                    <ul className="space-y-1">
                                      {day.activities.map((activity, i) => (
                                        <li key={i} className="text-sm text-white flex items-start gap-2">
                                          <span className="text-purple-400 mt-1">•</span>
                                          <span>{activity}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <h6 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-1">
                                      <Coffee size={14} />
                                      Питание
                                    </h6>
                                    <ul className="space-y-1">
                                      {day.meals.map((meal, i) => (
                                        <li key={i} className="text-sm text-white flex items-start gap-2">
                                          <span className="text-purple-400 mt-1">•</span>
                                          <span>{meal}</span>
                                        </li>
                                      ))}
                                    </ul>

                                    <h6 className="text-sm font-semibold text-purple-300 mt-3 mb-2 flex items-center gap-1">
                                      <Moon size={14} />
                                      Проживание
                                    </h6>
                                    <p className="text-sm text-white">{day.accommodation}</p>
                                  </div>
                                </div>

                                {/* Особенности дня */}
                                <div className="mt-3 pt-3 border-t border-purple-500/30">
                                  <h6 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-1">
                                    <Sparkles size={14} />
                                    Особенности дня
                                  </h6>
                                  <div className="flex flex-wrap gap-2">
                                    {day.highlights.map((highlight, i) => (
                                      <span key={i} className="px-2 py-1 bg-purple-600/30 text-purple-200 text-xs rounded-full border border-purple-500/30">
                                        {highlight}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Пассажиры и справки */}
                        <div className="mt-8">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Users size={18} className="text-purple-400" />
                            Пассажиры и медицинские справки
                          </h4>
                          <div className="space-y-4">
                            {booking.passengers.map((passenger, index) => (
                              <div
                                key={passenger.id}
                                className="bg-white/5 rounded-lg p-4 border border-purple-500/30"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white">
                                        {passenger.lastName} {passenger.firstName} {passenger.middleName}
                                      </span>
                                      {index === 0 && (
                                        <span className="px-2 py-0.5 bg-purple-600/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                                          Главный
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-purple-300">
                                      {formatDate(passenger.birthDate)} • {passenger.phone}
                                    </p>
                                  </div>
                                </div>

                                {/* Медсправки */}
                                <div className="space-y-2">
                                  <p className="text-sm text-purple-200 mb-2">Медицинские справки:</p>
                                  
                                  {passenger.medicalCertificates.length > 0 ? (
                                    <div className="space-y-2">
                                      {passenger.medicalCertificates.map((cert) => (
                                        <div
                                          key={cert.id}
                                          className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-purple-500/30"
                                        >
                                          <div className="flex items-center gap-2">
                                            {cert.status === 'approved' ? (
                                              <CheckCircle size={16} className="text-green-400" />
                                            ) : cert.status === 'rejected' ? (
                                              <AlertCircle size={16} className="text-red-400" />
                                            ) : (
                                              <Clock size={16} className="text-yellow-400" />
                                            )}
                                            <span className="text-sm text-white truncate max-w-50">
                                              {cert.fileName}
                                            </span>
                                            <span className="text-xs text-purple-300">
                                              {format(new Date(cert.uploadDate), 'dd.MM.yyyy')}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => handleDownloadCertificate(cert.fileKey, cert.fileName)}
                                              className="p-1 hover:bg-white/10 rounded text-purple-300 hover:text-purple-200"
                                            >
                                              <Download size={14} />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteCertificate(cert.id, cert.fileKey)}
                                              className="p-1 hover:bg-white/10 rounded text-red-400 hover:text-red-300"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-purple-300 italic">
                                      Нет загруженных справок
                                    </p>
                                  )}

                                  {/* Кнопка загрузки справки */}
                                  {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                                    <div className="mt-2">
                                      <input
                                        type="file"
                                        id={`file-${passenger.id}`}
                                        className="hidden"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) {
                                            handleFileUpload(passenger.id, file)
                                          }
                                        }}
                                        disabled={uploadingFor === passenger.id}
                                      />
                                      <label
                                        htmlFor={`file-${passenger.id}`}
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg cursor-pointer transition-colors ${
                                          uploadingFor === passenger.id ? 'opacity-50 cursor-wait' : ''
                                        }`}
                                      >
                                        {uploadingFor === passenger.id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Загрузка...
                                          </>
                                        ) : (
                                          <>
                                            <Upload size={14} />
                                            Загрузить справку
                                          </>
                                        )}
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Пожелания */}
                        {booking.notes && (
                          <div className="mt-6">
                            <h4 className="text-lg font-semibold text-white mb-2">Пожелания</h4>
                            <p className="text-purple-200 bg-white/5 rounded-lg p-3 border border-purple-500/30">
                              {booking.notes}
                            </p>
                          </div>
                        )}

                        {/* Действия */}
                        {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                          <div className="mt-6 flex justify-end">
                            {canCancel ? (
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={cancellingId === booking.id}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {cancellingId === booking.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-300"></div>
                                    Отмена...
                                  </>
                                ) : (
                                  <>
                                    <X size={16} />
                                    Отменить бронирование
                                  </>
                                )}
                              </button>
                            ) : (
                              <p className="text-sm text-yellow-400">
                                Отмена возможна за 7+ дней до вылета
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}