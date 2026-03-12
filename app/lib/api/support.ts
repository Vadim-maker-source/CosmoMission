'use server'

import { transporter } from '../email'

export async function sendSupportMessage(formData: FormData) {
  try {
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const userId = formData.get('userId') as string
    const userEmail = formData.get('userEmail') as string
    const userName = formData.get('userName') as string

    if (!subject || !message) {
      return { success: false, error: 'Заполните тему и сообщение' }
    }

    if (!userEmail) {
      return { success: false, error: 'Email не указан' }
    }

    const subjectMap: { [key: string]: string } = {
      booking: 'Вопрос о бронировании',
      documents: 'Вопрос о документах',
      medical: 'Вопрос о медицинской справке',
      technical: 'Техническая проблема',
      other: 'Другое'
    }

    const subjectText = subjectMap[subject] || subject
    const ADMIN_EMAIL = process.env.GMAIL_USER

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
              <p><strong>Имя:</strong> ${userName || 'Не указано'}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              ${userId ? `<p><strong>ID пользователя:</strong> ${userId}</p>` : '<p><strong>Тип:</strong> Гость</p>'}
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

    const userMailOptions = {
      from: `"Космическая система" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: `✅ Ваше обращение получено: ${subjectText}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0f1e 0%, #1a1f2f 100%); padding: 40px; border-radius: 20px; color: #fff; text-align: center; border: 1px solid #4a4f6e;">
          <div style="margin-bottom: 30px;">
            <span style="font-size: 50px;">✅</span>
            <h1 style="color: #7b9fe0; margin: 10px 0;">Ваше обращение получено!</h1>
          </div>
          
          <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #4a4f6e; text-align: left;">
            <p style="color: #a0a5c0;">Здравствуйте${userName ? ', ' + userName : ''}!</p>
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