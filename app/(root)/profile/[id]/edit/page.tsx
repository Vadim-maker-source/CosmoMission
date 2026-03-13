'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  UserIcon,
  Mail,
  Phone,
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  Search
} from 'lucide-react'
import { User } from '@/app/lib/types'
import { toast } from 'sonner'
import { getCurrentUser, updateUserProfile } from '@/app/lib/api/user'
import { AddressSuggestions, DaDataSuggestion, DaDataAddress } from 'react-dadata'
import 'react-dadata/dist/react-dadata.css'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditProfilePage({ params }: PageProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    region: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [selectedRegion, setSelectedRegion] = useState<DaDataSuggestion<DaDataAddress> | undefined>()

  const dadata_token = process.env.NEXT_PUBLIC_DADATA_TOKEN

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

        if (current.id !== userId && current.role !== 'ADMIN') {
          router.push('/')
          return
        }

        setUser(current)
        setFormData({
          firstName: current.firstName || '',
          lastName: current.lastName || '',
          email: current.email || '',
          phone: current.phone || '',
          age: current.age?.toString() || '',
          region: current.region || ''
        })
        
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'email' ? value.toLowerCase() : value 
    }))
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleRegionSelect = (suggestion: DaDataSuggestion<DaDataAddress> | undefined) => {
    setSelectedRegion(suggestion)
    if (suggestion && suggestion.data) {
      const region = suggestion.data.region || 
                     suggestion.data.city || 
                     suggestion.data.settlement || 
                     suggestion.data.street || 
                     suggestion.value
      setFormData(prev => ({ ...prev, region }))
      
      if (errors.region) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.region
          return newErrors
        })
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Введите корректный email'
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефон обязателен'
    } else {
      const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Введите корректный телефон'
      }
    }

    if (!formData.age) {
      newErrors.age = 'Возраст обязателен'
    } else {
      const age = parseInt(formData.age)
      if (isNaN(age) || age < 18 || age > 120) {
        newErrors.age = 'Возраст должен быть от 18 до 120 лет'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме', {
        className: 'error-toast',
        duration: 3000,
      })
      return
    }

    setSaving(true)

    try {
      const result = await updateUserProfile({
        userId: userId!,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        age: parseInt(formData.age),
        region: formData.region || undefined
      })

      if (result.success) {
        toast.success('Профиль успешно обновлен!', {
          className: 'success-toast',
          duration: 3000,
        })
        router.push(`/profile/${userId}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Ошибка при обновлении профиля', {
          className: 'error-toast',
          duration: 3000,
        })
      }
    } catch (error) {
      toast.error('Произошла ошибка', {
        className: 'error-toast',
        duration: 3000,
      })
    } finally {
      setSaving(false)
    }
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

  if (!user || !currentUser || !userId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-purple-200">Пользователь не найден</p>
        </div>
      </div>
    )
  }

  if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-purple-200">У вас нет прав для редактирования этого профиля</p>
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
            <div className="w-1 h-1 bg-white/30 rounded-full" />
          </div>
        ))}
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Кнопка назад */}
        <Link
          href={`/profile/${userId}`}
          className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-100 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Вернуться в профиль
        </Link>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <UserIcon className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Редактирование профиля
          </h1>
          <p className="text-xl text-purple-200">
            {currentUser.role === 'ADMIN' && currentUser.id !== userId 
              ? `Редактирование профиля пользователя ${user.firstName} ${user.lastName}`
              : 'Измените свои личные данные'
            }
          </p>
        </div>

        {/* Форма редактирования */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Имя */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-purple-200 mb-2">
                Имя *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-white/5 border ${
                  errors.firstName ? 'border-red-500' : 'border-purple-500/30'
                } rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors`}
                placeholder="Введите ваше имя"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
              )}
            </div>

            {/* Фамилия */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-purple-200 mb-2">
                Фамилия *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-white/5 border ${
                  errors.lastName ? 'border-red-500' : 'border-purple-500/30'
                } rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors`}
                placeholder="Введите вашу фамилию"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${
                    errors.email ? 'border-red-500' : 'border-purple-500/30'
                  } rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors`}
                  placeholder="example@mail.ru"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Телефон */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-purple-200 mb-2">
                Телефон *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${
                    errors.phone ? 'border-red-500' : 'border-purple-500/30'
                  } rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors`}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
              )}
            </div>

            {/* Возраст */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-purple-200 mb-2">
                Возраст *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="18"
                  max="120"
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${
                    errors.age ? 'border-red-500' : 'border-purple-500/30'
                  } rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors`}
                  placeholder="25"
                />
              </div>
              {errors.age && (
                <p className="mt-1 text-sm text-red-400">{errors.age}</p>
              )}
            </div>

            {/* Регион с Dadata */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-purple-200 mb-2">
                Регион
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 z-10 pointer-events-none" />
                <AddressSuggestions
                  token={String(dadata_token)}
                  value={selectedRegion}
                  onChange={handleRegionSelect}
                  inputProps={{
                    placeholder: 'Начните вводить название региона...',
                    className: `w-full pl-10 pr-4 py-3 bg-white/5 border ${
                      errors.region ? 'border-red-500' : 'border-purple-500/30'
                    } rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors`,
                  }}
                  filterLocations={[
                    { country: 'Россия' },
                    { country: 'Беларусь' },
                    { country: 'BY' },
                    { country: 'RU' }
                  ]}
                  count={10}
                />
              </div>
              <p className="mt-1 text-xs text-purple-300">
                Начните вводить название региона, города или населенного пункта
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Сохранить изменения
                  </>
                )}
              </button>
              
              <Link
                href={`/profile/${userId}`}
                className="px-6 py-3 bg-white/10 text-purple-200 rounded-lg hover:bg-white/20 transition-colors text-center"
              >
                Отмена
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}