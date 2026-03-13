'use server'

import { hash } from "bcryptjs";
import { prisma } from "../prisma";
import { transporter } from "../email";
import { User } from "../types";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { revalidatePath } from "next/cache";

export type RegisterData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    age: number;
    password: string;
    confirmPassword?: string;
    region?: string;
  }
  
  export async function sendVerificationCode(email: string, code: string) {
    try {
      const mailOptions = {
        from: `"Космическая система" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🚀 Код подтверждения регистрации',
        html: `
          <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0f1e 0%, #1a1f2f 100%); padding: 40px; border-radius: 20px; color: #fff; text-align: center; border: 1px solid #4a4f6e;">
            <div style="margin-bottom: 30px;">
              <span style="font-size: 50px;">🚀</span>
              <h1 style="color: #7b9fe0; margin: 10px 0;">Космическая верификация</h1>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 15px; margin-bottom: 30px; border: 1px solid #4a4f6e;">
              <p style="font-size: 18px; margin-bottom: 20px;">Ваш код доступа к звездам:</p>
              
              <div style="background: linear-gradient(135deg, #7b9fe0, #9b7fe0); padding: 20px; border-radius: 10px; display: inline-block;">
                <span style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: white; font-family: monospace;">${code}</span>
              </div>
              
              <p style="margin-top: 20px; color: #a0a5c0;">Код действителен в течение 15 минут</p>
            </div>
            
            <div style="border-top: 1px solid #4a4f6e; padding-top: 20px;">
              <p style="color: #a0a5c0; font-size: 14px;">
                Если вы не запрашивали этот код, просто проигнорируйте это письмо.<br>
                С вами свяжется центр управления полетами 🌟
              </p>
            </div>
          </div>
        `,
        text: `Ваш код подтверждения: ${code}\nКод действителен в течение 15 минут.`,
      };
  
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { 
        error: 'Не удалось отправить код подтверждения. Попробуйте позже.' 
      };
    }
  }
  
  export async function checkEmail(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });
  
      return { exists: !!user };
    } catch (error) {
      console.error(error);
      return { exists: false, error: 'Ошибка при проверке email' };
    }
  }
  
  export async function createUser(data: RegisterData) {
    try {
      const errors: string[] = [];
  
      if (!data.firstName?.trim()) errors.push("Имя обязательно");
      if (!data.lastName?.trim()) errors.push("Фамилия обязательна");
      if (!data.email?.trim()) errors.push("Email обязателен");
      if (!data.password) errors.push("Пароль обязателен");
      if (!data.phone?.trim()) errors.push("Телефон обязателен");
      if (!data.age) errors.push("Возраст обязателен");
  
      if (errors.length > 0) {
        return { error: errors.join(". ") };
      }
  
      if (data.password.length < 6) {
        return { error: 'Пароль должен содержать минимум 6 символов' };
      }
  
      if (data.confirmPassword && data.password !== data.confirmPassword) {
        return { error: 'Пароли не совпадают' };
      }
  
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return { error: 'Неверный формат email' };
      }
  
      if (data.age < 18 || data.age > 120) {
        return { error: 'Возраст должен быть от 18 до 120 лет' };
      }
  
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });
  
      if (existingUser) {
        return { error: 'Пользователь с таким email уже существует' };
      }
  
      const hashedPassword = await hash(data.password, 12);
  
      const user = await prisma.user.create({
        data: {
          email: data.email.trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          age: data.age,
          phone: data.phone.trim(),
          password: hashedPassword,
          role: 'user',
          region: data.region,
        }
      });
  
      const { password, ...userWithoutPassword } = user;
  
      return {
        success: true,
        user: userWithoutPassword,
        message: 'Регистрация успешна!'
      };
  
    } catch (error: any) {
      console.error(error);
      
      if (error.code === 'P2002') {
        return { error: 'Пользователь с таким email уже существует' };
      }
      
      return { error: 'Произошла ошибка при регистрации. Попробуйте позже.' };
    }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    if (!id) {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        phone: true,
        role: true,
        avatar: true,
        region: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) return null;

    return user as User;
  } catch (error) {
    console.error(error);
    return null;
  }
}
  
  export async function getCurrentUser(): Promise<User | null> {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return null;
      }
  
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            age: true,
            phone: true,
            role: true,
            avatar: true,
            region: true,
            createdAt: true,
            updatedAt: true,
        }
      });
  
      if (!user) return null;
  
      return user as User;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  export async function updateUserProfile(data: {
    userId: string
    firstName: string
    lastName: string
    email: string
    phone: string
    age: number
    region?: string
  }) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: data.userId }
      })
  
      if (!existingUser) {
        return { success: false, error: 'Пользователь не найден' }
      }
  
      if (data.email !== existingUser.email) {
        const userWithEmail = await prisma.user.findUnique({
          where: { email: data.email }
        })
        if (userWithEmail) {
          return { success: false, error: 'Пользователь с таким email уже существует' }
        }
      }
  
      if (data.age < 18 || data.age > 120) {
        return { success: false, error: 'Возраст должен быть от 18 до 120 лет' }
      }
  
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        return { success: false, error: 'Неверный формат email' }
      }
  
      const updatedUser = await prisma.user.update({
        where: { id: data.userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          age: data.age,
          region: data.region,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          age: true,
          phone: true,
          role: true,
          avatar: true,
          region: true,
          createdAt: true,
          updatedAt: true,
        }
      })
  
      revalidatePath(`/profile/${data.userId}`)
      revalidatePath(`/profile/${data.userId}/edit`)
  
      return {
        success: true,
        user: updatedUser
      }
    } catch (error) {
      console.error(error)
      return { success: false, error: 'Не удалось обновить профиль' }
    }
  }