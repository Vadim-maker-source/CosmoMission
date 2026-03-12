'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { checkEmail, createUser, sendVerificationCode } from '@/app/lib/api/user';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Star, Rocket } from 'lucide-react';
import { generateVerificationCode } from '@/app/lib/code';
import { toast } from 'sonner';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  password: string;
  confirmPassword: string;
  region?: string;
}

export default function SignUp() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [generatedCode, setGeneratedCode] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    password: '',
    confirmPassword: '',
    region: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'email' ? value.toLowerCase() : value
    }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.age) {
      setError('Пожалуйста, заполните все поля');
      return false;
    }
    
    const age = parseInt(formData.age);
    if (age < 18 || age > 120) {
      setError('Возраст должен быть от 18 до 120 лет');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email.trim() || !formData.phone) {
      setError('Пожалуйста, заполните все поля');
      return false;
    }
    
    if (!emailRegex.test(formData.email)) {
      setError('Пожалуйста, введите корректный email');
      return false;
    }
    
    const phoneWithoutCountry = formData.phone.replace(/^\+?\d{1,3}/, '');
    if (phoneWithoutCountry.length < 7) {
      setError('Пожалуйста, введите корректный номер телефона');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Пожалуйста, заполните все поля');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    setError('');
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const sendCode = async () => {
    const code = generateVerificationCode();
    setGeneratedCode(code);
    
    setOtpLoading(true);
    setOtpError('');
    
    try {
      const result = await sendVerificationCode(formData.email, code);
      
      if (result.error) {
        setOtpError(result.error);
      } else {
        setOtpCooldown(60);
        const timer = setInterval(() => {
          setOtpCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      setOtpError('Не удалось отправить код подтверждения');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateStep3()) return;
    
    setLoading(true);

    try {
      const existingUser = await checkEmail(formData.email)

      if (existingUser.exists) {
        setError('Пользователь с таким email уже существует');
        setLoading(false);
        return;
      }

      await sendCode();
      setOtpModalOpen(true);
      
    } catch (error) {
      setError('Произошла ошибка при регистрации');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpValue.length !== 6) {
      setOtpError('Введите полный код подтверждения');
      return;
    }

    if (otpValue !== generatedCode) {
      setOtpError('Неверный код подтверждения');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const result = await createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        age: parseInt(formData.age),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        region: formData.region,
      });

      if (result.error) {
        setOtpError(result.error);
        setOtpLoading(false);
        return;
      } else {
        toast.success('Вы успешно зарегистрировали аккаунт!', {
          className: 'success-toast',
          duration: 3000,
      })
      }

      setOtpModalOpen(false);
      setOtpValue('');
      setGeneratedCode('');

      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (signInResult?.error) {
        setError('Регистрация успешна! Пожалуйста, войдите вручную.');
        router.push('/sign-in');
      } else {
        toast.success('Вы успешно вошли в аккаунт!', {
          className: 'success-toast',
          duration: 3000,
      })
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setOtpError('Ошибка при регистрации');
      console.error(error);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Звездный фон */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              <Star className="text-white w-1 h-1" />
            </div>
          ))}
        </div>

        <div className="relative w-full max-w-md space-y-8 bg-white/10 backdrop-blur-lg py-8 px-6 sm:px-8 rounded-2xl border border-purple-500/30 shadow-2xl">
          <div>
            <div className="mx-auto h-12 w-12 relative">
              <Rocket className="w-12 h-12 text-purple-400 mx-auto" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-white">
              Регистрация
            </h2>
            <p className="mt-2 text-center text-sm text-purple-200">
              Присоединяйтесь к космическому сообществу
            </p>
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-2">
                {[1, 2, 3].map((number) => (
                  <div
                    key={number}
                    className={`w-3 h-3 rounded-full ${
                      step === number ? 'bg-purple-400' : 'bg-purple-400/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Шаг 1: Имя, фамилия, возраст */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-purple-200">
                    Имя *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg placeholder-purple-300 text-white focus:outline-none focus:ring-purple-400 focus:border-purple-400 focus:z-10 sm:text-sm"
                    placeholder="Введите ваше имя"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-purple-200">
                    Фамилия *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg placeholder-purple-300 text-white focus:outline-none focus:ring-purple-400 focus:border-purple-400 focus:z-10 sm:text-sm"
                    placeholder="Введите вашу фамилию"
                  />
                </div>
                
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-purple-200">
                    Возраст *
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="120"
                    required
                    value={formData.age}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg placeholder-purple-300 text-white focus:outline-none focus:ring-purple-400 focus:border-purple-400 focus:z-10 sm:text-sm"
                    placeholder="Введите ваш возраст"
                  />
                  <p className="mt-1 text-xs text-purple-300">Минимальный возраст: 18 лет</p>
                </div>
              </div>
            )}

            {/* Шаг 2: Email, телефон и регион */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-purple-200">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg placeholder-purple-300 text-white focus:outline-none focus:ring-purple-400 focus:border-purple-400 focus:z-10 sm:text-sm"
                    placeholder="example@mail.ru"
                  />
                </div>
                
                <div>
                <label htmlFor="phone" className="block text-sm font-medium text-purple-200">
        Телефон *
      </label>
      <PhoneInput
        country={'ru'}
        value={formData.phone}
        onChange={handlePhoneChange}
        inputProps={{
          name: 'phone',
          required: true,
        }}
        containerClass="phone-input-container"
        buttonClass="phone-input-button"
        dropdownClass="phone-input-dropdown"
        searchClass="phone-input-search"
        enableSearch={true}
        searchPlaceholder="Поиск страны..."
        disableSearchIcon={true}
        placeholder="+7 (999) 123-45-67"
      />
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-purple-200">
                    Регион
                  </label>
                  <input
                    id="region"
                    name="region"
                    type="text"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg placeholder-purple-300 text-white focus:outline-none focus:ring-purple-400 focus:border-purple-400 focus:z-10 sm:text-sm"
                    placeholder="Ваш регион"
                  />
                </div>
              </div>
            )}

            {/* Шаг 3: Пароль */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-purple-200">
                    Пароль *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg placeholder-purple-300 text-white focus:outline-none focus:ring-purple-400 focus:border-purple-400 focus:z-10 sm:text-sm"
                    placeholder="Минимум 6 символов"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-purple-200">
                    Подтвердите пароль *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg placeholder-purple-300 text-white focus:outline-none focus:ring-purple-400 focus:border-purple-400 focus:z-10 sm:text-sm"
                    placeholder="Повторите пароль"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="cursor-pointer relative w-full flex justify-center py-2 px-4 border border-purple-500/30 text-sm font-medium rounded-lg text-purple-200 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 transition-colors"
                  disabled={loading}
                >
                  Назад
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="cursor-pointer relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-400 hover:bg-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 transition-colors"
                  disabled={loading}
                >
                  Далее
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-400 hover:bg-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Регистрация...
                    </span>
                  ) : (
                    'Зарегистрироваться'
                  )}
                </button>
              )}
            </div>

            <div className="text-center">
              <Link
                href="/sign-in"
                className="text-purple-200 hover:text-purple-100"
              >
                Уже есть аккаунт? <span className="text-purple-400 hover:text-purple-300 font-medium underline">Войдите</span>
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* OTP Modal */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="sm:max-w-xl bg-linear-to-br from-slate-900 to-purple-900 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-white">
              Подтверждение email
            </DialogTitle>
            <DialogDescription className="text-center text-purple-200">
              Мы отправили 6-значный код подтверждения на адрес<br />
              <span className="font-medium text-purple-400">{formData.email}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-6 py-4">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
              disabled={otpLoading}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="bg-white/5 border-purple-500/30 text-white" />
                <InputOTPSlot index={1} className="bg-white/5 border-purple-500/30 text-white" />
                <InputOTPSlot index={2} className="bg-white/5 border-purple-500/30 text-white" />
                <InputOTPSlot index={3} className="bg-white/5 border-purple-500/30 text-white" />
                <InputOTPSlot index={4} className="bg-white/5 border-purple-500/30 text-white" />
                <InputOTPSlot index={5} className="bg-white/5 border-purple-500/30 text-white" />
              </InputOTPGroup>
            </InputOTP>

            {otpError && (
              <p className="text-sm text-red-400 text-center">
                {otpError}
              </p>
            )}

            <div className="flex flex-col items-center space-y-2 w-full">
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={otpLoading || otpValue.length !== 6}
                className="w-full cursor-pointer flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-400 hover:bg-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Проверка...
                  </span>
                ) : (
                  'Подтвердить'
                )}
              </button>

              <button
                type="button"
                onClick={sendCode}
                disabled={otpLoading || otpCooldown > 0}
                className="text-sm text-purple-400 hover:text-purple-300 disabled:text-gray-500 disabled:no-underline"
              >
                {otpCooldown > 0 
                  ? `Отправить код повторно через ${otpCooldown}с` 
                  : 'Отправить код повторно'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}