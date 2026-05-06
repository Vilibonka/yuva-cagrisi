import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, CheckCircle2, Heart, MessageCircle, Send, X, XCircle } from 'lucide-react-native';
import { z } from 'zod';

import { Badge, Button, ErrorState, Field, LoadingState, Section, colors } from '@/components/Design';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { buildImageUrl } from '@/lib/config';
import { getApiErrorMessage } from '@/lib/errors';
import {
  formatDate,
  genderLabels,
  postStatusLabels,
  postTypeLabels,
  reportReasonLabels,
  requestStatusLabels,
  sizeLabels,
  speciesLabels,
} from '@/lib/labels';
import { emptyToUndefined, optionalPhoneField, optionalTrimmedText, requiredTrimmed } from '@/lib/validation';
import { AdoptionRequest, PetPost, PostStatus, ReportReason, RequestStatus, SavedPost } from '@/types';

const reportReasons = ['SPAM', 'INAPPROPRIATE', 'SCAM', 'OTHER'] as const satisfies readonly ReportReason[];

const adoptionRequestSchema = z.object({
  message: requiredTrimmed('Başvuru mesajı', 1000).refine((value) => value.trim().length >= 10, 'Başvuru mesajı en az 10 karakter olmalı.'),
  housingType: optionalTrimmedText('Konut tipi', 100),
  contactPhone: optionalPhoneField(),
  hasOtherPets: z.boolean(),
  hasChildren: z.boolean(),
  experienceWithPets: optionalTrimmedText('Hayvan deneyimi', 1000),
  whyAdopt: optionalTrimmedText('Sahiplenme nedeni', 1000),
});

const reportSchema = z.object({
  reason: z.enum(reportReasons),
  description: optionalTrimmedText('Açıklama', 500),
});

type AdoptionRequestFormValues = z.infer<typeof adoptionRequestSchema>;
type ReportFormValues = z.infer<typeof reportSchema>;

const adoptionRequestDefaults: AdoptionRequestFormValues = {
  message: '',
  housingType: '',
  contactPhone: '',
  hasOtherPets: false,
  hasChildren: false,
  experienceWithPets: '',
  whyAdopt: '',
};

const reportDefaults: ReportFormValues = {
  reason: 'SPAM',
  description: '',
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<PetPost | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [myRequest, setMyRequest] = useState<AdoptionRequest | null>(null);
  const [ownerRequests, setOwnerRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<PostStatus | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdoptionRequestFormValues>({
    defaultValues: adoptionRequestDefaults,
    mode: 'onTouched',
    resolver: zodResolver(adoptionRequestSchema),
  });
  const redirectTo = id ? `/post/${id}` : '/';

  const load = useCallback(async () => {
    if (!id) return;

    const { data: postData } = await api.get<PetPost>(`/pet-posts/${id}`);
    const ownerId = postData.owner?.id || postData.ownerUserId;

    setPost(postData);
    setIsFavorite(false);
    setMyRequest(null);
    setOwnerRequests([]);

    if (!isAuthenticated) return;

    const favoritePromise = api.get<SavedPost[]>('/users/me/saved-posts');

    if (user?.id && user.id === ownerId) {
      const [favoriteRes, requestsRes] = await Promise.all([
        favoritePromise,
        api.get<AdoptionRequest[]>(`/pet-posts/${id}/adoption-requests`),
      ]);
      setIsFavorite(favoriteRes.data.some((item) => item.postId === id));
      setOwnerRequests(requestsRes.data);
      return;
    }

    const [favoriteRes, requestRes] = await Promise.all([
      favoritePromise,
      api.get<AdoptionRequest[]>('/adoption-requests/my', { params: { postId: id } }),
    ]);
    setIsFavorite(favoriteRes.data.some((item) => item.postId === id));
    setMyRequest(requestRes.data[0] || null);
  }, [id, isAuthenticated, user?.id]);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      await load();
    } catch (error) {
      setPost(null);
      setLoadError(getApiErrorMessage(error, 'İlan detayı yüklenemedi. Lütfen tekrar dene.'));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void fetchPost();
  }, [fetchPost]);

  const toggleFavorite = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      router.push({ pathname: '/login', params: { redirectTo } });
      return;
    }

    try {
      const { data } = await api.post(`/users/me/saved-posts/${post.id}`);
      setIsFavorite(data.saved);
    } catch (error) {
      Alert.alert('Favori güncellenemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  };

  const submitRequest = handleSubmit(async (values) => {
    if (!post) return;
    if (!isAuthenticated) {
      router.push({ pathname: '/login', params: { redirectTo } });
      return;
    }

    try {
      const { data } = await api.post<AdoptionRequest>('/adoption-requests', {
        postId: post.id,
        message: values.message.trim(),
        housingType: emptyToUndefined(values.housingType),
        contactPhone: emptyToUndefined(values.contactPhone) || user?.contactPhone || undefined,
        hasOtherPets: values.hasOtherPets,
        hasChildren: values.hasChildren,
        experienceWithPets: emptyToUndefined(values.experienceWithPets),
        whyAdopt: emptyToUndefined(values.whyAdopt),
      });
      setMyRequest(data);
      reset(adoptionRequestDefaults);
      Alert.alert('Başvuru gönderildi', 'İlan sahibi başvurunu inceleyebilecek.');
    } catch (error) {
      Alert.alert('Başvuru gönderilemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  });

  const startConversation = async () => {
    if (!post?.owner?.id) return;
    if (!isAuthenticated) {
      router.push({ pathname: '/login', params: { redirectTo } });
      return;
    }

    try {
      const { data } = await api.post('/conversations', {
        targetUserId: post.owner.id,
        postId: post.id,
      });
      router.push({ pathname: '/messages/[id]', params: { id: data.id } });
    } catch (error) {
      Alert.alert('Sohbet açılamadı', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  };

  const runReviewRequest = async (requestId: string, status: Extract<RequestStatus, 'APPROVED' | 'REJECTED'>) => {
    setReviewingRequestId(requestId);
    try {
      await api.patch(`/adoption-requests/${requestId}/status`, { status });
      await fetchPost();
      Alert.alert(status === 'APPROVED' ? 'Başvuru onaylandı' : 'Başvuru reddedildi', 'Başvuru durumu güncellendi.');
    } catch (error) {
      Alert.alert('Başvuru güncellenemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    } finally {
      setReviewingRequestId(null);
    }
  };

  const confirmReviewRequest = (requestId: string, status: Extract<RequestStatus, 'APPROVED' | 'REJECTED'>) => {
    Alert.alert(
      status === 'APPROVED' ? 'Başvuruyu onayla' : 'Başvuruyu reddet',
      status === 'APPROVED' ? 'Bu başvuruyu onaylamak istiyor musun?' : 'Bu başvuruyu reddetmek istiyor musun?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: status === 'APPROVED' ? 'Onayla' : 'Reddet', style: status === 'APPROVED' ? 'default' : 'destructive', onPress: () => void runReviewRequest(requestId, status) },
      ],
    );
  };

  const runPostStatusUpdate = async (status: Extract<PostStatus, 'ADOPTED' | 'CLOSED'>) => {
    if (!post) return;

    setUpdatingStatus(status);
    try {
      const { data } = await api.patch<PetPost>(`/pet-posts/${post.id}/status`, { status });
      setPost((current) => (current ? { ...current, ...data } : data));
      await fetchPost();
      Alert.alert('İlan güncellendi', `İlan durumu ${postStatusLabels[status].toLowerCase()} olarak değiştirildi.`);
    } catch (error) {
      Alert.alert('İlan güncellenemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const confirmPostStatusUpdate = (status: Extract<PostStatus, 'ADOPTED' | 'CLOSED'>) => {
    Alert.alert(
      status === 'ADOPTED' ? 'Sahiplendirildi yap' : 'İlanı kapat',
      status === 'ADOPTED' ? 'İlanı sahiplendirildi durumuna almak istiyor musun?' : 'İlanı kapatmak istiyor musun?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Güncelle', style: status === 'CLOSED' ? 'destructive' : 'default', onPress: () => void runPostStatusUpdate(status) },
      ],
    );
  };

  if (loading) {
    return <LoadingState label="İlan detayı açılıyor..." />;
  }

  if (loadError) {
    return <ErrorState title="İlan açılamadı" description={loadError} onRetry={fetchPost} />;
  }

  if (!post) {
    return <ErrorState title="İlan bulunamadı" description="Bu ilan kaldırılmış veya erişilemiyor olabilir." onRetry={fetchPost} />;
  }

  const images = post.images || [];
  const isOwner = isAuthenticated && user?.id === (post.owner?.id || post.ownerUserId);
  const isActivePost = post.status === 'ACTIVE' || !post.status;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
        {images.length > 0 ? (
          images.map((image, index) => <GalleryImage key={`${image.imageUrl}-${index}`} imageUrl={image.imageUrl} />)
        ) : (
          <PhotoPlaceholder />
        )}
      </ScrollView>

      <Section>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <View style={styles.badgeRow}>
              <Badge label={postTypeLabels[post.postType]} tone="orange" />
              {post.status ? <Badge label={postStatusLabels[post.status]} tone={getPostStatusTone(post.status)} /> : null}
            </View>
            <Text style={styles.title}>{post.title}</Text>
          </View>
          {!isOwner ? (
            <Pressable style={[styles.favorite, isFavorite && styles.favoriteActive]} onPress={toggleFavorite}>
              <Heart color={isFavorite ? '#fff' : colors.danger} fill={isFavorite ? '#fff' : 'transparent'} size={22} />
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.description}>{post.description}</Text>
        <View style={styles.metaGrid}>
          <Meta label="Şehir" value={post.city} />
          <Meta label="Tür" value={post.pet?.species ? speciesLabels[post.pet.species] : '-'} />
          <Meta label="Cinsiyet" value={post.pet?.gender ? genderLabels[post.pet.gender] : '-'} />
          <Meta label="Boyut" value={post.pet?.size ? sizeLabels[post.pet.size] : '-'} />
          <Meta label="Yaş" value={post.pet?.estimatedAgeMonths ? `${post.pet.estimatedAgeMonths} ay` : '-'} />
          <Meta label="Irk" value={post.pet?.breed || '-'} />
        </View>
        {post.pet?.healthSummary ? <Text style={styles.note}>Sağlık: {post.pet.healthSummary}</Text> : null}
        {post.pet?.temperament ? <Text style={styles.note}>Karakter: {post.pet.temperament}</Text> : null}
      </Section>

      <Section title="İlan Sahibi">
        <Text style={styles.ownerName}>{post.owner?.fullName || 'İlan sahibi'}</Text>
        <Text style={styles.ownerMeta}>{post.owner?.email || ''}</Text>
        {!isOwner ? (
          <>
            <Button title="Mesaj Gönder" icon={<MessageCircle color="#fff" size={18} />} onPress={startConversation} />
            <Button title="İlanı Şikayet Et" variant="ghost" icon={<AlertTriangle color={colors.primaryDark} size={18} />} onPress={() => setReportOpen(true)} />
          </>
        ) : (
          <Badge label="Bu ilan sana ait" tone="blue" />
        )}
      </Section>

      {isOwner ? (
        <>
          <Section title="İlan Yönetimi">
            <Text style={styles.description}>İlanın son durumunu ve gelen başvuruları buradan yönetebilirsin.</Text>
            <View style={styles.actionRow}>
              <Button
                title="Sahiplendirildi"
                variant="secondary"
                loading={updatingStatus === 'ADOPTED'}
                disabled={!isActivePost || !!updatingStatus}
                onPress={() => confirmPostStatusUpdate('ADOPTED')}
              />
              <Button
                title="Kapat"
                variant="danger"
                loading={updatingStatus === 'CLOSED'}
                disabled={!isActivePost || !!updatingStatus}
                onPress={() => confirmPostStatusUpdate('CLOSED')}
              />
            </View>
          </Section>

          <Section title={`Başvurular (${ownerRequests.length})`}>
            {ownerRequests.length === 0 ? (
              <Text style={styles.description}>Bu ilana henüz başvuru gelmedi.</Text>
            ) : (
              ownerRequests.map((request) => (
                <RequestReviewCard
                  key={request.id}
                  request={request}
                  reviewing={reviewingRequestId === request.id}
                  postActive={isActivePost}
                  onReview={confirmReviewRequest}
                />
              ))
            )}
          </Section>
        </>
      ) : (
        <Section title="Sahiplenme Başvurusu">
          {!isAuthenticated ? (
            <>
              <Text style={styles.description}>Başvuru yapmak için önce giriş yapmalısın.</Text>
              <Button title="Giriş Yap" onPress={() => router.push({ pathname: '/login', params: { redirectTo } })} />
            </>
          ) : myRequest ? (
            <MyRequestSummary request={myRequest} />
          ) : !isActivePost ? (
            <Text style={styles.description}>Bu ilan şu anda yeni başvuru kabul etmiyor.</Text>
          ) : (
            <>
              <Controller
                control={control}
                name="message"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field
                    label="Başvuru mesajı"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    multiline
                    placeholder="Neden sahiplenmek istiyorsun? Yaşam koşullarını kısaca anlat."
                    error={errors.message?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="housingType"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field label="Konut tipi" value={value} onBlur={onBlur} onChangeText={onChange} placeholder="Ev, apartman, bahçeli ev..." error={errors.housingType?.message} />
                )}
              />
              <Controller
                control={control}
                name="contactPhone"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field
                    label="İletişim telefonu"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    placeholder={user?.contactPhone || 'Opsiyonel'}
                    error={errors.contactPhone?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="experienceWithPets"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field
                    label="Hayvan deneyimi"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    multiline
                    placeholder="Daha önce hayvan baktıysan kısaca anlat."
                    error={errors.experienceWithPets?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="whyAdopt"
                render={({ field: { onBlur, onChange, value } }) => (
                  <Field
                    label="Neden sahiplenmek istiyorsun?"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    multiline
                    placeholder="Bu dost için neden uygun bir yuva olduğunu anlat."
                    error={errors.whyAdopt?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="hasOtherPets"
                render={({ field: { onChange, value } }) => <ToggleRow label="Başka evcil hayvanım var" value={value} onChange={onChange} />}
              />
              <Controller
                control={control}
                name="hasChildren"
                render={({ field: { onChange, value } }) => <ToggleRow label="Çocuk bulunan bir evde yaşıyorum" value={value} onChange={onChange} />}
              />
              <Button title="Başvuruyu Gönder" loading={isSubmitting} icon={<Send color="#fff" size={18} />} onPress={submitRequest} />
            </>
          )}
        </Section>
      )}

      <ReportModal postId={post.id} visible={reportOpen} onClose={() => setReportOpen(false)} />
    </ScrollView>
  );
}

function GalleryImage({ imageUrl }: { imageUrl: string }) {
  const [failed, setFailed] = useState(false);
  const uri = failed ? null : buildImageUrl(imageUrl);

  if (!uri) return <PhotoPlaceholder />;

  return <Image source={{ uri }} style={styles.photo} onError={() => setFailed(true)} />;
}

function PhotoPlaceholder() {
  return (
    <View style={styles.photoPlaceholder}>
      <Text style={styles.photoPlaceholderText}>Görsel yok</Text>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function RequestReviewCard({
  request,
  reviewing,
  postActive,
  onReview,
}: {
  request: AdoptionRequest;
  reviewing: boolean;
  postActive: boolean;
  onReview: (requestId: string, status: Extract<RequestStatus, 'APPROVED' | 'REJECTED'>) => void;
}) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestMain}>
          <Text style={styles.requestUser}>{request.applicant?.fullName || 'Başvuran'}</Text>
          <Text style={styles.ownerMeta}>{request.applicant?.email || '-'}</Text>
          <Text style={styles.ownerMeta}>{request.contactPhone || request.applicant?.contactPhone || '-'}</Text>
        </View>
        <Badge label={requestStatusLabels[request.status]} tone={getRequestStatusTone(request.status)} />
      </View>
      <RequestFact label="Mesaj" value={request.message} />
      <View style={styles.metaGrid}>
        <Meta label="Konut tipi" value={request.housingType || '-'} />
        <Meta label="Evcil hayvan" value={request.hasOtherPets ? 'Var' : 'Yok'} />
        <Meta label="Çocuk" value={request.hasChildren ? 'Var' : 'Yok'} />
        <Meta label="Tarih" value={formatDate(request.createdAt)} />
      </View>
      {request.experienceWithPets ? <RequestFact label="Deneyim" value={request.experienceWithPets} /> : null}
      {request.whyAdopt ? <RequestFact label="Sahiplenme nedeni" value={request.whyAdopt} /> : null}
      {request.statusHistory?.length ? <StatusHistory history={request.statusHistory} /> : null}
      {request.status === 'PENDING' && postActive ? (
        <View style={styles.actionRow}>
          <Button title="Onayla" loading={reviewing} disabled={reviewing} icon={<CheckCircle2 color="#fff" size={18} />} onPress={() => onReview(request.id, 'APPROVED')} />
          <Button title="Reddet" variant="danger" loading={reviewing} disabled={reviewing} icon={<XCircle color="#fff" size={18} />} onPress={() => onReview(request.id, 'REJECTED')} />
        </View>
      ) : null}
    </View>
  );
}

function MyRequestSummary({ request }: { request: AdoptionRequest }) {
  return (
    <>
      <Badge label={requestStatusLabels[request.status]} tone={getRequestStatusTone(request.status)} />
      <Text style={styles.description}>Bu ilana daha önce başvuru yaptın.</Text>
      <RequestFact label="Mesajın" value={request.message} />
      <View style={styles.metaGrid}>
        <Meta label="Konut tipi" value={request.housingType || '-'} />
        <Meta label="Evcil hayvan" value={request.hasOtherPets ? 'Var' : 'Yok'} />
        <Meta label="Çocuk" value={request.hasChildren ? 'Var' : 'Yok'} />
        <Meta label="Telefon" value={request.contactPhone || '-'} />
      </View>
      {request.statusHistory?.length ? <StatusHistory history={request.statusHistory} /> : null}
    </>
  );
}

function RequestFact({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.factText}>{value || '-'}</Text>
    </View>
  );
}

function StatusHistory({ history }: { history: NonNullable<AdoptionRequest['statusHistory']> }) {
  return (
    <View style={styles.history}>
      <Text style={styles.historyTitle}>Durum geçmişi</Text>
      {history.map((item, index) => (
        <Text key={item.id || `${item.newStatus}-${index}`} style={styles.historyItem}>
          {requestStatusLabels[item.newStatus]} - {formatDate(item.changedAt)}
        </Text>
      ))}
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Pressable style={[styles.toggle, value && styles.toggleActive]} onPress={() => onChange(!value)}>
      <Text style={[styles.toggleText, value && styles.toggleTextActive]}>{label}</Text>
      <Text style={[styles.togglePill, value && styles.togglePillActive]}>{value ? 'Evet' : 'Hayır'}</Text>
    </Pressable>
  );
}

function ChoiceGroup<T extends string>({ value, options, labels, onChange }: { value: T; options: readonly T[]; labels: Record<T, string>; onChange: (value: T) => void }) {
  return (
    <View style={styles.choiceWrap}>
      {options.map((option) => {
        const active = value === option;
        return (
          <Pressable key={option} style={[styles.choice, active && styles.choiceActive]} onPress={() => onChange(option)}>
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{labels[option]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ReportModal({ postId, visible, onClose }: { postId: string; visible: boolean; onClose: () => void }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    defaultValues: reportDefaults,
    resolver: zodResolver(reportSchema),
  });

  const submit = handleSubmit(async (values) => {
    try {
      await api.post(`/reports/${postId}`, {
        reason: values.reason,
        description: emptyToUndefined(values.description),
      });
      reset(reportDefaults);
      onClose();
      Alert.alert('Şikayet alındı', 'Hassasiyetin için teşekkür ederiz.');
    } catch (error) {
      Alert.alert('Şikayet gönderilemedi', getApiErrorMessage(error, 'Lütfen tekrar dene.'));
    }
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <AlertTriangle color={colors.danger} size={20} />
              <Text style={styles.modalTitle}>İlanı Şikayet Et</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X color={colors.muted} size={20} />
            </Pressable>
          </View>
          <Controller
            control={control}
            name="reason"
            render={({ field: { onChange, value } }) => <ChoiceGroup value={value} options={reportReasons} labels={reportReasonLabels} onChange={onChange} />}
          />
          <Controller
            control={control}
            name="description"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field
                label="Açıklama"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                multiline
                placeholder="İstersen detay ekleyebilirsin."
                error={errors.description?.message}
              />
            )}
          />
          <Button title="Şikayeti Gönder" variant="danger" loading={isSubmitting} onPress={submit} />
        </View>
      </View>
    </Modal>
  );
}

function getRequestStatusTone(status: RequestStatus) {
  if (status === 'APPROVED') return 'green';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'red';
  return 'orange';
}

function getPostStatusTone(status: PostStatus) {
  if (status === 'ACTIVE') return 'green';
  if (status === 'ADOPTED') return 'blue';
  if (status === 'CLOSED') return 'neutral';
  return 'orange';
}

const styles = StyleSheet.create({
  container: { gap: 16, padding: 16, paddingBottom: 32 },
  gallery: { gap: 12, paddingRight: 16 },
  photo: { backgroundColor: '#efe7df', borderRadius: 20, height: 280, width: 300 },
  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#efe7df',
    borderRadius: 20,
    height: 240,
    justifyContent: 'center',
    width: 300,
  },
  photoPlaceholderText: { color: colors.muted, fontWeight: '800' },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  titleBlock: { flex: 1, gap: 10 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '900', lineHeight: 31 },
  favorite: {
    alignItems: 'center',
    backgroundColor: '#fff4ed',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  favoriteActive: { backgroundColor: colors.danger },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: {
    backgroundColor: '#fbf7f3',
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: '47%',
    padding: 12,
  },
  metaLabel: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  metaValue: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 3 },
  note: { color: colors.ink, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  ownerName: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  ownerMeta: { color: colors.muted, fontSize: 13 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  requestCard: {
    backgroundColor: '#fbf7f3',
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  requestHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  requestMain: { flex: 1, gap: 3 },
  requestUser: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  fact: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  factText: { color: colors.ink, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  history: { gap: 5 },
  historyTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  historyItem: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  toggle: {
    alignItems: 'center',
    backgroundColor: '#fbf7f3',
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 13,
  },
  toggleActive: { backgroundColor: '#fff4ed', borderColor: '#ffd2b8' },
  toggleText: { color: colors.muted, flex: 1, fontSize: 14, fontWeight: '800' },
  toggleTextActive: { color: colors.ink },
  togglePill: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  togglePillActive: { color: colors.primaryDark },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    backgroundColor: '#fbf7f3',
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  choiceActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  choiceText: { color: colors.muted, fontWeight: '800' },
  choiceTextActive: { color: '#fff' },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    gap: 14,
    padding: 16,
  },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modalTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  modalTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#f1ece6',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
