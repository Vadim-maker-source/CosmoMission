import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"

const HowBooking = () => {
  return (
    <div className="w-full h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-12">
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
        <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl text-purple-300 hover:text-purple-100 mb-6 ml-6 transition-colors"
          >
            <ArrowLeft size={20} />
            На главную
          </Link>
        <div className="w-full bg-[#282828]/60 text-white py-8 flex items-center justify-center">
            <h1 className="text-2xl">Порядок бронирования и организации космического тура</h1>
        </div>
        <div className="w-full bg-[#282828]/60 text-white mt-12 px-12 py-8">
            <h1>Процедура бронирования и подготовки к полёту строго регламентирована и состоит из нескольких обязательных этапов.</h1>
            <p className="text-lg mt-6">
            <span className="text-xl">Этап 1. Выбор программы и подача заявки</span><br />
            Ознакомьтесь с описанием доступных миссий на нашем сайте. Определите программу пребывания, включая количество дней вне Земли. Для составления комбинированного тура из нескольких программ свяжитесь с отделом бронирования для расчёта индивидуальных условий.
            </p>
            <p className="text-lg mt-6">
            <span className="text-xl">Этап 2. Финансовое обеспечение и подтверждение</span><br />
После выбора программы необходимо внести предоплату согласно условиям договора. Бронирование считается подтверждённым только после поступления средств на расчётный счёт АНО «КосмоМиссия» и получения соответствующего уведомления от нашего менеджера.
</p>
            <p className="text-lg mt-6">
            <span className="text-xl">Этап 3. Предполётная подготовка</span><br />
Не позднее чем за 14 календарных дней до даты старта с вами свяжется координатор для финальной проверки готовности. За 7 дней до вылета вы обязаны пройти итоговый медицинский чекап и подтвердить участие.
</p>
            <p className="text-lg mt-6">
            <span className="text-xl">Этап 4. Прибытие и инструктаж</span><br />
В день, указанный в договоре, необходимо прибыть в наш центр сбора (адрес направляется после подтверждения тура). Трансфер на космодром осуществляется организованной группой. По прибытии на орбитальный комплекс проводится обязательный инструктаж по:
</p>
<ul className="list-disc pl-6 mt-2 space-y-1">
    <li>технике безопасности в условиях невесомости;</li>
    <li>правилам поведения на борту космического аппарата;</li>
    <li>действиям в нештатных ситуациях;</li>
    <li>использованию систем жизнеобеспечения.</li>
</ul>
<p className="mt-4 text-xl"><span className="text-[#E64A19]">Обратите внимание</span>: программа может быть скорректирована в соответствии с метеоусловиями на космодроме и техническим состоянием носителя. Все изменения доводятся до клиента в приоритетном порядке.</p>
        </div>
    </div>
  )
}

export default HowBooking