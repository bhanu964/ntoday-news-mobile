export interface UserProfile {
  id: string;
  mobile: string;
  name: string;
  isVerified: boolean;
  verifiedAt: string;
  avatarUrl?: string;
  role?: 'user' | 'reporter' | 'editor';
  createdAt: string;
  updatedAt: string;
}
