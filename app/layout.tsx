import type { Metadata } from "next";
import { Tektur } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const tektur = Tektur({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "КосмоМиссия",
  description: '"КосмоМиссия" - это туристическое агентство, которое отправляет путешественников за пределы атмосферы Земли. Мы предлагаем забронировать туры на Марс, Луну, Юпитер и Сатурн, а также уникальные экспедиции в Пояс астероидов, к центру Млечного Пути и в Туманность Андромеды. Наша цель — сделать межгалактические путешествия доступными для каждого, кто мечтает увидеть Вселенную своими глазами. С нами исполняются мечты о космосе — выбирайте направление и готовьтесь к старту!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${tektur.variable} antialiased bg-black`}
      >
        <Toaster />
        {children}
      </body>
    </html>
  );
}
