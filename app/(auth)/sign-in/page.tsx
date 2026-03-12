'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Star, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'email' ? value.toLowerCase() : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Неверный email или пароль');
      } else {
        toast.success('Вы успешно вошли в аккаунт!', {
          className: 'success-toast',
          duration: 3000,
        })
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError('Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md space-y-8 bg-white/10 backdrop-blur-lg py-8 px-6 sm:px-8 rounded-2xl border border-purple-500/30 shadow-2xl">
      <div>
        <div className="mx-auto h-12 w-12 relative">
          <Rocket className="w-12 h-12 text-purple-400 mx-auto animate-bounce" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          Вход в систему
        </h2>
        <p className="mt-2 text-center text-sm text-purple-200">
          Добро пожаловать в космическое пространство
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-purple-200">
              Email
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
            <label htmlFor="password" className="block text-sm font-medium text-purple-200">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 appearance-none relative block w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg placeholder-purple-300 text-white focus:outline-none focus:ring-purple-400 focus:border-purple-400 focus:z-10 sm:text-sm"
              placeholder="********"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-4">
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
                Вход...
              </span>
            ) : (
              'Войти'
            )}
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/sign-up"
            className="text-purple-200 hover:text-purple-100"
          >
            Нет аккаунта? <span className="text-purple-400 hover:text-purple-300 font-medium underline">Зарегистрируйтесь</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function SignIn() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
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

      {/* Оборачиваем компонент с useSearchParams в Suspense */}
      <Suspense fallback={
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-200 mt-4">Загрузка...</p>
        </div>
      }>
        <SignInForm />
      </Suspense>
    </div>
  );
}