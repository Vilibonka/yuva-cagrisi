"use client";

import React, { useState, useEffect } from "react";
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
  Camera,
  Stethoscope,
  Send,
  Syringe,
  Scissors,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "@/api";
import { getApiErrorMessage } from "@/lib/errors";

const listingSchema = z.object({
  postType: z.enum(["FOUND_STRAY", "REHOME_OWNED_PET", "TEMP_HOME_NEEDED"], {
    message: "Lütfen bir ilan türü seçin.",
  }),
  name: z.string().optional(),
  species: z.enum(["Dog", "Cat", "Bird", "Other"], {
    message: "Lütfen bir tür seçin.",
  }),
  breed: z.string().optional(),
  age: z.enum(["Baby", "Young", "Adult", "Senior"], {
    message: "Lütfen yaş durumunu seçin.",
  }),
  gender: z.enum(["Male", "Female", "Unknown"], {
    message: "Lütfen cinsiyet seçin.",
  }),
  isNeutered: z.boolean(),
  isVaccinated: z.boolean(),
  isUrgent: z.boolean(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE"], {
    message: "Lütfen bir boyut seçin.",
  }),
  color: z.string().optional(),
  temperament: z.string().optional(),
  specialNeedsNote: z.string().optional(),
  vaccinationSummary: z.string().optional(),
  district: z.string().optional(),
  addressNote: z.string().optional(),
  city: z.string().min(1, "Lütfen bir şehir seçin."),
  story: z.string().min(50, "Hikaye/Açıklama en az 50 karakter olmalıdır."),
});

type ListingFormValues = z.infer<typeof listingSchema>;

interface City {
  id: number;
  name: string;
}

export default function EditListingPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [initialImages, setInitialImages] = useState<{ id: string; url: string; }[]>([]);
  const [keptImages, setKeptImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get<City[]>("/cities")
      .then((res) => setCities(res.data))
      .catch(console.error)
      .finally(() => setCitiesLoading(false));
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      postType: "FOUND_STRAY",
      isNeutered: false,
      isVaccinated: false,
      isUrgent: false,
      size: "MEDIUM",
    },
  });

  // Fetch Cities and Post Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [citiesRes, postRes] = await Promise.all([
          api.get<City[]>("/cities"),
          api.get(`/pet-posts/${params.id}`)
        ]);
        
        setCities(citiesRes.data);
        setCitiesLoading(false);

        const postData = postRes.data;
        const pet = postData.pet;

        // Map Age
        let mappedAge: "Baby" | "Young" | "Adult" | "Senior" | "" = "";
        if (pet.estimatedAgeMonths !== null) {
          if (pet.estimatedAgeMonths <= 6) mappedAge = "Baby";
          else if (pet.estimatedAgeMonths <= 24) mappedAge = "Young";
          else if (pet.estimatedAgeMonths <= 84) mappedAge = "Adult";
          else mappedAge = "Senior";
        }

        // Map Species
        let mappedSpecies: "Dog" | "Cat" | "Bird" | "Other" = "Other";
        if (pet.species === "DOG") mappedSpecies = "Dog";
        else if (pet.species === "CAT") mappedSpecies = "Cat";
        else if (pet.species === "BIRD") mappedSpecies = "Bird";

        // Map Gender
        let mappedGender: "Male" | "Female" | "Unknown" = "Unknown";
        if (pet.gender === "MALE") mappedGender = "Male";
        else if (pet.gender === "FEMALE") mappedGender = "Female";

        const isVaccinated = pet.healthSummary?.includes("Aşılı") || false;

        if (postData.images && postData.images.length > 0) {
          const imgs = postData.images.map((img: any) => ({
            id: img.id,
            url: img.imageUrl
          }));
          setInitialImages(imgs);
          setKeptImages(imgs.map((i: any) => i.url));
        }

        reset({
          postType: postData.postType,
          name: pet.name || undefined,
          species: mappedSpecies,
          breed: pet.breed || undefined,
          age: mappedAge as any,
          gender: mappedGender,
          isNeutered: pet.isNeutered || false,
          isVaccinated: isVaccinated,
          isUrgent: postData.isUrgent || false,
          size: pet.size || "MEDIUM",
          color: pet.color || undefined,
          temperament: pet.temperament || undefined,
          specialNeedsNote: pet.specialNeedsNote || undefined,
          vaccinationSummary: pet.vaccinationSummary || undefined,
          district: postData.district || undefined,
          addressNote: postData.addressNote || undefined,
          city: postData.city,
          story: postData.description || "",
        });

      } catch (err) {
        console.error(err);
        toast.error("İlan bilgileri alınamadı.");
        router.push("/my-listings");
      } finally {
        setIsFetching(false);
      }
    };

    loadData();
  }, [params.id, reset, router]);

  const storyValue = watch("story", "");

  const onSubmit = async (data: ListingFormValues) => {
    // Toplam resim sayısı (eskiler + yeniler) en az 1 olmalı
    if (images.length === 0 && keptImages.length === 0) {
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

      const title = data.name
        ? `${data.city} - Yuva arayan ${data.name}`
        : `${data.city} - Yuva arayan ${data.species === "Dog"
          ? "Köpek"
          : data.species === "Cat"
            ? "Kedi"
            : "Dost"
        }`;

      formData.append("species", mappedSpecies);
      formData.append("gender", mappedGender);
      formData.append("postType", data.postType);
      if (data.name) formData.append("name", data.name);
      formData.append("title", title);
      formData.append("description", data.story);
      formData.append("city", data.city);
      if (data.breed) formData.append("breed", data.breed);
      formData.append("estimatedAgeMonths", estimatedAgeMonths.toString());
      formData.append("healthSummary", healthSummary);
      formData.append("size", data.size);
      if (data.color) formData.append("color", data.color);
      if (data.temperament) formData.append("temperament", data.temperament);
      if (data.specialNeedsNote) formData.append("specialNeedsNote", data.specialNeedsNote);
      if (data.vaccinationSummary) formData.append("vaccinationSummary", data.vaccinationSummary);
      if (data.district) formData.append("district", data.district);
      if (data.addressNote) formData.append("addressNote", data.addressNote);

      formData.append("isVaccinated", data.isVaccinated.toString());
      formData.append("isNeutered", data.isNeutered.toString());
      formData.append("isUrgent", data.isUrgent.toString());

      // Pass kept images so the backend knows what to keep
      formData.append("keptImages", JSON.stringify(keptImages));

      // Sadece resim yüklendiyse gönder, yoksa boş gitsin ve API eskilerini korusun (Eğer backend buna izin veriyorsa, vermiyorsa mecburen resim eklemeli)
      if (images.length > 0) {
        images.forEach((file) => {
          formData.append("images", file);
        });
      }

      await api.patch(`/pet-posts/${params.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("İlan başarıyla güncellendi! 🎉", {
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
      setTimeout(() => router.push("/my-listings"), 1500);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "İlan güncellenirken bir hata oluştu."));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          <p className="text-gray-500 font-medium">İlan bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-white text-gray-800 py-6 px-4 sm:px-6 lg:px-8">
      {/* Premium Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-orange-200/40 to-rose-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tl from-blue-200/40 to-violet-200/20 blur-3xl pointer-events-none" />
      
      <Toaster position="top-right" />
      <div className="relative max-w-3xl mx-auto z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-700 mb-4">
            <PawPrint className="h-4 w-4" /> İlanı Düzenle
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            İlan {" "}
            <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
              Bilgileri
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-gray-500">
            İlanınızla ilgili değişiklikleri buradan yapabilirsiniz. Fotoğraf eklemezseniz eski fotoğraflar silinecektir.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Animal Basics */}
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-6 shadow-xl shadow-orange-900/5">
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
              <div className="sm:col-span-2">
                <label htmlFor="postType" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  İlan Türü <span className="text-red-400">*</span>
                </label>
                <select
                  id="postType"
                  {...register("postType")}
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${errors.postType ? "border-red-300 bg-red-50/30" : "border-gray-200"
                    }`}
                >
                  <option value="FOUND_STRAY">Sokakta Bulunan Can</option>
                  <option value="REHOME_OWNED_PET">Kendi Evcil Hayvanımı Sahiplendiriyorum</option>
                  <option value="TEMP_HOME_NEEDED">Geçici Yuva Arıyorum</option>
                </select>
                {errors.postType && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3 w-3" /> {errors.postType.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  İsim <span className="text-gray-300">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Örn. Pamuk,Zalo,Kömür..."
                />
              </div>

              <div>
                <label htmlFor="species" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Tür <span className="text-red-400">*</span>
                </label>
                <select
                  id="species"
                  {...register("species")}
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${errors.species ? "border-red-300 bg-red-50/30" : "border-gray-200"
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
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${errors.age ? "border-red-300 bg-red-50/30" : "border-gray-200"
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
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${errors.gender ? "border-red-300 bg-red-50/30" : "border-gray-200"
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

              <div>
                <label htmlFor="size" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Boyut <span className="text-red-400">*</span>
                </label>
                <select
                  id="size"
                  {...register("size")}
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 ${errors.size ? "border-red-300 bg-red-50/30" : "border-gray-200"
                    }`}
                >
                  <option value="SMALL">Küçük (0-10 kg)</option>
                  <option value="MEDIUM">Orta (10-25 kg)</option>
                  <option value="LARGE">Büyük (25+ kg)</option>
                </select>
                {errors.size && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3 w-3" /> {errors.size.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="color" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Renk <span className="text-gray-300">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  id="color"
                  {...register("color")}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Örn. Siyah-Beyaz, Sarı..."
                />
              </div>

              <div>
                <label htmlFor="temperament" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Karakter/Huy <span className="text-gray-300">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  id="temperament"
                  {...register("temperament")}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Örn. Uysal, Oyuncu, Ürkek..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Health & Care */}
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-6 shadow-xl shadow-orange-900/5">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
              <div>
                <label htmlFor="vaccinationSummary" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Aşı Durumu Özeti <span className="text-gray-300">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  id="vaccinationSummary"
                  {...register("vaccinationSummary")}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Örn. Karma aşısı yapıldı, Kuduz eksik..."
                />
              </div>

              <div>
                <label htmlFor="specialNeedsNote" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Özel İhtiyaç/Hastalık Notu <span className="text-gray-300">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  id="specialNeedsNote"
                  {...register("specialNeedsNote")}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Örn. Sağ gözü görmüyor, Düzenli ilaç kullanmalı..."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Location & Story */}
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-6 shadow-xl shadow-orange-900/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Konum ve Hikaye</h3>
                <p className="text-xs text-gray-400">Hayvanın bulunduğu yer ve hikayesi</p>
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="city" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Şehir <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  {citiesLoading ? (
                    <svg className="w-4 h-4 text-orange-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <MapPin className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <select
                  id="city"
                  {...register("city")}
                  disabled={citiesLoading}
                  className={`block w-full appearance-none rounded-xl border bg-gray-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:opacity-60 disabled:cursor-not-allowed ${errors.city ? "border-red-300 bg-red-50/30" : "border-gray-200"
                    }`}
                >
                  <option value="">{citiesLoading ? "Şehirler yükleniyor..." : "Şehir Seçin"}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              {errors.city && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                  <AlertCircle className="h-3 w-3" /> {errors.city.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label htmlFor="district" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  İlçe <span className="text-gray-300">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  id="district"
                  {...register("district")}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Örn. Kadıköy, Çankaya..."
                />
              </div>

              <div>
                <label htmlFor="addressNote" className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Adres / Konum Notu <span className="text-gray-300">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  id="addressNote"
                  {...register("addressNote")}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Örn. Moda sahili civarı, Metro durağı yanı..."
                />
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
                  className={`block w-full rounded-xl border bg-gray-50/50 px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 resize-none ${errors.story ? "border-red-300 bg-red-50/30" : "border-gray-200"
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
                  className={`text-xs font-medium tabular-nums ${(storyValue?.length || 0) >= 50 ? "text-emerald-500" : "text-gray-400"
                    }`}
                >
                  {storyValue?.length || 0} / 50
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Photos */}
          <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-6 shadow-xl shadow-orange-900/5">
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

            <ImageUploadDropzone 
              initialImages={initialImages} 
              onFilesChange={setImages} 
              onKeptImagesChange={setKeptImages}
              maxFiles={5} 
            />
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
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
