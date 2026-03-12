'use server'

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

const s3Client = new S3Client({
  endpoint: process.env.YANDEX_ENDPOINT?.trim() || "https://storage.yandexcloud.net",
  region: process.env.YANDEX_REGION || "ru-central1",
  credentials: {
    accessKeyId: process.env.YANDEX_ACCESS!,
    secretAccessKey: process.env.YANDEX_SECRET!,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.YANDEX_BUCKET!;

export interface MedicalCertificate {
  id: string;
  passengerId: string;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  uploadDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
}

// Функция для проверки типа файла
function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

// Основная функция загрузки файла (как в вашем примере)
export async function uploadCertificateFile(
  file: File,
  passengerId: string
): Promise<{ fileKey: string; fileUrl: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Получаем расширение файла
  const ext = file.name.split('.').pop()?.toLowerCase() || 
    (isImageFile(file) ? 'jpg' : 'pdf');
  
  // Проверяем допустимые расширения
  const safeExt = isImageFile(file) 
    ? ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
    : isPdfFile(file) 
      ? 'pdf'
      : 'pdf'; // По умолчанию для других типов
  
  // Генерируем уникальный ключ (как в вашем примере)
  const fileKey = `medical-certificates/${passengerId}/${Date.now()}-${randomBytes(6).toString('hex')}.${safeExt}`;

  // Загружаем файл (как в вашем примере)
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
    })
  );

  // Формируем URL (как в вашем примере)
  const fileUrl = `https://storage.yandexcloud.net/${BUCKET_NAME}/${fileKey}`;

  return { fileKey, fileUrl };
}

// Генерация подписи для скачивания файла
export async function generateDownloadUrl(fileKey: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  try {
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return downloadUrl;
  } catch (error) {
    console.error('Ошибка генерации ссылки для скачивания:', error);
    throw new Error('Не удалось сгенерировать ссылку для скачивания');
  }
}

// Удаление файла
export async function deleteFile(fileKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  try {
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    throw new Error('Не удалось удалить файл');
  }
}

// Получение публичного URL
export async function getPublicUrl(fileKey: string): Promise<string> {
  return `https://storage.yandexcloud.net/${BUCKET_NAME}/${fileKey}`;
}