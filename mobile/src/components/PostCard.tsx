import React from 'react';
import { Heart, Image as ImageIcon, MapPin } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge, colors } from '@/components/Design';
import { buildImageUrl } from '@/lib/config';
import { postTypeLabels, speciesLabels } from '@/lib/labels';
import { PetPost } from '@/types';

interface PostCardProps {
  post: PetPost;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

export function PostCard({ post, isFavorite, onPress, onToggleFavorite }: PostCardProps) {
  const primaryImage = post.images?.find((image) => image.isPrimary) || post.images?.[0];
  const imageUrl = buildImageUrl(primaryImage?.imageUrl);
  const species = post.pet?.species ? speciesLabels[post.pet.species] : 'Dost';

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <ImageIcon color="#c9bdb2" size={30} />
            <Text style={styles.placeholderText}>Görsel yok</Text>
          </View>
        )}
        <View style={styles.badgeWrap}>
          <Badge label={postTypeLabels[post.postType] || 'İlan'} tone="orange" />
          {post.isUrgent ? <Badge label="Acil" tone="red" /> : null}
        </View>
        {onToggleFavorite ? (
          <Pressable style={styles.favorite} onPress={onToggleFavorite}>
            <Heart color={isFavorite ? '#fff' : colors.danger} fill={isFavorite ? colors.danger : 'transparent'} size={20} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>
          {post.title}
        </Text>
        <Text numberOfLines={2} style={styles.description}>
          {post.description}
        </Text>
        <View style={styles.footer}>
          <View style={styles.location}>
            <MapPin color={colors.primary} size={15} />
            <Text style={styles.meta}>{post.city}</Text>
          </View>
          <Text style={styles.metaStrong}>{species}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9 },
  imageWrap: {
    backgroundColor: '#efe7df',
    height: 210,
    position: 'relative',
  },
  image: { height: '100%', width: '100%' },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  placeholderText: { color: '#a79d94', fontWeight: '700' },
  badgeWrap: {
    gap: 8,
    left: 12,
    position: 'absolute',
    top: 12,
  },
  favorite: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
    width: 42,
  },
  body: { gap: 8, padding: 15 },
  title: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  footer: {
    alignItems: 'center',
    borderTopColor: '#f1ece7',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  location: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  meta: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  metaStrong: { color: colors.ink, fontSize: 13, fontWeight: '900' },
});
