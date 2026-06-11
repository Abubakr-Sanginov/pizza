# 🍕 Next Pizza — Инструкция по запуску (RU)

Полноценный интернет-магазин пиццы на **Next.js 14** + **Prisma** + **PostgreSQL**, с админкой, оплатами, push-уведомлениями, Telegram-ботом и мобильным приложением (Expo).

> 📖 English version: [SETUP.en.md](./SETUP.en.md)

---

## 📋 Требования

- **Node.js** 18+ (рекомендуется 20 LTS)
- **PostgreSQL** база данных (подойдёт [Neon](https://neon.tech) — бесплатный serverless Postgres, проект изначально на нём)
- **npm** (идёт вместе с Node.js)

---

## 🚀 Быстрый старт

```bash
# 1. Установить зависимости (заодно сгенерируется Prisma Client)
npm install

# 2. Создать файл .env.local и заполнить его (см. раздел ниже)
#    Скопируйте .env.example или создайте вручную

# 3. Применить схему БД (создаст таблицы)
npm run prisma:push

# 4. Заполнить тестовыми данными (категории, продукты, админ)
npm run prisma:seed

# 5. Запустить в режиме разработки
npm run dev
```

Сайт будет доступен на **http://localhost:3000**

### Production-сборка

```bash
npm run build
npm run start
```

---

## 🔐 Вход в админку

После `npm run prisma:seed` создаётся администратор:

- **URL:** http://localhost:3000/admin/login
- **Email:** `admin@pizza.tg`
- **Пароль:** `111111`

> ⚠️ **Обязательно смените пароль** (или сами данные в `back/prisma/seed.ts`) перед публикацией сайта.

Тестовый покупатель: `user@test.ru` / `111111`.

---

## ⚙️ Переменные окружения (`.env.local`)

Создайте файл `.env.local` в корне проекта. Ниже — что означает каждая переменная. **Обязательные** помечены 🔴, без них сайт не запустится корректно.

### 🔴 База данных (обязательно)
```env
POSTGRES_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://user:pass@host:5432/dbname?sslmode=require
```
- `POSTGRES_URL` — основная строка подключения (для Neon берите **Pooled connection**).
- `POSTGRES_URL_NON_POOLING` — прямое подключение (для миграций). У Neon это connection без `-pooler` в хосте.
- Обязательно добавьте `?sslmode=require` в конце.
- **Если видите ошибку `P1001 Can't reach database` или `the URL must start with postgresql://`** — значит строка пустая/неверная, либо база Neon «уснула» (на бесплатном тарифе просыпается за несколько секунд — повторите запрос).

### 🔴 NextAuth — авторизация (обязательно)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=сгенерируйте_случайную_строку
```
- `NEXTAUTH_URL` — публичный адрес сайта. Локально `http://localhost:3000`, на проде — ваш домен `https://example.com`.
- `NEXTAUTH_SECRET` — секрет для подписи сессий. Сгенерируйте: `openssl rand -base64 32` (или любой длинный случайный набор символов).

### 🔵 SMTP — отправка писем (подтверждение почты)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASS=пароль_приложения
SMTP_FROM=your@email.com
SMTP_SECURE=true
```
- Нужно для подтверждения e-mail при регистрации. Без этого регистрация по почте работать не будет, но сайт запустится.
- Для Gmail используйте **App Password**, а не обычный пароль.

### 🔵 OAuth — вход через соцсети (необязательно)
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
```
- Заполняйте только те, что нужны. Пустые — соответствующая кнопка входа просто не сработает.
- **Google:** [Google Cloud Console](https://console.cloud.google.com) → OAuth credentials.
- **GitHub:** Settings → Developer settings → OAuth Apps.
- **Apple:** Service ID + JWT из `.p8` ключа. Сгенерировать секрет: https://bal.so/apple-gen-secret

### 🟢 Telegram-бот (РАБОТАЕТ ✅)
```env
TELEGRAM_BOT_TOKEN=токен_от_BotFather
TELEGRAM_CHAT_ID=id_чата_для_уведомлений
```
- `TELEGRAM_BOT_TOKEN` — получить у [@BotFather](https://t.me/BotFather).
- `TELEGRAM_CHAT_ID` — ID чата/группы, куда бот шлёт уведомления о заказах.
- Запуск бота: `npm run bot` (см. раздел «Telegram-боты» ниже).

### 🟢 Push-уведомления (Web Push / VAPID)
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:no-reply@example.com
```
- Нужно для web-push (уведомления в браузере) и рассылки из админки.
- Сгенерировать ключи: `npx web-push generate-vapid-keys`
- Без них push просто отключится (сайт работает, в логах будет предупреждение).

### 🟡 Оплата через Telegram-бота (РАБОТАЕТ ✅)
```env
PAYMENTS_BOT_TOKEN=токен_платёжного_бота
PAYMENTS_BOT_USERNAME=username_бота_без_@
PAYMENTS_ADMIN_CHAT_ID=chat_id_админа
PAYMENT_INTERNAL_SECRET=случайная_строка
NEXT_PUBLIC_SITE_URL=https://example.com
PAYMENT_CARD_NUMBER=номер_карты
PAYMENT_RECEIVER_NAME=Имя получателя
PAYMENT_RECEIVER_PHONE=телефон
PAYMENT_BANK_NAME=Название банка
STARS_FEE_PERCENT=10
STAR_PRICE_TJS=1.5
```
- Платёжный бот принимает оплату (в т.ч. Telegram Stars) и подтверждает заказы.
- Запуск: `npm run bot:payments`
- `PAYMENT_INTERNAL_SECRET` — общий секрет между сайтом и ботом (любая длинная случайная строка).
- `STARS_FEE_PERCENT` / `STAR_PRICE_TJS` — настройки оплаты звёздами Telegram.

### 🟠 iiko Cloud — интеграция с системой ресторана (⚠️ НЕ ПРОТЕСТИРОВАНО)
```env
IIKO_API_LOGIN=
IIKO_ORGANIZATION_ID=
IIKO_TERMINAL_GROUP_ID=
IIKO_PAYMENT_TYPE_ID_CASH=
IIKO_PAYMENT_TYPE_ID_CARD=
IIKO_WEBHOOK_SECRET=
IIKO_API_URL=https://api-ru.iiko.services/api/1
IIKO_REQUEST_TIMEOUT_MS=15000
IIKO_MAX_RETRIES=2
CRON_SECRET=случайная_строка
```
> ⚠️ **ВНИМАНИЕ:** интеграция с iiko написана, но **автор её не тестировал на реальном аккаунте iiko** — она может не работать или работать некорректно. Используйте на свой риск и тщательно проверьте перед боевым использованием.
>
> **Если iiko вам не нужен — просто оставьте `IIKO_API_LOGIN` пустым.** Интеграция автоматически отключится, на работу остального сайта это никак не влияет.

- `IIKO_API_LOGIN` — главный API-ключ из личного кабинета iiko Cloud. Пустой = интеграция выключена.
- `CRON_SECRET` — секрет для cron-эндпоинтов (`/api/iiko/poll-orders`, `/retry-orders`, `/sync-stoplist`).

### 🟢 AI-перевод контента (Google Gemini)
```env
GEMINI_API_KEY=
```
- Нужен для кнопки «AI-перевод» в админке (автоперевод названий товаров на таджикский/английский).
- Получить ключ: [Google AI Studio](https://aistudio.google.com/app/apikey)
- Без него кнопка перевода не работает, остальное работает.

### Прочее
```env
NEXT_PUBLIC_API_URL=/api
```
- Базовый путь к API. Оставьте `/api`.

---

## 🤖 Telegram-боты

В проекте два бота (запускаются отдельными процессами):

| Команда | Что делает |
|---------|-----------|
| `npm run bot` | Основной бот — уведомления о заказах в Telegram |
| `npm run bot:payments` | Платёжный бот — приём оплаты и подтверждение заказов |

На сервере их обычно запускают через `pm2` или как отдельные сервисы, чтобы работали постоянно.

---

## 🌍 Мультиязычность

Сайт и админка переведены на **3 языка**: русский 🇷🇺, таджикский 🇹🇯, английский 🇬🇧. Переключатель языка — в шапке сайта. Тексты лежат в `shared/locales/{ru,tg,en}.json`.

---

## 📱 Мобильное приложение (Expo)

В папке `NextApp/` — мобильное приложение на React Native (Expo). Для push-уведомлений на Android нужен `google-services.json` из Firebase (положить в `NextApp/google-services.json`). Подробности — в `NextApp/`.

---

## 🛠 Полезные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Production-сборка |
| `npm run start` | Запуск production-сборки |
| `npm run prisma:push` | Применить схему БД (создать таблицы) |
| `npm run prisma:seed` | Заполнить БД тестовыми данными |
| `npm run prisma:studio` | Открыть Prisma Studio (визуальный редактор БД) |
| `npm run bot` | Запустить основной Telegram-бот |
| `npm run bot:payments` | Запустить платёжный бот |

---

## ❓ Частые проблемы

- **`P1001 Can't reach database`** — база недоступна. Проверьте `POSTGRES_URL`; если это Neon на бесплатном тарифе — база «спит», повторите запрос через несколько секунд.
- **`the URL must start with postgresql://`** — переменная `POSTGRES_URL` пустая или неправильная.
- **`createContext is not a function` при сборке** — должно быть исправлено; если появилось снова, убедитесь что серверный код не импортирует клиентский `react-i18next`.
- **Push не отправляется / предупреждение про VAPID** — не заданы `NEXT_PUBLIC_VAPID_PUBLIC_KEY` и `VAPID_PRIVATE_KEY`.
- **Не приходят письма** — проверьте SMTP-настройки (для Gmail нужен App Password).

---

## ✅ Минимум для запуска «чтобы просто заработало»

Чтобы сайт поднялся локально, достаточно заполнить:
1. `POSTGRES_URL` + `POSTGRES_URL_NON_POOLING`
2. `NEXTAUTH_URL` + `NEXTAUTH_SECRET`

Остальное (SMTP, OAuth, боты, оплаты, iiko, push, AI) подключайте по мере необходимости.
