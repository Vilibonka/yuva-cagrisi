# Bir Yuva Bir Dost Mobile

Expo + React Native mobil MVP. İlk hedef Android geliştirme akışıdır.

## Kurulum

```bash
npm install
```

Fiziksel Android cihaz için `mobile/.env` oluşturup backend URL'ini PC'nin LAN IP adresiyle verin:

```text
EXPO_PUBLIC_API_URL=http://<PC-LAN-IP>:3000
```

Android emulator için:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

## Çalıştırma

```bash
npm run android
```

Backend'in `backend/.env` dosyasındaki `PORT=3000` ile çalıştığından emin olun.
