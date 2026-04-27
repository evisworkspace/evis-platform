import { Timestamp } from 'firebase/firestore';

export interface Project {
  id: string;
  title: string;
  location: string;
  year?: string;
  duration?: string;
  area?: string;
  system?: string;
  description?: string;
  photos: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Testimonial {
  id: string;
  clientName: string;
  workTitle?: string;
  rating: number;
  review: string;
  imageUrl?: string;
  createdAt: Timestamp;
}

export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  instagramUrl: string;
  address: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}
