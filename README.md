# CookBook

CookBook — reseptləri tapmaq, hazırlamaq və öz reseptlərini saxlamaq üçün Next.js tətbiqidir.

## İmkanlar

- TheMealDB-dən resept axtarışı və kateqoriyalara baxış
- Resept detalları, ərzaq siyahısı və hazırlanma addımları
- Firebase Authentication ilə qeydiyyat və giriş
- Şəxsi resept yaratmaq və Firestore-da saxlamaq
- İstifadəçinin öz reseptlərini görmək və silmək
- Mobil ekranlara uyğun görünüş

## Tələblər

- Node.js və npm
- Firebase layihəsi
- İnternet bağlantısı (TheMealDB reseptləri üçün)

## Quraşdırma və işə salma

Layihənin kök qovluğunda terminal açıb əmrləri icra edin:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Sonra brauzerdə `http://localhost:3000` ünvanını açın.

## Firebase sazlaması

1. Firebase Console-da `akaprimexl` layihəsinin Web tətbiq parametrlərini əldə edin.
2. `.env.local` faylındakı dəyişənləri öz Firebase Web app konfiqurasiyanızla doldurun:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

3. Firebase Authentication-da Email/Password giriş üsulunu aktiv edin.
4. Cloud Firestore bazasının yaradıldığını yoxlayın.
5. Firestore qaydalarını Firebase Console-da yayımlayın. Layihədəki `firestore.rules` qaydaları daxil olmuş istifadəçilərə yalnız `ownerId` sahəsi öz UID-lərinə uyğun gələn reseptləri oxumaq, əlavə etmək, yeniləmək və silmək imkanı verir.

Firebase CLI quraşdırılıb və `firebase login` ilə daxil olmusunuzsa, layihənin kök qovluğundan qaydaları belə yayımlaya bilərsiniz:

```powershell
firebase deploy --only firestore:rules
```

Qayda yayımlanmadan Firestore əməliyyatları `permission-denied` xətası verə bilər. Resept yaratmaq üçün əvvəlcə tətbiqdə hesaba daxil olmaq lazımdır.

## Əsas səhifələr

| Ünvan | Təsvir |
| --- | --- |
| `/` | Ana səhifə və yemək kateqoriyaları |
| `/reseptler` | Resept axtarışı və siyahısı |
| `/reseptler/[id]` | Resept detalları |
| `/resept-yarat` | Şəxsi resept yaratma və idarəetmə |
| `/login` | Hesaba giriş |
| `/register` | Yeni hesab yaratma |
| `/haqqinda` | Layihə haqqında |

## Layihə əmrləri

```powershell
npm run dev     # İnkişaf serveri
npm run build   # İstehsal üçün build
npm start       # Build edilmiş tətbiqi başlatmaq
npm run lint    # ESLint yoxlaması
```

## Xarici xidmətlər

- [TheMealDB](https://www.themealdb.com/) — reseptlər və kateqoriyalar
- [Firebase](https://firebase.google.com/) — giriş, istifadəçi hesabları və Cloud Firestore
- [Firestore-da məlumat əlavə etmək](https://firebase.google.com/docs/firestore/manage-data/add-data)
- [Firestore-dan məlumat oxumaq](https://firebase.google.com/docs/firestore/query-data/get-data)
