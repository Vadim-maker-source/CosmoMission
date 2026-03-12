'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "../prisma"
import { deleteFile, generateDownloadUrl, uploadCertificateFile } from "../yandex-storage"
import { getCurrentUser } from "./user"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { randomBytes } from "crypto"
import { sendAdminNotification } from "../email"
import { SPACE_PATHS } from "../ways"

export type MedicalCertificate = {
  id: string
  passengerId: string
  fileName: string
  fileKey: string
  fileUrl: string
  fileSize: number
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  uploadDate: Date
}

export type Passenger = {
  id: string
  firstName: string
  lastName: string
  middleName: string | null
  birthDate: Date
  phone: string
  email: string | null
  passportSeries: string
  passportNumber: string
  passportIssuedBy: string
  passportIssuedAt: Date
  passportCode: string | null
  isMainContact: boolean
  bookingId: string
  medicalCertificates: MedicalCertificate[]
}

export type Booking = {
  id: string
  bookingNumber: string
  userId: string
  routeIds: string[]
  durations: { [key: string]: number }
  departureDate: Date
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED'
  totalPassengers: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
  confirmedAt: Date | null
  cancelledAt: Date | null
  passengers: Passenger[]
}

export async function createBooking(data: {
  userId: string
  routeIds: string[]
  durations: { [key: string]: number }
  departureDate: Date
  mainPassenger: any
  additionalPassengers: any[]
  notes?: string
}) {
  try {
    const bookingNumber = `COSMOS-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    const allPassengers = [data.mainPassenger, ...data.additionalPassengers]
    for (const passenger of allPassengers) {
      const birthDate = new Date(passenger.birthDate)
      const age = new Date().getFullYear() - birthDate.getFullYear()
      if (age < 18) {
        return {
          success: false,
          error: 'Все пассажиры должны быть старше 18 лет'
        }
      }
    }
    
    for (const [stationId, days] of Object.entries(data.durations)) {
      if (days > 2) {
        return {
          success: false,
          error: `На станции можно находиться не более 2 земных дней`
        }
      }
    }
    
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        userId: data.userId,
        routeIds: data.routeIds,
        durations: data.durations,
        departureDate: data.departureDate,
        totalPassengers: allPassengers.length,
        notes: data.notes,
        passengers: {
          create: allPassengers.map((p, index) => ({
            isMainContact: index === 0,
            firstName: p.firstName,
            lastName: p.lastName,
            middleName: p.middleName,
            birthDate: new Date(p.birthDate),
            phone: p.phone,
            email: p.email,
            passportSeries: p.passportSeries,
            passportNumber: p.passportNumber,
            passportIssuedBy: p.passportIssuedBy,
            passportIssuedAt: new Date(p.passportIssuedAt),
            passportCode: p.passportCode,
          }))
        }
      },
      include: {
        user: true,
        passengers: {
          include: {
            medicalCertificates: true
          }
        }
      }
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });
    
    if (admins.length > 0) {
      for (const admin of admins) {
        await sendAdminNotification(booking, admin);
      }
    }

    revalidatePath('/profile/bookings')
    
    return {
      success: true,
      bookingNumber: booking.bookingNumber,
      booking: booking as unknown as Booking
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      error: 'Не удалось создать бронирование'
    }
  }
}

export async function calculateTotalPrice(
  routeIds: string[],
  durations: { [key: string]: number },
  passengersCount: number
): Promise<number> {
  let total = 0;
  
  for (const stationId of routeIds) {
    const station = SPACE_PATHS.find(p => p.id === stationId);
    const days = durations[stationId] || 1;
    if (station) {
      total += station.price * days * passengersCount;
    }
  }
  
  return total;
}  
  
export async function getUserBookings(userId: string): Promise<{ success: boolean; bookings?: Booking[]; error?: string }> {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        passengers: {
          include: {
            medicalCertificates: {
              orderBy: { uploadDate: 'desc' }
            }
          }
        }
      },
      orderBy: { departureDate: 'desc' }
    })
  
    return { success: true, bookings: bookings as unknown as Booking[] }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Не удалось получить бронирования' }
  }
}

export async function getBookingById(bookingId: string, userId?: string): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  try {
    const user = await getCurrentUser();
    
    let booking;
    
    if (user?.role === 'ADMIN') {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          passengers: {
            include: {
              medicalCertificates: {
                orderBy: { uploadDate: 'desc' }
              }
            }
          },
          user: true
        }
      });
    } else if (userId) {
      booking = await prisma.booking.findFirst({
        where: { 
          id: bookingId,
          userId 
        },
        include: {
          passengers: {
            include: {
              medicalCertificates: {
                orderBy: { uploadDate: 'desc' }
              }
            }
          },
          user: true
        }
      });
    } else {
      return { success: false, error: 'Не указан ID пользователя' };
    }

    if (!booking) {
      return { success: false, error: 'Бронирование не найдено' };
    }

    return { success: true, booking: booking as unknown as Booking };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Не удалось получить бронирование' };
  }
}

export async function cancelBooking(bookingId: string, userId: string): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  try {
    const booking = await prisma.booking.findFirst({
      where: { 
        id: bookingId,
        userId 
      }
    })

    if (!booking) {
      return { success: false, error: 'Бронирование не найдено' }
    }

    const now = new Date()
    const departureDate = new Date(booking.departureDate)
    const daysUntilDeparture = Math.ceil((departureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDeparture < 7) {
      return { 
        success: false, 
        error: 'Отмена возможна не менее чем за 7 дней до вылета' 
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: now
      },
      include: {
        passengers: {
          include: {
            medicalCertificates: true
          }
        }
      }
    })

    revalidatePath('/profile/bookings')
    revalidatePath('/admin/bookings')
    return { success: true, booking: updatedBooking as unknown as Booking }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Не удалось отменить бронирование' }
  }
}

const s3Client = new S3Client({
  endpoint: process.env.YANDEX_ENDPOINT?.trim(),
  region: process.env.YANDEX_REGION,
  credentials: {
    accessKeyId: process.env.YANDEX_ACCESS!,
    secretAccessKey: process.env.YANDEX_SECRET!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.YANDEX_BUCKET!;

export async function uploadCertificateAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Необходима авторизация' };
    }

    const passengerId = formData.get('passengerId') as string;
    const file = formData.get('file') as File;

    if (!passengerId || !file) {
      return { success: false, error: 'Недостаточно данных' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Файл превышает 5 МБ' };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Недопустимый формат файла' };
    }

    const passenger = await prisma.passenger.findFirst({
      where: {
        id: passengerId,
        booking: { userId: user.id }
      }
    });

    if (!passenger) {
      return { success: false, error: 'Пассажир не найден' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const ext = file.name.split('.').pop()?.toLowerCase() || 
      (file.type.startsWith('image/') ? 'jpg' : 'pdf');
    
    const safeExt = file.type.startsWith('image/') 
      ? ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
      : 'pdf';
    
    const key = `medical-certificates/${passengerId}/${Date.now()}-${randomBytes(6).toString('hex')}.${safeExt}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );
    } catch (error) {
      return { 
        success: false, 
        error: `Ошибка S3: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
      };
    }

    const fileUrl = `https://storage.yandexcloud.net/${BUCKET_NAME}/${key}`;

    const certificate = await prisma.medicalCertificate.create({
      data: {
        passengerId,
        fileName: file.name,
        fileKey: key,
        fileUrl,
        fileSize: file.size,
        status: 'pending'
      }
    });

    revalidatePath('/profile/bookings');
    revalidatePath('/admin/bookings');

    return { success: true, certificate };
  } catch (error) {
    console.error(error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ошибка загрузки' 
    };
  }
}

export async function uploadMedicalCertificate(
  passengerId: string,
  file: File
): Promise<{ success: boolean; certificate?: any; error?: string }> {
  try {
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return { 
        success: false, 
        error: `Файл "${file.name}" превышает лимит 5 МБ` 
      };
    }
    
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp', 
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return { 
        success: false, 
        error: `Недопустимый формат файла "${file.name}". Разрешены: JPG, PNG, WebP, PDF` 
      };
    }

    const { fileKey, fileUrl } = await uploadCertificateFile(file, passengerId);

    const certificate = await prisma.medicalCertificate.create({
      data: {
        passengerId,
        fileName: file.name,
        fileKey,
        fileUrl,
        fileSize: file.size,
        status: 'pending'
      }
    });

    return { 
      success: true, 
      certificate 
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Не удалось загрузить справку' };
  }
}

export async function confirmMedicalCertificateUpload(certificateId: string): Promise<{ success: boolean; certificate?: any; error?: string }> {
  try {
    const certificate = await prisma.medicalCertificate.update({
      where: { id: certificateId },
      data: { status: 'approved' }
    })

    revalidatePath('/profile/bookings')
    revalidatePath('/admin/bookings')
    return { success: true, certificate }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Не удалось подтвердить загрузку' }
  }
}

export async function deleteMedicalCertificate(certificateId: string, fileKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteFile(fileKey)
    await prisma.medicalCertificate.delete({
      where: { id: certificateId }
    })

    revalidatePath('/profile/bookings')
    revalidatePath('/admin/bookings')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Не удалось удалить справку' }
  }
}

export async function getCertificateDownloadUrl(fileKey: string): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  try {
    const downloadUrl = await generateDownloadUrl(fileKey)
    return { success: true, downloadUrl }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Не удалось получить ссылку' }
  }
}

export async function getAllBookings(): Promise<{ success: boolean; bookings?: Booking[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Доступ запрещен' }
    }

    const bookings = await prisma.booking.findMany({
      include: {
        passengers: {
          include: {
            medicalCertificates: {
              orderBy: { uploadDate: 'desc' }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, bookings: bookings as unknown as Booking[] }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Не удалось получить бронирования' }
  }
}

export async function approveMedicalCertificate(certificateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Доступ запрещен' }
    }

    await prisma.medicalCertificate.update({
      where: { id: certificateId },
      data: { status: 'approved' }
    })

    revalidatePath('/admin/bookings')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Не удалось одобрить справку' }
  }
}

export async function rejectMedicalCertificate(certificateId: string, comment: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Доступ запрещен' }
    }

    await prisma.medicalCertificate.update({
      where: { id: certificateId },
      data: { 
        status: 'rejected',
        comment 
      }
    })

    revalidatePath('/admin/bookings')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Не удалось отклонить справку' }
  }
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return { success: false, error: 'Доступ запрещен' }
    }

    const updateData: any = { status }
    
    if (status === 'CONFIRMED') {
      updateData.confirmedAt = new Date()
    } else if (status === 'CANCELLED') {
      updateData.cancelledAt = new Date()
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: updateData
    })

    revalidatePath('/admin/bookings')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Не удалось обновить статус' }
  }
}