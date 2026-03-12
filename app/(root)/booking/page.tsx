'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBooking } from '@/app/lib/api/booking'
import { toast } from 'sonner'
import {
  Rocket,
  Star,
  Calendar,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  MapPin,
  Clock,
  CreditCard,
  FileText,
  UserCircle,
  Phone,
  Mail,
  UserIcon,
  X,
  ChevronUp,
  ChevronDown,
  Timer,
  Check,
  Package
} from 'lucide-react'
import Link from 'next/link'
import SuccessModal from '@/components/SuccessModal'
import { getCurrentUser } from '@/app/lib/api/user'
import { User } from '@/app/lib/types'
import { SPACE_PATHS, SpacePath } from '@/app/lib/ways'

interface Passenger {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  birthDate: string
  phone: string
  email?: string
  passportSeries: string
  passportNumber: string
  passportIssuedBy: string
  passportIssuedAt: string
  passportCode?: string
}

interface SelectedPathWithDuration {
  pathId: string
  duration: number
}

export default function BookingPage() {
  const router = useRouter()
  
  const [selectedPaths, setSelectedPaths] = useState<SelectedPathWithDuration[]>([])
  const [departureDate, setDepartureDate] = useState('')
  const [departureTime, setDepartureTime] = useState('12:00')
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingNumber, setBookingNumber] = useState('')
  const [activeStep, setActiveStep] = useState(1)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const navigation = [
    "Маршрут",
    "Дата и время",
    "Пассажиры",
    "Подтверждение"
  ]

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if(currentUser){
        setUser(currentUser)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      setPassengers([
        {
          id: '1',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          middleName: '',
          birthDate: '',
          phone: user.phone || '',
          email: user.email || '',
          passportSeries: '',
          passportNumber: '',
          passportIssuedBy: '',
          passportIssuedAt: '',
          passportCode: ''
        }
      ])
    }
  }, [user])

  const isOver18 = (birthDate: string): boolean => {
    if (!birthDate) return false
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age >= 18
  }

  const addPassenger = (): void => {
    setPassengers([
      ...passengers,
      {
        id: Date.now().toString(),
        firstName: '',
        lastName: '',
        middleName: '',
        birthDate: '',
        phone: '',
        email: '',
        passportSeries: '',
        passportNumber: '',
        passportIssuedBy: '',
        passportIssuedAt: '',
        passportCode: ''
      }
    ])
  }

  const removePassenger = (id: string): void => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter(p => p.id !== id))
    } else {
      toast.error('Должен быть хотя бы один пассажир')
    }
  }

  const updatePassenger = (id: string, field: keyof Passenger, value: any): void => {
    setPassengers(passengers.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const addPath = (pathId: string): void => {
    if (!selectedPaths.find(p => p.pathId === pathId)) {
      setSelectedPaths([
        ...selectedPaths,
        { pathId, duration: 1 }
      ])
    }
  }

  const removePath = (index: number): void => {
    setSelectedPaths(selectedPaths.filter((_, i) => i !== index))
  }

  const updateDuration = (index: number, duration: number): void => {
    if (duration < 1) duration = 1
    if (duration > 2) {
      toast.warning('Максимальная длительность пребывания - 2 земных дня')
      duration = 2
    }
    const newPaths = [...selectedPaths]
    newPaths[index].duration = duration
    setSelectedPaths(newPaths)
  }

  const movePathUp = (index: number): void => {
    if (index === 0) return
    const newPaths = [...selectedPaths]
    ;[newPaths[index - 1], newPaths[index]] = [newPaths[index], newPaths[index - 1]]
    setSelectedPaths(newPaths)
  }

  const movePathDown = (index: number): void => {
    if (index === selectedPaths.length - 1) return
    const newPaths = [...selectedPaths]
    ;[newPaths[index], newPaths[index + 1]] = [newPaths[index + 1], newPaths[index]]
    setSelectedPaths(newPaths)
  }

  const calculateTotalPrice = (): number => {
    const stationCost = selectedPaths.reduce((total, item) => {
      const path = SPACE_PATHS.find((p: SpacePath) => p.id === item.pathId)
      return total + (path?.price || 0) * item.duration * passengers.length
    }, 0)
    
    return stationCost
  }

  const calculateTotalDuration = (): number => {
    return selectedPaths.reduce((total, item) => total + item.duration, 0)
  }

  const getPathInfo = (pathId: string): SpacePath | undefined => {
    return SPACE_PATHS.find((p: SpacePath) => p.id === pathId)
  }

  const validateStep1 = (): boolean => {
    if (selectedPaths.length === 0) {
      toast.error('Выберите хотя бы одну станцию')
      return false
    }
    return true
  }

  const validateStep2 = (): boolean => {
    if (!departureDate) {
      toast.error('Выберите дату вылета')
      return false
    }
    
    if (!departureTime) {
      toast.error('Выберите время вылета')
      return false
    }
    
    const selectedDateTime = new Date(`${departureDate}T${departureTime}`)
    const now = new Date()
    
    if (selectedDateTime < now) {
      toast.error('Дата и время вылета не могут быть в прошлом')
      return false
    }
    
    return true
  }

  const validatePassengers = (): boolean => {
    if (passengers.length === 0) {
      toast.error('Добавьте хотя бы одного пассажира')
      return false
    }

    for (const passenger of passengers) {
      if (!passenger.firstName || !passenger.lastName) {
        toast.error('Заполните ФИО для всех пассажиров')
        return false
      }

      if (!passenger.birthDate) {
        toast.error(`Заполните дату рождения пассажира ${passenger.firstName}`)
        return false
      }

      if (!isOver18(passenger.birthDate)) {
        toast.error(`Пассажир ${passenger.firstName} должен быть старше 18 лет`)
        return false
      }

      if (!passenger.phone) {
        toast.error(`Заполните телефон пассажира ${passenger.firstName}`)
        return false
      }

      if (!passenger.passportSeries || !passenger.passportNumber) {
        toast.error(`Заполните паспортные данные пассажира ${passenger.firstName}`)
        return false
      }

      if (!/^\d{4}$/.test(passenger.passportSeries)) {
        toast.error(`Серия паспорта пассажира ${passenger.firstName} должна содержать 4 цифры`)
        return false
      }

      if (!/^\d{6}$/.test(passenger.passportNumber)) {
        toast.error(`Номер паспорта пассажира ${passenger.firstName} должен содержать 6 цифр`)
        return false
      }

      if (!passenger.passportIssuedBy) {
        toast.error(`Заполните "Кем выдан" пассажира ${passenger.firstName}`)
        return false
      }

      if (!passenger.passportIssuedAt) {
        toast.error(`Заполните дату выдачи паспорта пассажира ${passenger.firstName}`)
        return false
      }
    }
    return true
  }

  const goToNextStep = (): void => {
    if (activeStep === 1 && validateStep1()) {
      setActiveStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (activeStep === 2 && validateStep2()) {
      setActiveStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (activeStep === 3 && validatePassengers()) {
      setActiveStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToPrevStep = (): void => {
    setActiveStep(activeStep - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    if (!validatePassengers()) return
    
    if (!agreeToTerms) {
      toast.error('Необходимо согласиться с условиями')
      return
    }

    setIsSubmitting(true)

    try {
      const departureDateTime = new Date(`${departureDate}T${departureTime}`)
      
      const durations: { [key: string]: number } = {}
      selectedPaths.forEach(item => {
        durations[item.pathId] = item.duration
      })
      
      const result = await createBooking({
        userId: user?.id || '',
        routeIds: selectedPaths.map(p => p.pathId),
        durations,
        departureDate: departureDateTime,
        mainPassenger: passengers[0],
        additionalPassengers: passengers.slice(1),
        notes
      })

      if (result.success) {
        setBookingNumber(String(result.bookingNumber))
        setShowSuccess(true)
      } else {
        toast.error(result.error || 'Ошибка при бронировании')
      }
    } catch (error) {
      toast.error('Произошла ошибка')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
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
            href="/"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-100 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            На главную
          </Link>

          <div className="text-center mb-8">
            <Rocket className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Космическое путешествие
            </h1>
            <p className="text-xl text-purple-200">
              Собери свой идеальный маршрут к звездам
            </p>
          </div>

          {/* Прогресс-бар */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      activeStep >= step
                        ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white/10 text-purple-300'
                    }`}
                  >
                    {step}
                  </div>
                  <span className="text-purple-300">{navigation[step - 1]}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {activeStep === 1 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {SPACE_PATHS.map((path: SpacePath) => {
                    const isSelected = selectedPaths.find(p => p.pathId === path.id)
                    const selectedIndex = selectedPaths.findIndex(p => p.pathId === path.id)
                    
                    return (
                      <div
                        key={path.id}
                        className={`
                          relative group overflow-hidden rounded-xl border transition-all duration-300
                          ${isSelected 
                            ? 'border-purple-400 bg-purple-600/20 ring-2 ring-purple-400' 
                            : 'border-purple-500/30 bg-white/5 hover:bg-white/10 hover:border-purple-400 cursor-pointer'
                          }
                        `}
                        onClick={() => !isSelected && addPath(path.id)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 left-2 z-10 w-8 h-8 bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {selectedIndex + 1}
                          </div>
                        )}

                        <div className="relative w-full h-40 bg-linear-to-br from-purple-900/50 to-pink-900/50 overflow-hidden">
                          <img
                            src={path.image}
                            alt={path.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <h3 className="text-white font-bold text-lg truncate">{path.name}</h3>
                          </div>
                        </div>

                        {/* Описание и информация */}
                        <div className="p-4">
                          <p className="text-sm text-purple-200 line-clamp-2 mb-3">
                            {path.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-[#E64A19] font-bold">
                              {path.price.toLocaleString()} ₽/день
                            </span>
                          </div>

                          {/* Базовые услуги */}
                          <div className="mt-2">
                            <p className="text-xs text-purple-300 mb-1 flex items-center gap-1">
                              <Package size={12} />
                              Входит в стоимость:
                            </p>
                            <ul className="text-xs text-purple-200 space-y-1">
                              {path.baseServices.slice(0, 3).map((service: string, i: number) => (
                                <li key={i} className="flex items-start gap-1">
                                  <CheckCircle size={10} className="text-green-400 mt-0.5 shrink-0" />
                                  <span className="line-clamp-1">{service}</span>
                                </li>
                              ))}
                              {path.baseServices.length > 3 && (
                                <li className="text-purple-400">+{path.baseServices.length - 3} услуг</li>
                              )}
                            </ul>
                          </div>

                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-purple-500/30">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-purple-200">Длительность (макс. 2 дня):</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const item = selectedPaths.find(p => p.pathId === path.id)
                                      if (item) {
                                        updateDuration(
                                          selectedPaths.findIndex(p => p.pathId === path.id),
                                          item.duration - 1
                                        )
                                      }
                                    }}
                                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                                  >
                                    -
                                  </button>
                                  <span className="text-white font-semibold w-8 text-center">
                                    {selectedPaths.find(p => p.pathId === path.id)?.duration || 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const item = selectedPaths.find(p => p.pathId === path.id)
                                      if (item) {
                                        updateDuration(
                                          selectedPaths.findIndex(p => p.pathId === path.id),
                                          item.duration + 1
                                        )
                                      }
                                    }}
                                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Кнопка удаления */}
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removePath(selectedIndex)
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white z-10"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Построенный маршрут и детали */}
                {selectedPaths.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <MapPin className="text-purple-400" />
                      Ваш маршрут
                    </h3>

                    {/* Визуализация маршрута */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      {selectedPaths.map((item, index) => {
                        const path = getPathInfo(item.pathId)!
                        return (
                          <div key={item.pathId} className="flex items-center">
                            <div className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 rounded-lg border border-purple-500/30">
                              <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {index + 1}
                              </span>
                              <span className="text-2xl">{path.icon}</span>
                              <div>
                                <span className="text-white font-medium">{path.name}</span>
                                <span className="text-xs text-purple-300 ml-2">
                                  {item.duration} дн.
                                </span>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <button
                                  type="button"
                                  onClick={() => movePathUp(index)}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => movePathDown(index)}
                                  disabled={index === selectedPaths.length - 1}
                                  className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                                >
                                  <ChevronDown size={16} />
                                </button>
                              </div>
                            </div>
                            {index < selectedPaths.length - 1 && (
                              <span className="mx-2 text-purple-400">→</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Детали маршрута */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-purple-600/20 rounded-xl border border-purple-400">
                        <p className="text-sm text-purple-200">Всего станций</p>
                        <p className="text-2xl font-bold text-white">{selectedPaths.length}</p>
                      </div>
                      <div className="p-4 bg-purple-600/20 rounded-xl border border-purple-400">
                        <p className="text-sm text-purple-200">Общая длительность</p>
                        <p className="text-2xl font-bold text-white">{calculateTotalDuration()} дней</p>
                      </div>
                      <div className="p-4 bg-purple-600/20 rounded-xl border border-purple-400">
                        <p className="text-sm text-purple-200">Общая стоимость</p>
                        <p className="text-2xl font-bold text-[#E64A19]">{calculateTotalPrice().toLocaleString()} ₽</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ШАГ 2: Дата и время вылета */}
            {activeStep === 2 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar className="text-purple-400" />
                  Дата и время вылета (МСК)
                </h2>

                <div className="max-w-md mx-auto space-y-4">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" />
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Timer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" />
                    <input
                      type="time"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>
                  
                  <div className="mt-4 p-3 bg-purple-600/20 rounded-lg border border-purple-400">
                    <p className="text-sm text-purple-200 flex items-center gap-2">
                      <Clock size={16} />
                      Время указано по московскому времени (МСК). Рекомендуем бронировать минимум за 30 дней до вылета.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ШАГ 3: Пассажиры */}
            {activeStep === 3 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Users className="text-purple-400" />
                  Пассажиры (только 18+)
                </h2>

                <div className="space-y-6">
                  {passengers.map((passenger, index) => {
                    const isOver18Value = passenger.birthDate ? isOver18(passenger.birthDate) : true
                    
                    return (
                      <div key={passenger.id} className="relative p-6 bg-white/5 rounded-xl border border-purple-500/30">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removePassenger(passenger.id)}
                            className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                        
                        <div className="flex items-center gap-3 mb-4">
                          {index === 0 ? (
                            <UserIcon className="w-8 h-8 text-purple-400" />
                          ) : (
                            <UserCircle className="w-8 h-8 text-purple-400" />
                          )}
                          <h3 className="text-lg font-semibold text-white">
                            {index === 0 ? 'Главный пассажир (данные из профиля)' : `Пассажир ${index + 1}`}
                          </h3>
                          {!isOver18Value && passenger.birthDate && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30">
                              Младше 18 лет
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* ФИО - для главного пассажира поля только для чтения */}
                          {index === 0 ? (
                            <>
                              <div className="px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white/80">
                                <span className="text-xs text-purple-300 block">Фамилия</span>
                                {passenger.lastName}
                              </div>
                              <div className="px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white/80">
                                <span className="text-xs text-purple-300 block">Имя</span>
                                {passenger.firstName}
                              </div>
                              <input
                                type="text"
                                placeholder="Отчество"
                                value={passenger.middleName || ''}
                                onChange={(e) => updatePassenger(passenger.id, 'middleName', e.target.value)}
                                className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                              />
                            </>
                          ) : (
                            <>
                              <input
                                type="text"
                                placeholder="Фамилия *"
                                value={passenger.lastName}
                                onChange={(e) => updatePassenger(passenger.id, 'lastName', e.target.value)}
                                className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                required
                              />
                              <input
                                type="text"
                                placeholder="Имя *"
                                value={passenger.firstName}
                                onChange={(e) => updatePassenger(passenger.id, 'firstName', e.target.value)}
                                className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                required
                              />
                              <input
                                type="text"
                                placeholder="Отчество"
                                value={passenger.middleName || ''}
                                onChange={(e) => updatePassenger(passenger.id, 'middleName', e.target.value)}
                                className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                              />
                            </>
                          )}

                          {/* Дата рождения */}
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                            <input
                              type="date"
                              value={passenger.birthDate}
                              onChange={(e) => {
                                updatePassenger(passenger.id, 'birthDate', e.target.value)
                                if (!isOver18(e.target.value)) {
                                  toast.warning('Все пассажиры должны быть старше 18 лет')
                                }
                              }}
                              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                              placeholder="Дата рождения *"
                              required
                            />
                          </div>

                          {/* Контакты */}
                          {index === 0 ? (
                            <>
                              <div className="px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white/80">
                                <span className="text-xs text-purple-300 block">Телефон</span>
                                {passenger.phone}
                              </div>
                              <div className="px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white/80">
                                <span className="text-xs text-purple-300 block">Email</span>
                                {passenger.email}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                                <input
                                  type="tel"
                                  placeholder="Телефон *"
                                  value={passenger.phone}
                                  onChange={(e) => updatePassenger(passenger.id, 'phone', e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                  required
                                />
                              </div>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                                <input
                                  type="email"
                                  placeholder="Email"
                                  value={passenger.email || ''}
                                  onChange={(e) => updatePassenger(passenger.id, 'email', e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                />
                              </div>
                            </>
                          )}

                          {/* Паспортные данные */}
                          <div className="col-span-2">
                            <div className="border-t border-purple-500/30 my-4 pt-4">
                              <p className="text-sm text-purple-200 mb-3 flex items-center gap-2">
                                <FileText size={16} />
                                Паспортные данные (для всех пассажиров)
                              </p>
                            </div>
                          </div>

                          <input
                            type="text"
                            placeholder="Серия паспорта * (4 цифры)"
                            value={passenger.passportSeries}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                              updatePassenger(passenger.id, 'passportSeries', value)
                            }}
                            className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            required
                            maxLength={4}
                          />
                          <input
                            type="text"
                            placeholder="Номер паспорта * (6 цифр)"
                            value={passenger.passportNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                              updatePassenger(passenger.id, 'passportNumber', value)
                            }}
                            className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            required
                            maxLength={6}
                          />
                          <input
                            type="text"
                            placeholder="Кем выдан *"
                            value={passenger.passportIssuedBy}
                            onChange={(e) => updatePassenger(passenger.id, 'passportIssuedBy', e.target.value)}
                            className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            required
                          />
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                            <input
                              type="date"
                              placeholder="Дата выдачи *"
                              value={passenger.passportIssuedAt}
                              onChange={(e) => updatePassenger(passenger.id, 'passportIssuedAt', e.target.value)}
                              max={new Date().toISOString().split('T')[0]}
                              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                              required
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Код подразделения"
                            value={passenger.passportCode || ''}
                            onChange={(e) => updatePassenger(passenger.id, 'passportCode', e.target.value)}
                            className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                        </div>
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    onClick={addPassenger}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Plus size={18} />
                    Добавить пассажира
                  </button>
                </div>
              </div>
            )}

            {/* Подтверждение */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="text-purple-400" />
                    Пожелания
                  </h2>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Особые пожелания, предпочтения по питанию, дополнительная информация..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="text-purple-400" />
                    Итоговая информация
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-purple-200 mb-2">Маршрут:</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPaths.map((item, index) => {
                          const path = getPathInfo(item.pathId)!
                          return (
                            <div key={item.pathId} className="flex items-center">
                              <span className="px-3 py-1 bg-purple-600/20 rounded-lg text-white text-sm border border-purple-500/30">
                                {index + 1}. {path.icon} {path.name} ({item.duration} дн.)
                              </span>
                              {index < selectedPaths.length - 1 && (
                                <span className="mx-2 text-purple-400">→</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-purple-200 mb-2">Дата и время вылета (МСК):</h3>
                      <p className="text-white">
                        {new Date(`${departureDate}T${departureTime}`).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Europe/Moscow'
                        })}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-purple-200 mb-2">Пассажиры ({passengers.length} чел):</h3>
                      <ul className="space-y-1">
                        {passengers.map((p, i) => (
                          <li key={p.id} className="text-white text-sm">
                            {i === 0 ? '👨‍🚀 ' : '👤 '} {p.lastName} {p.firstName} {p.middleName}
                            {i === 0 && <span className="text-purple-300 text-xs ml-2">(главный)</span>}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-purple-500/30 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200">Общая стоимость:</span>
                        <span className="text-2xl font-bold text-[#E64A19]">
                          {calculateTotalPrice().toLocaleString()} ₽
                        </span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`
                            w-6 h-6 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                            ${agreeToTerms 
                              ? 'bg-purple-400 border-purple-400'
                              : 'bg-white/5 border-purple-500/30 group-hover:border-purple-400'
                            }
                          `}>
                            {agreeToTerms && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-purple-200 leading-relaxed">
                          Я подтверждаю, что все пассажиры старше 18 лет, и соглашаюсь с условиями 
                          космического путешествия. Паспортные данные введены верно.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="px-6 py-3 bg-white/10 text-purple-200 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Назад
                </button>
              )}
              
              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="ml-auto px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors cursor-pointer"
                >
                  Далее
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !agreeToTerms}
                  className="ml-auto px-8 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Оформление...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      Забронировать
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          router.push('/profile/bookings')
        }}
        bookingNumber={bookingNumber}
      />
    </>
  )
}