'use client'

import { useState } from 'react';
import { mainContent, Main } from "../lib/main-content";
import { Star, X } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [selectedItem, setSelectedItem] = useState<Main | null>(null);

  const openModal = (item: Main) => {
    setSelectedItem(item);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedItem(null);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="bg-black">
      <section className="relative h-screen w-full bg-[url('/images/main-bg.jpg')] bg-cover bg-center bg-no-repeat flex items-center px-4 md:px-15">
        <div className="flex flex-col gap-5">
          <h1 className="text-white z-50 md:text-6xl text-3xl">Открой для себя чудеса галактики!</h1>
          <h2 className="text-gray-200 md:text-4xl text-1xl z-50">Авторские программы от компании “Космомиссия”</h2>
        </div>
      </section>

      <div className="py-10 md:py-30 px-4 md:px-15 w-full flex flex-col items-center justify-center text-center bg-linear-to-b from-[#282828] via-[#5B3887] to-[#0B0C10] gap-6">
        <p className="text-xl md:text-4xl text-white leading-relaxed">
          <span className="text-[#E54CFF] font-bold">Мы </span> 
          - ваш билет за пределы воображения. <br /> 
          Человечество всегда смотрело на звезды с вопросом: «А что, если?». <br /> 
          Сегодня у нас есть ответ.
        </p>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-5xl">
          В то время как другие предлагают теоретические экскурсии, мы приглашаем вас стать частью новой эры — эры, где космические программы перестают быть просто картинками на экране. Вдохновляясь миссиями, открывающими неизведанное, мы создали маршруты, которые изменят ваше представление о реальности.
        </p>
      </div>

      {/* Список программ */}
      <div className="bg-black gap-8">
        {mainContent.map((item) => (
          <div
            key={item.id}
            className="relative w-full bg-cover bg-center bg-no-repeat mt-8"
            style={{ 
              backgroundImage: `url(${item.photo})`
            }}
          >
            {/* Контент по центру */}
            <div className="relative h-full min-h-150 flex flex-col items-center justify-center text-center px-4">
              <h3 className="text-4xl md:text-6xl font-bold text-white mb-4 max-w-4xl">
                {item.title}
              </h3>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl px-4">
                {item.subtitle}
              </p>
              <button
                onClick={() => openModal(item)}
                className="px-8 py-3 bg-transparent border-2 border-white text-white text-lg hover:bg-white hover:text-black transition-all font-semibold tracking-wider cursor-pointer"
              >
                УЗНАТЬ БОЛЬШЕ
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          {/* Модалка */}
          <div className={`relative max-w-4xl w-full overflow-hidden rounded-xl`}
            style={{ background: `linear-gradient(135deg, ${selectedItem.colors[0]}, ${selectedItem.colors[1]}, ${selectedItem.colors[2]})` }}
          >
            
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>

            {/* Контент */}
            <div className="p-8 md:p-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 text-center">
                {selectedItem.title}
              </h2>
              <h3 className="text-xl md:text-2xl text-white mb-6 text-center">
                {selectedItem.subtitle}
              </h3>

              <div className="w-48 h-1 bg-linear-to-r from-purple-600 to-pink-600 mx-auto mb-8"></div>

              {/* Описание */}
              <div className="mb-8">
                <p className="text-white text-lg leading-relaxed text-center max-w-2xl mx-auto">
                  {selectedItem.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    closeModal();
                    window.location.href = '/booking';
                  }}
                  className="px-8 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white text-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold rounded-xl cursor-pointer duration-200"
                >
                  Забронировать
                </button>
                <button
                  onClick={closeModal}
                  className="px-8 py-3 border border-purple-500 text-white text-lg bg-gray-400/60 hover:bg-gray-400/40 transition-all rounded-xl cursor-pointer duration-200"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen w-full bg-[url('/images/planet-top.png')] bg-cover bg-center bg-no-repeat flex flex-col text-white px-4 md:px-10 py-8 md:py-0 mb-10">
  {/* Затемнение для читаемости на мобилках */}
  <div className="absolute inset-0 bg-black/40 md:bg-transparent pointer-events-none" />
  
  <div className="relative z-10">
    <h1 className="text-2xl md:text-4xl mt-8 md:mt-16 text-center font-bold">
      Как проходит система бронирования?
    </h1>
    <p className="text-md md:text-xl text-center text-gray-300 md:text-gray-400 mt-2">
      Путь от выбора маршрута до полёта в космос.
    </p>
    
    {/* Шаг 1 - слева на десктопе, сверху на мобилках */}
    <div className="flex flex-col w-full mt-8 md:mt-12">
      <div className="flex items-start gap-3 md:gap-0">
        
        <p className="text-md md:text-2xl text-left md:max-w-[40%] ml-2 md:ml-0 leading-relaxed">
          1. Узнайте больше о программах и выберите свой маршрут. Вы можете определить количество дней проведённых вне Земли. Также мы предоставляем уникальную возможность составить незабываемое путешествие сразу из нескольких программ!
        </p>
      </div>
    </div>
    
    {/* Шаг 2 - справа на десктопе, по центру на мобилках */}
    <div className="flex flex-col w-full mt-6 md:mt-12">
      <div className="flex items-start gap-3 md:gap-0 md:justify-end">
          
        <p className="text-md md:text-2xl text-left md:text-right md:max-w-[40%] ml-2 md:ml-0 leading-relaxed md:order-1">
          2. Оплатите тур и ждите подтверждение о бронировании, можете ждать даты вашего полёта. За неделю до этого, мы удостоверимся в вашей готовности к невероятному!
        </p>
      </div>
    </div>
    
    {/* Шаг 3 - слева на десктопе, снизу на мобилках */}
    <div className="flex flex-col w-full mt-6 md:mt-12">
      <div className="flex items-start gap-3 md:gap-0">
        
        <p className="text-md md:text-2xl text-left md:max-w-[40%] ml-2 md:ml-0 leading-relaxed">
          3. В назначенную дату мы будем ждать вас у своего центра, откуда отправимся на космодром. Через некоторое время мы окажемся на нашей станции, где вам проведут подробный инструктаж о технике безопасности, правилах нахождения на борту и т.д.
        </p>
      </div>
    </div>

    <h1 className="text-2xl md:text-4xl mt-8 md:mt-16 text-center leading-8 md:leading-14">
      С этого момента, мы начнём <br /> наш тур по необъятной <br /> вселенной!
    </h1>
    <p className="text-md md:text-xl text-center text-gray-300 md:text-gray-400 mt-2">
      Подробнее об этом вы можете узнать <Link href="/how-booking" className="text-[#4FC3F7] hover:opacity-80 duration-150">здесь</Link>
    </p>

  </div>
</div>
    </div>
  );
}