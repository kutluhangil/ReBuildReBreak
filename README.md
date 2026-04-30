<div align="center">

```
██████╗ ███████╗██████╗ ██╗   ██╗██╗██╗     ██████╗ 
██╔══██╗██╔════╝██╔══██╗██║   ██║██║██║     ██╔══██╗
██████╔╝█████╗  ██████╔╝██║   ██║██║██║     ██║  ██║
██╔══██╗██╔══╝  ██╔══██╗██║   ██║██║██║     ██║  ██║
██║  ██║███████╗██████╔╝╚██████╔╝██║███████╗██████╔╝
╚═╝  ╚═╝╚══════╝╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝ 
```

### The Ultimate 3D Voxel Toy Box

*Tarayıcı tabanlı, fizik motorlu ve yapay zeka destekli 3D voksel inşa aracı.*

---

[![Version](https://img.shields.io/badge/version-1.0.0-C8FF00?style=flat-square&labelColor=0A0A0B)](https://github.com/kutluhangil)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=0A0A0B)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black&labelColor=0A0A0B)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-white?style=flat-square&logo=three.js&logoColor=black&labelColor=0A0A0B)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=0A0A0B)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=flat-square&logo=google&logoColor=white&labelColor=0A0A0B)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-C8FF00?style=flat-square&labelColor=0A0A0B)](LICENSE)

---

</div>

---

## Proje Nedir?

<details open>
<summary><strong>Türkçe Açıklama</strong></summary>
<br>

ReBuild ReBreak, serbest çalışanlar, tasarımcılar ve yaratıcı beyinler için tasarlanmış kapsamlı bir 3D voksel oluşturma platformudur. Voksel yerleştirmekten fizik simulasyonuna, text-to-voxel AI üretiminden gelişmiş malzeme boyutlarına kadar aradığınız her şeyi modern, 3D bir deneyimde sunar.

**Neden ReBuild ReBreak?**
- Herhangi bir yazılım kurmadan doğrudan tarayıcı üzerinden voksel sanatı tasarlayın.
- İnşa ettiğiniz modelleri gerçek zamanlı fizik motoru (yerçekimi & sürtünme) ile test edin ve parçalayın.
- Gemini AI sayesinde "Bana bir uzay gemisi oluştur" yazarak saniyeler içinde üretim yapın.
- Özel renk paletini kullanarak hassas HSL/RGB/HEX renklerini bloklarınıza uygulayın.

</details>
<br>

ReBuild ReBreak is an advanced **3D voxel sandbox** running entirely in the browser. It features a custom lightweight voxel engine built on Three.js, real-time physics parameters (gravity, friction), advanced brush tools, and seamless Generative AI capabilities via Google Gemini.

---

## Özellikler

| # | Özellik | Açıklama |
|---|---------|----------|
| 🛠️ | **Hyper-Sculpting** | Ekleme, çıkarma, boyama ve akıllı şekillendirme (Sculpt) fırçaları |
| 🤖 | **AI Generation** | Yazdığınız basit bir komut ile modeli sıfırdan yapay zeka aracılığıyla inşa etme |
| 🌐 | **Live Physics** | Vokselleri serbest fizik ortamına bırakma, yerçekimi/sürtünme gibi değişkenleri doğrudan UI'dan yönetme |
| 🎨 | **Gelişmiş Renkler** | Hex/RGB/HSL detayıyla renk seçici, UI üzerinde kendi paletini kaydetme |
| 🔄 | **Akıllı Geçmiş** | Detaylı toast bildirimleri ve spesifik işlem isimleriyle geri/ileri alma (Undo/Redo) desteği |
| ☁️ | **Dinamik Görüntü** | Göz yormayan dinamik Skybox background shader'ı ve odaklama yardımcısı Mesh Highlight outline efektleri |
| 🗃️ | **JSON In/Out** | Modellerinizi bilgisayara JSON formatında kaydetme veya daha önce kaydettiğiniz tasarımları geri yükleme |
| 📱 | **Responsive + UI** | Animasyonlu floating araç kutuları (UIOverlay), command palette tadında hissiyatlı butonlar |

---

## Teknoloji Yığını

```
Frontend & UI
├── React 18 (Functional Components, Hooks)
├── TypeScript (strict mode)
├── Tailwind CSS 3.4 (Özelleştirilmiş animasyonlar ve utility'ler)
├── Lucide React (Minimal icon seti)
└── Vite (Hızlı build & HMR)

3D Engine & Physics
├── Three.js (Core 3D Rendering & Scene Graph)
├── Custom WebGL Shaders (Skybox gradient, Highlight outlines)
├── InstancedMesh Rendering (Performans için tek seferde binlerce küp yönetimi)
└── Custom Physics Step (AABB bounds mapping, Velocity, Collision resolution)

AI & Storage
├── Google Generative AI (@google/genai, Text-to-Voxel Pipeline)
└── Context & LocalStorage (Session Persistence & Custom Palettes)
```

---

## Mimari

```
┌─────────────────────────────────────────────────────────┐
│                      User Interface                     │
│  (React Layer, WelcomeScreen, UIOverlay, Toast System)  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  VoxelEngine (Three.js)                 │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Mesh Arrays │  │ Raycaster   │  │ Camera & Lights │ │
│  │ (Instanced) │  │ (Pointer)   │  │ (Ambient, Dir)  │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────┐           │
│  │     Custom Physics Loop (tick/animate)  │           │
│  └─────────────────────────────────────────┘           │
└─────────────────────────────────┬───────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────┐
          │                                           │
┌─────────▼────────┐                         ┌────────▼──────┐
│  State Manager   │                         │  Gemini API   │
│ (Undo/Redo/Save) │                         │ (Text-to-JSON)│
└──────────────────┘                         └───────────────┘
```

---

## Başlarken

### Gereksinimler

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Google Gemini API Anahtarı** (Yapay zeka üretim özelliği için)

### Yerel Geliştirme

```bash
# Repoyu klonlama
git clone https://github.com/kutluhangil/rebuild-rebreak.git
cd rebuild-rebreak

# Bağımlılıkları yükleme
npm install

# Environment dosyasını oluştur (VITE_ prefix ile)
cp .env.example .env.local
# .env.local dosyasını düzenleyip Gemini Key'i girin

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

---

## Vercel ile Deployment (Canlıya Alma)

Vercel, React ve Vite projelerini canlıya almak için en hızlı ve ücretsiz platformlardan biridir. Bu projeyi kendi Vercel hesabınızda canlıya almak için aşağıdaki adımları izleyin:

### Gereksinimler

1.  Bir [GitHub](https://github.com/) hesabı.
2.  Bir [Vercel](https://vercel.com/) hesabı (GitHub hesabınızla giriş yapabilirsiniz).
3.  Gemini API Anahtarı (Yapay zeka üretim özelliği için).

### Adım Adım Deployment

**Adım 1: Projeyi GitHub'a Yükleyin**
Eğer projeyi henüz kendi GitHub hesabınıza yüklemediyseniz, kodları indirip kendi hesabınızda yeni bir repository (depo) oluşturarak yükleyin.

**Adım 2: Vercel'e İçe Aktarın**
1. Vercel paneline giriş yapın.
2. Sağ üstteki **"Add New"** > **"Project"** butonuna tıklayın.
3. GitHub hesabınızı Vercel'e bağlayın.
4. Yüklediğiniz `rebuild-rebreak` (veya kendi adlandırdığınız) projesini bulun ve **"Import"** butonuna tıklayın.

**Adım 3: Yapılandırma ve Environment Variables (Ortam Değişkenleri)**
1.  **Project Name:** Projenizin URL'sinde yer alacak ismi belirleyin (örn: `rebuild-rebreak-app`).
2.  **Framework Preset:** Vercel otomatik olarak **"Vite"**ı seçecektir. Seçmediyse manuel olarak Vite'ı seçin.
3.  **Environment Variables (En Önemli Adım):**
    "Environment Variables" bölümünü genişletin ve aşağıdaki değişkeni ekleyin:
    *   **Name:** `VITE_GEMINI_API_KEY`
    *   **Value:** `sizin_gemini_api_anahtariniz_buraya`
    *   *Add (Ekle)* butonuna basmayı unutmayın.

**Adım 4: Deploy**
1. **"Deploy"** butonuna tıklayın.
2. Vercel projenizi derleyecek (build) ve canlıya alacaktır. Bu işlem genellikle 1-2 dakika sürer.
3. Tebrikler! Ekranda beliren URL'ye tıklayarak uygulamanıza canlı ortamda erişebilirsiniz.

### Güncellemeler (Sürekli Entegrasyon)

Artık GitHub deponuzdaki `main` branch'ine yapacağınız her "push" işlemi, Vercel tarafından otomatik olarak algılanacak ve uygulamanızın yeni versiyonu saniyeler içinde canlıya alınacaktır.

---

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında dağıtılmaktadır.

---

<div align="center">

**Built with precision by [kutluhangil](https://github.com/kutluhangil/)**

*Sanat ile kodun 3D buluşması.*

[![GitHub](https://img.shields.io/badge/GitHub-kutluhangil-C8FF00?style=flat-square&logo=github&logoColor=white&labelColor=0A0A0B)](https://github.com/kutluhangil)

</div>
