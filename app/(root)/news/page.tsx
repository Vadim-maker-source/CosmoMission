import { news } from '@/app/lib/news'
import { ArrowLeft, Star } from 'lucide-react'
import Link from 'next/link'

const News = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-12">
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
                    className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-100 mb-6 transition-colors ml-4"
                  >
                    <ArrowLeft size={20} />
                    На главную
                  </Link>
      <section 
        className="relative h-screen w-full bg-cover bg-center bg-no-repeat items-center px-4 md:px-15 hidden md:flex"
        style={{ backgroundImage: "url('/images/newsgroup.png')" }}
      >
      </section>

      <div className="w-full flex justify-center text-white md:hidden">
          <h1 className="text-4xl">Новости</h1>
      </div>

      <div>
        {news.map((item, index) => (
            <div key={index} className="w-full bg-[#9636A6]/70 flex flex-col md:flex-row items-center px-16 py-8 md:py-4 mt-10">
                <img src={item.photo} alt={index.toString()} className="rounded-xl block md:hidden" />
                <div className="flex flex-col items-start md:px-16 gap-10 mt-6 md:mt-0">
                    <p className="text-white text-xl">{item.text}</p>
                    <Link href={item.link}><button className="py-3 px-12 bg-[#EE4C19] rounded-xl text-white text-lg cursor-pointer hover:opacity-80 duration-200">Узнать больше</button></Link>
                </div>
                <img src={item.photo} alt={index.toString()} className="rounded-xl hidden md:block" />
            </div>
        ))}
      </div>
    </div>
  )
}

export default News