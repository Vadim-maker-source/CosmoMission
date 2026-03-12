'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Rocket, 
  Star, 
  Send, 
  ArrowLeft,
  Mail,
  MessageSquare,
  CheckCircle,
  Loader2,
  User
} from 'lucide-react'
import { getCurrentUser } from '@/app/lib/api/user'
import { User as UserType } from '@/app/lib/types'
import { toast } from 'sonner'
import { sendSupportMessage } from '@/app/lib/api/support'

export default function Support() {
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    name: '',
    email: ''
  })
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        // Если пользователь авторизован, подставляем его данные
        setFormData(prev => ({
          ...prev,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          email: currentUser.email
        }))
      }
    }
    checkAuth()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.subject.trim()) {
      toast.error('Выберите тему обращения', {
        className: 'error-toast',
        duration: 3000,
      })
      return false
    }

    if (!formData.message.trim()) {
      toast.error('Введите сообщение', {
        className: 'error-toast',
        duration: 3000,
      })
      return false
    }

    if (!user) {
      if (!formData.name.trim()) {
        toast.error('Введите ваше имя', {
          className: 'error-toast',
          duration: 3000,
        })
        return false
      }

      if (!formData.email.trim()) {
        toast.error('Введите ваш email', {
          className: 'error-toast',
          duration: 3000,
        })
        return false
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error('Введите корректный email', {
          className: 'error-toast',
          duration: 3000,
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('subject', formData.subject)
      formDataObj.append('message', formData.message)
      
      if (user?.id) {
        formDataObj.append('userId', user.id)
        formDataObj.append('userEmail', user.email)
        formDataObj.append('userName', `${user.firstName} ${user.lastName}`)
      } else {
        formDataObj.append('userName', formData.name)
        formDataObj.append('userEmail', formData.email)
      }

      const result = await sendSupportMessage(formDataObj)

      if (result.success) {
        setSuccess(true)
        setFormData({ 
          subject: '', 
          message: '',
          name: user ? `${user.firstName} ${user.lastName}` : '',
          email: user ? user.email : ''
        })
        toast.success('Сообщение отправлено! Мы ответим вам в ближайшее время.', {
          className: 'success-toast',
          duration: 3000,
        })
        
        setTimeout(() => setSuccess(false), 5000)
      } else {
        toast.error(result.error || 'Ошибка при отправке', {
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
      setLoading(false)
    }
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
            Служба поддержки
          </h1>
          <p className="text-xl text-purple-200">
            Мы всегда готовы помочь вам с любыми вопросами
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          

          <div className="md:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-2xl font-bold text-white mb-6">Напишите нам</h2>

              {success && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-300">
                    Сообщение успешно отправлено! Мы ответим вам в ближайшее время.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Поля для неавторизованных пользователей */}
                {!user && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-purple-200 mb-2">
                          Ваше имя *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="Иван Иванов"
                            required={!user}
                          />
                        </div>
                      </div>

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
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="ivan@example.com"
                            required={!user}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
                      <p className="text-sm text-purple-200">
                        На этот email придет ответ от поддержки
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-purple-200 mb-2">
                    Тема обращения *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="" className="bg-slate-900">Выберите тему</option>
                    <option value="booking" className="bg-slate-900">Вопрос о бронировании</option>
                    <option value="documents" className="bg-slate-900">Документы</option>
                    <option value="medical" className="bg-slate-900">Медицинская справка</option>
                    <option value="technical" className="bg-slate-900">Техническая проблема</option>
                    <option value="other" className="bg-slate-900">Другое</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-purple-200 mb-2">
                    Сообщение *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    placeholder="Опишите ваш вопрос или проблему..."
                  />
                </div>

                {user && (
                  <div className="p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
                    <p className="text-sm text-purple-200">
                      Вы авторизованы как <span className="text-white font-medium">{user.firstName} {user.lastName}</span>
                    </p>
                    <p className="text-xs text-purple-300 mt-1">
                      Ответ придет на ваш email: {user.email}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Отправка...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send size={18} />
                      <span>Отправить сообщение</span>
                    </div>
                  )}
                </button>

                {!user && (
                  <p className="text-xs text-center text-purple-300 mt-4">
                    Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                  </p>
                )}
              </form>
            </div>
          </div>


          <div className="md:col-span-1 space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4">Контакты</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <p className="text-sm text-purple-300">Email</p>
                    <a href="mailto:support@cosmomission.ru" className="text-white hover:text-purple-300 transition-colors">
                      Vadimbureev380@yandex.ru
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <p className="text-sm text-purple-300">Время работы</p>
                    <p className="text-white">Круглосуточно, без выходных</p>
                    <p className="text-sm text-purple-300 mt-1">Среднее время ответа: 2 часа</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}