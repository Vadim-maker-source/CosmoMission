'use client'

import { ForwardIcon } from "lucide-react"
import { useState } from "react"

const Bottombar = () => {
  const [isOpen, setIsOpen] = useState(false)

    const toggleBar = () => {
        setIsOpen((prev) => !prev)
    }

    const openYandexMaps = () => {
      const address = encodeURIComponent('г.Липецк ул. Космонавтов, 20/3')
      const url = `https://yandex.ru/maps/?text=${address}`
      window.open(url, '_blank', 'noopener,noreferrer')
  }
  return (
    <div className="fixed hidden md:block">
      <button 
                onClick={toggleBar} 
                className={`fixed duration-400 right-5 px-3 py-3 bg-gray-400 rounded-full cursor-pointer hover:bg-gray-500 text-white z-50 ${
                    isOpen ? "bottom-33" : "bottom-5"
                }`}
            >
                <ForwardIcon className={`${isOpen ? "rotate-180" : ""} w-8`} />
            </button>
        <div className={`
                w-full fixed left-0 right-0 
                flex items-center justify-around 
                bg-[#282828] py-4 z-40
                transition-all duration-500 ease-in-out
                ${isOpen ? "translate-y-0 bottom-0" : "translate-y-full bottom-0"}
            `}>
            <div className="flex flex-col gap-4">
              <img src="/images/logo2.png" alt="Логотип" className="w-10 lg:w-12 aspect-square" />
              <p>Автономная некоммерческая организация содействия космическому туризму “Космомиссия”.</p>
            </div>

            <div className="flex flex-col items-start">
                    <p className="text-lg font-bold text-gray-800 mb-1">По всем вопросам:</p>
                    <p className="text-lg text-left hover:text-[#FF7340] transition-colors cursor-pointer">
                        Vadimbureev380@yandex.ru
                    </p>
                </div>
                
                <div className="flex flex-col items-start">
                    <p className="text-lg font-bold text-gray-800 mb-1">Телефон:</p>
                    <p className="text-lg hover:text-[#FF7340] transition-colors cursor-pointer">
                        +7 (920) 545-08-62
                    </p>
                </div>
                
                <div className="flex flex-col items-start">
                    <p className="text-lg font-bold text-gray-800 mb-1">Наш адрес:</p>
                    <button
                        onClick={openYandexMaps}
                        className="text-lg text-left hover:text-[#FF7340] transition-colors cursor-pointer group flex items-center"
                    >
                        <span>г.Липецк ул. Космонавтов, 20/3</span>
                        <svg 
                            className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                        >
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
        </div>
    </div>
  )
}

export default Bottombar