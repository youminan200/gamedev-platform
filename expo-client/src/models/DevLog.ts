export interface DevLog {
  id: string;
  title: string;
  content?: string;
  author: string;
  likes: number;
  tags: string[];
  is_liked?: boolean;
  created_at?: string;
}

export interface DevLogCreateRequest {
  title: string;
  content?: string;
  tags: string[];
}

export interface Asset {
  id: string;
  title: string;
  description: string;
  category: '2D' | '3D' | 'Audio' | 'UI' | 'Code';
  file_url?: string;
  author: string;
  tags: string[];
  likes: number;
  avg_rating: number;
  feedback_count: number;
  created_at?: string;
}

export interface AssetFeedback {
  id: string;
  asset_id: string;
  author: string;
  rating: number;
  feedback_type: string;
  content: string;
  created_at: string;
}

export interface UserProfile {
  user: {
    id: string;
    username: string;
    profile_image?: string;
    created_at: string;
  };
  stats: {
    devlog_count: number;
    asset_count: number;
    total_likes: number;
  };
  recent_devlogs: Array<{
    id: string;
    title: string;
    likes: number;
    created_at: string;
  }>;
}
