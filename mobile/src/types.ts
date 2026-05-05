export type Species = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'OTHER';
export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type AnimalSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type PostType = 'FOUND_STRAY' | 'REHOME_OWNED_PET' | 'TEMP_HOME_NEEDED';
export type PostStatus = 'DRAFT' | 'ACTIVE' | 'PENDING' | 'ADOPTED' | 'CLOSED';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type MessageStatus = 'SENT' | 'READ' | 'DELETED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  contactPhone?: string | null;
  role?: string;
  city?: string | null;
  district?: string | null;
  biography?: string | null;
  profileImageUrl?: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Pet {
  id?: string;
  species: Species;
  breed?: string | null;
  gender?: Gender | null;
  estimatedAgeMonths?: number | null;
  size?: AnimalSize | null;
  healthSummary?: string | null;
  temperament?: string | null;
}

export interface PostImage {
  id?: string;
  imageUrl: string;
  isPrimary?: boolean;
}

export interface PetPost {
  id: string;
  ownerUserId?: string;
  title: string;
  description: string;
  postType: PostType;
  city: string;
  district?: string | null;
  status?: PostStatus;
  isUrgent?: boolean;
  createdAt: string;
  updatedAt?: string;
  pet?: Pet;
  images?: PostImage[];
  owner?: User;
}

export interface SavedPost {
  id: string;
  postId: string;
  createdAt: string;
  post: PetPost;
}

export interface AdoptionRequest {
  id: string;
  postId: string;
  applicantUserId: string;
  status: RequestStatus;
  message: string;
  contactPhone?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  post?: PetPost;
}

export interface Conversation {
  id: string;
  postId?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  post?: { id: string; title: string } | null;
  participants?: { userId: string; user?: User }[];
  messages?: Pick<Message, 'content' | 'createdAt' | 'status' | 'senderUserId'>[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
  sender?: Pick<User, 'id' | 'fullName'>;
}
