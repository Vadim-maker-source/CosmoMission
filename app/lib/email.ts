import nodemailer from 'nodemailer';
import { SPACE_PATHS } from './ways';
import { getCurrentUser } from './api/user';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const ADMIN_EMAIL = process.env.GMAIL_USER;

export async function sendAdminNotification(booking: any, user: any) {
  const routeNames = booking.routeIds.map((id: string) => {
    const path = SPACE_PATHS.find((p: any) => p.id === id);
    return path ? `${path.icon} ${path.name}` : id;
  }).join(' → ');

  const passengersList = booking.passengers.map((p: any) => 
    `👤 ${p.lastName} ${p.firstName} ${p.middleName || ''} (${new Date(p.birthDate).toLocaleDateString('ru-RU')})`
  ).join('\n');

  const mailOptions = {
    from: `"Космическая система" <${process.env.GMAIL_USER}>`,
    to: ADMIN_EMAIL,
    subject: `🚀 Новое бронирование! ${booking.bookingNumber}`,
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0f1e 0%, #1a1f2f 100%); padding: 40px; border-radius: 20px; color: #fff; text-align: center; border: 1px solid #4a4f6e;">
        <div style="margin-bottom: 30px;">
          <span style="font-size: 50px;">🚀</span>
          <h1 style="color: #7b9fe0; margin: 10px 0;">Новое космическое бронирование</h1>
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #4a4f6e; text-align: left;">
          <h2 style="color: #7b9fe0; margin-top: 0;">Номер бронирования: ${booking.bookingNumber}</h2>
          
          <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
            <h3 style="color: #fff; margin-top: 0;">👨‍🚀 Информация о клиенте</h3>
            <p><strong>Имя:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Телефон:</strong> ${user.phone}</p>
          </div>
          
          <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
            <h3 style="color: #fff; margin-top: 0;">🌍 Маршрут</h3>
            <p style="font-size: 16px;">${routeNames}</p>
            <p><strong>Дата вылета:</strong> ${new Date(booking.departureDate).toLocaleString('ru-RU')} (МСК)</p>
          </div>
          
          <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
            <h3 style="color: #fff; margin-top: 0;">👥 Пассажиры (${booking.passengers.length})</h3>
            <pre style="color: #a0a5c0; font-family: inherit; white-space: pre-wrap;">${passengersList}</pre>
          </div>
          
          ${booking.notes ? `
            <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
              <h3 style="color: #fff; margin-top: 0;">📝 Пожелания</h3>
              <p style="color: #a0a5c0;">${booking.notes}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/admin/bookings/${booking.id}" 
               style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #7b9fe0, #9b7fe0); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Перейти к бронированию →
            </a>
          </div>
        </div>
        
        <div style="border-top: 1px solid #4a4f6e; padding-top: 20px;">
          <p style="color: #a0a5c0; font-size: 14px;">
            Это автоматическое уведомление. Для управления бронированием перейдите в админ-панель.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email уведомление отправлено админу');
  } catch (error) {
    console.error(error);
  }
}

export async function sendSupportMessageAction(formData: FormData) {
  try {
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const userId = formData.get('userId') as string
    const userEmail = formData.get('userEmail') as string
    const userName = formData.get('userName') as string

    if (!subject || !message) {
      return { success: false, error: 'Заполните тему и сообщение' }
    }

    let email = userEmail
    let name = userName

    // Если есть userId, получаем свежие данные пользователя
    if (userId) {
      const user = await getCurrentUser()
      if (user) {
        email = user.email
        name = `${user.firstName} ${user.lastName}`
      }
    }

    if (!email) {
      return { success: false, error: 'Email не указан' }
    }

    // Определяем тему письма
    const subjectMap: { [key: string]: string } = {
      booking: 'Вопрос о бронировании',
      documents: 'Вопрос о документах',
      medical: 'Вопрос о медицинской справке',
      technical: 'Техническая проблема',
      other: 'Другое'
    }

    const subjectText = subjectMap[subject] || subject
    const ADMIN_EMAIL = process.env.GMAIL_USER

    // Отправляем email администратору
    const adminMailOptions = {
      from: `"Космическая система" <${process.env.GMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `🚀 Обращение в поддержку: ${subjectText}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0f1e 0%, #1a1f2f 100%); padding: 40px; border-radius: 20px; color: #fff; text-align: center; border: 1px solid #4a4f6e;">
          <div style="margin-bottom: 30px;">
            <span style="font-size: 50px;">🚀</span>
            <h1 style="color: #7b9fe0; margin: 10px 0;">Новое обращение в поддержку</h1>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #4a4f6e; text-align: left;">
            <h2 style="color: #7b9fe0; margin-top: 0;">Тема: ${subjectText}</h2>
            
            <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
              <h3 style="color: #fff; margin-top: 0;">👤 Информация о пользователе</h3>
              <p><strong>Имя:</strong> ${name || 'Не указано'}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${userId ? `<p><strong>ID пользователя:</strong> ${userId}</p>` : ''}
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
              <h3 style="color: #fff; margin-top: 0;">📝 Сообщение</h3>
              <p style="color: #a0a5c0; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #4a4f6e; padding-top: 20px;">
            <p style="color: #a0a5c0; font-size: 14px;">
              Ответьте пользователю на указанный email.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(adminMailOptions)

    // Отправляем подтверждение пользователю
    const userMailOptions = {
      from: `"Космическая система" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `✅ Ваше обращение получено: ${subjectText}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0f1e 0%, #1a1f2f 100%); padding: 40px; border-radius: 20px; color: #fff; text-align: center; border: 1px solid #4a4f6e;">
          <div style="margin-bottom: 30px;">
            <span style="font-size: 50px;">✅</span>
            <h1 style="color: #7b9fe0; margin: 10px 0;">Ваше обращение получено!</h1>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #4a4f6e; text-align: left;">
            <p style="color: #a0a5c0;">Здравствуйте${name ? ', ' + name : ''}!</p>
            <p style="color: #a0a5c0;">Мы получили ваше обращение в службу поддержки.</p>
            <p style="color: #a0a5c0;"><strong>Тема:</strong> ${subjectText}</p>
            <p style="color: #a0a5c0;"><strong>Ваше сообщение:</strong></p>
            <p style="color: #fff; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">${message}</p>
            <p style="color: #a0a5c0; margin-top: 20px;">Мы ответим вам в ближайшее время (обычно в течение 2 часов).</p>
          </div>
          
          <div style="border-top: 1px solid #4a4f6e; padding-top: 20px;">
            <p style="color: #a0a5c0; font-size: 14px;">
              С уважением, команда "Космомиссия" 🚀
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(userMailOptions)

    return { success: true }
  } catch (error) {
    console.error('Ошибка отправки обращения:', error)
    return { success: false, error: 'Не удалось отправить сообщение' }
  }
}