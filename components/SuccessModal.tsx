'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { Rocket, Star, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import { User } from '@/app/lib/types'
import { getCurrentUser } from '@/app/lib/api/user'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  bookingNumber: string
}

export default function SuccessModal({ isOpen, onClose, bookingNumber }: SuccessModalProps) {
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
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 to-purple-900 p-6 text-left align-middle shadow-xl transition-all border border-purple-500/30">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(20)].map((_, i) => (
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

                <div className="relative">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
                      <img src="/images/success-payment.png" alt="Успешная оплата" />
                    </div>
                    
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold text-white mb-2"
                    >
                      Путешествие забронировано! 🚀
                    </Dialog.Title>
                    
                    <div className="mt-4 space-y-4">
                      <div className="bg-white/5 rounded-lg p-4 border border-purple-500/30">
                        <p className="text-sm text-purple-200 mb-1">Номер бронирования</p>
                        <p className="text-2xl font-mono font-bold text-[#E64A19]">{bookingNumber}</p>
                      </div>

                      <div className="space-y-2 text-purple-200">
                        <p className="flex items-center justify-center gap-2">
                          <Rocket className="w-4 h-4" />
                          Ваше космическое приключение подтверждено!
                        </p>
                        <p className="flex items-center justify-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Детали полета в личном кабинете
                        </p>
                        <p className="flex items-center justify-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Медсправку можно прикрепить в профиле
                        </p>
                      </div>

                      <div className="bg-purple-600/20 rounded-lg p-3 border border-purple-400">
                        <p className="text-sm text-purple-200">
                          ✨ В личном кабинете вы сможете:
                        </p>
                        <ul className="text-xs text-purple-300 mt-2 space-y-1">
                          <li>• Прикрепить медсправки для всех пассажиров</li>
                          <li>• Скачать маршрут и документы</li>
                          <li>• Оплатить путешествие</li>
                          <li>• Связаться с центром управления полетами</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <Link
                        href={`/profile/${user?.id}`}
                        className="inline-flex justify-center items-center px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 transition-all"
                        onClick={onClose}
                      >
                        Перейти к бронированию
                      </Link>
                      
                      <button
                        type="button"
                        className="inline-flex justify-center items-center px-4 py-2 bg-white/10 text-purple-200 text-sm font-medium rounded-lg hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 transition-all"
                        onClick={onClose}
                      >
                        Закрыть
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}