"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { ImageUploadDropzone } from "@/components/listings/ImageUploadDropzone";
import {
  Loader2,
  PawPrint,
  AlertCircle,
  MapPin,
  FileText,
  Camera,
  Heart,
  Stethoscope,
  Send,
  Syringe,
  Scissors,
  Dog,
  Cat,
  Bird,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "@/api";

const listingSchema = z.object({
  species: z.enum(["Dog", "Cat", "Bird", "Other"], {
    required_error: "Lütfen bir tür seçin.",
    invalid_type_error: "Lütfen bir tür seçin.",
  }),
  breed: z.string().optional(),
  age: z.enum(["Baby", "Young", "Adult", "Senior"], {
    required_error: "Lütfen yaş durumunu seçin.",
    invalid_type_error: "Lütfen yaş durumunu seçin.",
  }),
  gender: z.enum(["Male", "Female", "Unknown"], {
    required_error: "Lütfen cinsiyet seçin.",
    invalid_type_error: "Lütfen cinsiyet seçin.",
  }),
  isNeutered: z.boolean(),
  isVaccinated: z.boolean(),
  isUrgent: z.boolean(),
  city: z.string().min(2, "Şehir adı en az 2 karakter olmalıdır."),
  district: z.string().min(2, "İlçe adı en az 2 karakter olmalıdır."),
  story: z.string().min(50, "Hikaye/Açıklama en az 50 karakter olmalıdır."),
});

type ListingFormValues = z.infer<typeof listingSchema>;

export default function CreateListingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      isNeutered: false,
      isVaccinated: false,
      isUrgent: false,
    },
  });

  const storyValue = watch("story", "");

  const onSubmit = async (data: ListingFormValues) => {
    if (images.length === 0) {
      setImageError("Lütfen en az bir fotoğraf yükleyin.");
      return;
    }
    setImageError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();

      const mappedSpecies = data.species.toUpperCase();
      const mappedGender = data.gender.toUpperCase();

      let estimatedAgeMonths = 0;
      if (data.age === "Baby") estimatedAgeMonths = 3;
      else if (data.age === "Young") estimatedAgeMonths = 12;
      else if (data.age === "Adult") estimatedAgeMonths = 48;
      else if (data.age === "Senior") estimatedAgeMonths = 96;

      const healthInfo = [];
      if (data.isVaccinated) healthInfo.push("Aşılı");
      if (data.isNeutered) healthInfo.push("Kısırlaştırılmış");
      if (data.isUrgent) healthInfo.push("ACİL DURUM / TIBBİ İHTİYAÇ!");
      const healthSummary =
        healthInfo.length > 0 ? healthInfo.join(", ") : "Belirtilmedi";

      const title = `${data.city} ${data.district} - Yuva arayan ${
        data.species === "Dog"
          ? "Köpek"
          : data.species === "Cat"
          ? "Kedi"
          : "Dost"
      }`;

      formData.append("species", mappedSpecies);
      formData.append("gender", mappedGender);
      formData.append("postType", "FOUND_STRAY");
      formData.append("title", title);
      formData.append("description", data.story);
      formData.append("city", data.city);
      if (data.breed) formData.append("breed", data.breed);
      formData.append("estimatedAgeMonths", estimatedAgeMonths.toString());
      formData.append("healthSummary", healthSummary);
      formData.append("temperament", "Belirtilmedi");

      images.forEach((file) => {
        formData.append("images", file);
      });

      await api.post("/pet-posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("İlan başarıyla oluşturuldu! 🎉", {
        duration: 4000,
        style: {
          borderRadius: "12px",
          background: "#065f46",
          color: "#fff",
          fontWeight: 600,
        },
      });
      reset();
      setImages([]);
      setTimeout(() => router.push("/posts"), 1500);
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      toast.error(
        Array.isArray(msg)
          ? msg.join(", ")
          : msg || "İlan oluşturulurken bir hata oluştu."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full py-6 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-700 mb-4">
            <PawPrint className="h-4 w-4" /> İlan Oluştur
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Bir Can İçin{" "}
            <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
              Yuva Arıyorum
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-gray-500">
            Sokakta bulduğunuz veya geçici olarak baktığınız bir hayvan için ilan oluşturun. Detaylı bilgi, sahiplenme şansını artırır.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Animal Basics */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                <PawPrint className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Temel Bilgiler</h3>
                <p className="text-xs text-gray-400">Dostumuzun türü, yaşı ve cinsiyeti</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="species" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Tür <span className="text-red-400">*</span>
                </label>
                <select
                  id="species"
                  {...register("species")}
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${
                    errors.species ? "border-red-300 bg-red-50/30" : "border-gray-200"
                  }`}
                >
                  <option value="">Seçiniz...</option>
                  <option value="Dog">🐕 Köpek</option>
                  <option value="Cat">🐈 Kedi</option>
                  <option value="Bird">🐦 Kuş</option>
                  <option value="Other">🐾 Diğer</option>
                </select>
                {errors.species && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3 w-3" /> {errors.species.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="breed" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Irk <span className="text-gray-300">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  id="breed"
                  {...register("breed")}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Örn. Tekir, Golden Retriever..."
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Tahmini Yaş <span className="text-red-400">*</span>
                </label>
                <select
                  id="age"
                  {...register("age")}
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${
                    errors.age ? "border-red-300 bg-red-50/30" : "border-gray-200"
                  }`}
                >
                  <option value="">Seçiniz...</option>
                  <option value="Baby">🍼 Bebek (0-6 Ay)</option>
                  <option value="Young">🌱 Genç (6 Ay - 2 Yaş)</option>
                  <option value="Adult">🌿 Yetişkin (2-7 Yaş)</option>
                  <option value="Senior">🌾 Yaşlı (7+ Yaş)</option>
                </select>
                {errors.age && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3 w-3" /> {errors.age.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Cinsiyet <span className="text-red-400">*</span>
                </label>
                <select
                  id="gender"
                  {...register("gender")}
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${
                    errors.gender ? "border-red-300 bg-red-50/30" : "border-gray-200"
                  }`}
                >
                  <option value="">Seçiniz...</option>
                  <option value="Male">♂ Erkek</option>
                  <option value="Female">♀ Dişi</option>
                  <option value="Unknown">❓ Bilinmiyor</option>
                </select>
                {errors.gender && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3 w-3" /> {errors.gender.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Health & Care */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Stethoscope className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Sağlık Durumu</h3>
                <p className="text-xs text-gray-400">Bakım ve sağlık bilgileri</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <label
                htmlFor="isVaccinated"
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/30 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50"
              >
                <input
                  id="isVaccinated"
                  type="checkbox"
                  {...register("isVaccinated")}
                  className="h-5 w-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                    <Syringe className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Aşılı</span>
                    <p className="text-[11px] text-gray-400">Temel aşıları yapılmış</p>
                  </div>
                </div>
              </label>

              <label
                htmlFor="isNeutered"
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/30 has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50"
              >
                <input
                  id="isNeutered"
                  type="checkbox"
                  {...register("isNeutered")}
                  className="h-5 w-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                    <Scissors className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Kısırlaştırılmış</span>
                    <p className="text-[11px] text-gray-400">Kısırlaştırma yapılmış</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Urgent - Special Highlight */}
            <label
              htmlFor="isUrgent"
              className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-red-100 bg-gradient-to-r from-red-50 to-orange-50 p-4 transition-all hover:border-red-300 has-[:checked]:border-red-400 has-[:checked]:from-red-50 has-[:checked]:to-red-100"
            >
              <input
                id="isUrgent"
                type="checkbox"
                {...register("isUrgent")}
                className="h-5 w-5 rounded-md border-red-300 text-red-600 focus:ring-red-500"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <span className="text-sm font-bold text-red-800">Acil Durum / Tıbbi İhtiyaç</span>
                  <p className="text-[11px] text-red-500">Acil yuvaya veya tıbbi desteğe ihtiyaç var. Bu ilanlar öne çıkarılır.</p>
                </div>
              </div>
              <span className="hidden sm:inline-flex rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700 uppercase tracking-wider">
                Acil
              </span>
            </label>
          </div>

          {/* Section 3: Location & Story */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Konum ve Hikaye</h3>
                <p className="text-xs text-gray-400">Hayvanın bulunduğu yer ve hikayesi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label htmlFor="city" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Şehir <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  {...register("city")}
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${
                    errors.city ? "border-red-300 bg-red-50/30" : "border-gray-200"
                  }`}
                  placeholder="Örn. İstanbul"
                />
                {errors.city && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3 w-3" /> {errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="district" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  İlçe <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="district"
                  {...register("district")}
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${
                    errors.district ? "border-red-300 bg-red-50/30" : "border-gray-200"
                  }`}
                  placeholder="Örn. Kadıköy"
                />
                {errors.district && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3 w-3" /> {errors.district.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="story" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Hikayesi / Açıklama <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="story"
                  rows={5}
                  {...register("story")}
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 resize-none ${
                    errors.story ? "border-red-300 bg-red-50/30" : "border-gray-200"
                  }`}
                  placeholder="Onu nasıl buldunuz? Karakteri nasıl? Özel ihtiyaçları var mı? Detaylı bir açıklama sahiplenme şansını artırır..."
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                {errors.story ? (
                  <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3 w-3" /> {errors.story.message}
                  </p>
                ) : (
                  <span className="text-[11px] text-gray-300">En az 50 karakter gerekli</span>
                )}
                <span
                  className={`text-xs font-medium tabular-nums ${
                    (storyValue?.length || 0) >= 50 ? "text-emerald-500" : "text-gray-400"
                  }`}
                >
                  {storyValue?.length || 0} / 50
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Photos */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                <Camera className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Fotoğraflar</h3>
                <p className="text-xs text-gray-400">
                  Net ve aydınlık fotoğraflar yuva bulma sürecini hızlandırır
                </p>
              </div>
            </div>

            <ImageUploadDropzone onFilesChange={setImages} maxFiles={5} />
            {imageError && (
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-500">
                <AlertCircle className="h-3 w-3" /> {imageError}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4 pt-2 pb-8">
            <button
              type="button"
              onClick={() => {
                reset();
                setImages([]);
              }}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300"
            >
              Formu Temizle
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-rose-600 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  İlanı Yayınla
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
