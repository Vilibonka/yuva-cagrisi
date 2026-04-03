# Bir Yuva Bir Dost Backend

Bu klasor, `Bir Yuva Bir Dost` projesinin backend gelistirme ortamini icerir. Amaç, ekipteki herkesin ayni PostgreSQL ortami ile hizli sekilde projeyi ayaga kaldirabilmesidir.

## Bu projede Docker neden kullaniliyor?

Docker'i sadece PostgreSQL icin kullaniyoruz. Boylece herkes ayni veritabani surumu ve ayarlariyla calisir, "bende calisiyor" tipi kurulum farklari azalir.

## Gereksinimler

Asagidaki araclar bilgisayarinizda kurulu olmali:

- Node.js 20 veya ustu
- npm
- Docker
- Docker Compose

Kontrol etmek icin:

```bash
node -v
npm -v
docker -v
docker compose version
```

## Klasor yapisi

```text
backend/
  prisma/
    schema.prisma
  scripts/
    dev-up.sh
    dev-up.ps1
  src/
    app.controller.ts
    app.module.ts
    main.ts
  docker-compose.yml
  nest-cli.json
  package.json
  prisma.config.ts
  tsconfig.build.json
  tsconfig.json
```

## Ilk kurulum

Repo kokunden backend klasorune gecin:

```bash
cd backend
```

### 1. `.env.example` dosyasini `.env` olarak kopyalayin

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux / Git Bash:

```bash
cp .env.example .env
```

### 2. PostgreSQL container'ini baslatin

```bash
docker compose up -d postgres
```

Container loglarini izlemek isterseniz:

```bash
docker compose logs -f postgres
```

### 3. NPM bagimliliklarini kurun

```bash
npm install
```

### 4. Prisma Client uretin

```bash
npx prisma generate
```

Isterseniz package script ile de calistirabilirsiniz:

```bash
npm run prisma:generate
```

### 5. Ilk migration'i olusturun

```bash
npm run prisma:migrate -- --name init
```

Bu komut hem migration dosyasini olusturur hem de veritabanina uygular.

### 6. Prisma Studio'yu acin

```bash
npm run prisma:studio
```

### 7. NestJS backend'i gelistirme modunda calistirin

```bash
npm run start:dev
```

Ardindan tarayicidan veya Postman ile kontrol edebilirsiniz:

```text
http://localhost:3000/
```

Beklenen cevap:

```json
{
  "status": "ok",
  "service": "bir-yuva-bir-dost-backend"
}
```

## Hazir komutlar

```bash
npm run db:up
npm run db:down
npm run db:logs
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:studio
npm run start:dev
```

## Hizli baslangic scriptleri

PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev-up.ps1
```

macOS / Linux / Git Bash:

```bash
bash ./scripts/dev-up.sh
```

Bu scriptler sirasiyla:

- PostgreSQL container'ini baslatir
- `npm install` calistirir
- `npx prisma generate` calistirir
- Sonraki gerekli komutlari ekrana yazar

## Sorun giderme

### 5432 portu zaten kullanimda

Belirti:

- `docker compose up` sirasinda port hatasi alirsiniz

Cozum:

1. Bilgisayarinizda calisan baska bir PostgreSQL servisi varsa durdurun.
2. Gerekirse `docker-compose.yml` icinde sol taraftaki portu degistirin.

Ornek:

```yaml
ports:
  - "5433:5432"
```

Bu durumda `.env` icindeki `DATABASE_URL` de `5433` olacak sekilde guncellenmelidir.

### Docker calismiyor

Belirti:

- `Cannot connect to the Docker daemon`
- `docker compose` komutu container baslatamiyor

Cozum:

1. Docker Desktop kullaniyorsaniz uygulamayi acin.
2. Docker servisinin tamamen ayaga kalkmasini bekleyin.
3. Sonra tekrar deneyin:

```bash
docker compose up -d postgres
```

### Prisma veritabanina baglanamiyor

Kontrol edin:

1. `.env` dosyasi var mi?
2. `DATABASE_URL` dogru mu?
3. PostgreSQL container'i ayakta mi?

Kontrol komutlari:

```bash
docker compose ps
docker compose logs -f postgres
```

Container yeni acildiysa birkac saniye bekleyip tekrar deneyin:

```bash
npx prisma generate
npm run prisma:migrate -- --name init
```

### Migration hatasi aliniyor

Ilk olarak PostgreSQL'in calistigini dogrulayin:

```bash
docker compose logs -f postgres
```

Sonra migration komutunu tekrar deneyin:

```bash
npm run prisma:migrate -- --name init
```

Eger local gelistirme verisini silmekte sorun yoksa, temiz baslangic icin:

```bash
docker compose down -v
docker compose up -d postgres
npm run prisma:migrate -- --name init
```

`down -v` named volume'u sildigi icin local veritabanindaki veriler de silinir. Bunu sadece guvenliyse kullanin.
