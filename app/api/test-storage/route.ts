import { NextResponse } from 'next/server';

export async function GET() {
  // Проверяем формат ключей (без отправки самих ключей)
  const accessKey = process.env.YANDEX_ACCESS || '';
  const secretKey = process.env.YANDEX_SECRET || '';
  
  return NextResponse.json({
    message: 'Проверка формата ключей',
    accessKey: {
      length: accessKey.length,
      prefix: accessKey.substring(0, 4),
      format: accessKey.startsWith('YCAJ') ? '✅ Правильный формат (YCAJ...)' : '❌ Неправильный формат (должен начинаться с YCAJ)',
      hasSpecialChars: /[^a-zA-Z0-9]/.test(accessKey) ? '⚠️ Содержит спецсимволы' : '✅ Только буквы и цифры'
    },
    secretKey: {
      length: secretKey.length,
      prefix: secretKey.substring(0, 4),
      format: secretKey.startsWith('YCM') ? '✅ Правильный формат (YCM...)' : '❌ Неправильный формат (должен начинаться с YCM)',
      hasSpecialChars: /[^a-zA-Z0-9]/.test(secretKey) ? '⚠️ Содержит спецсимволы' : '✅ Только буквы и цифры'
    },
    envVars: {
      YANDEX_ACCESS: process.env.YANDEX_ACCESS ? 'установлен' : 'ОТСУТСТВУЕТ',
      YANDEX_SECRET: process.env.YANDEX_SECRET ? 'установлен' : 'ОТСУТСТВУЕТ',
      YANDEX_BUCKET: process.env.YANDEX_BUCKET || 'не указан',
    }
  });
}