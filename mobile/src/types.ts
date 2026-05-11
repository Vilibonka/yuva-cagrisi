export type Species = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'OTHER';
export type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type AnimalSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type PostType = 'FOUND_STRAY' | 'REHOME_OWNED_PET' | 'TEMP_HOME_NEEDED';
export type PostStatus = 'DRAFT' | 'ACTIVE' | 'PENDING' | 'ADOPTED' | 'CLOSED';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type MessageStatus = 'SENT' | 'READ' | 'DELETED';
export type ReportReason = 'SPAM' | 'INAPPROPRIATE' | 'SCAM' | 'OTHER';
export type NotificationType = 'REQUEST_CREATED' | 'REQUEST_APPROVED' | 'REQUEST_REJECTED' | 'NEW_MESSAGE' | 'SYSTEM';
export type HousingType = 'DETACHED' | 'APARTMENT' | 'OTHER';

export interface CityItem {
  id: string;
  name: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface BlockStatus {
  isBlocked: boolean;
  blockedByMe: boolean;
  blockedByThem: boolean;
}

export interface UserBlock {
  id: string;
  blockerUserId: string;
  blockedUserId: string;
  reason?: string | null;
  createdAt: string;
  blocked?: Pick<User, 'id' | 'fullName' | 'email' | 'profileImageUrl'>;
}

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
  lastSeenAt?: string | null;
  showReadReceipts?: boolean;
  showLastSeen?: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Pet {
  id?: string;
  name?: string | null;
  species: Species;
  breed?: string | null;
  gender?: Gender | null;
  estimatedAgeMonths?: number | null;
  size?: AnimalSize | null;
  color?: string | null;
  healthSummary?: string | null;
  vaccinationSummary?: string | null;
  isVaccinated?: boolean | null;
  isNeutered?: boolean | null;
  specialNeedsNote?: string | null;
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
  addressNote?: string | null;
  status?: PostStatus;
  isUrgent?: boolean;
  viewCount?: number | null;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string | null;
  pet?: Pet;
  images?: PostImage[];
  owner?: User;
  adoptionRequests?: Pick<AdoptionRequest, 'id' | 'status' | 'applicantUserId'>[];
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
  housingType?: HousingType | null;
  hasOtherPets?: boolean | null;
  hasChildren?: boolean | null;
  experienceWithPets?: string | null;
  whyAdopt?: string | null;
  contactPhone?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  post?: PetPost;
  applicant?: User;
  statusHistory?: RequestStatusHistory[];
}

export interface RequestStatusHistory {
  id?: string;
  oldStatus?: RequestStatus | null;
  newStatus: RequestStatus;
  note?: string | null;
  changedAt: string;
  changedBy?: Pick<User, 'id' | 'fullName'> | null;
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
  sender?: Pick<User, 'id' | 'fullName' | 'profileImageUrl'>;
}

export interface NotificationItem {
  id?: string;
  userId?: string;
  requestId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead?: boolean;
  createdAt?: string;
}
