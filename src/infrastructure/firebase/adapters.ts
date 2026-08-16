import type { UserProfile, UserProfileDTO } from '@/types/auth';

export function toUserProfile(dto: UserProfileDTO): UserProfile {
  return {
    uid: dto.uid,
    email: dto.email,
    displayName: dto.displayName,
    photoURL: dto.photoURL,
    role: dto.role,
    createdAt: new Date(dto.createdAt),
    lastLoginAt: new Date(dto.lastLoginAt),
    preferences: dto.preferences,
  };
}
