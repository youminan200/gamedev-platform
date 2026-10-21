export interface DevLog {
  id: string;
  title: string;
  content?: string;
  image_url?: string;
  author: string;
  likes: number;
  views?: number;
  demo_url?: string;
  is_pinned?: number | boolean;
  poll_question?: string;
  poll_option_a?: string;
  poll_option_b?: string;
  poll_votes_a?: number;
  poll_votes_b?: number;
  comment_count?: number;
  tags: string[];
  is_liked?: boolean;
  created_at?: string;
}

export interface DevLogCreateRequest {
  title: string;
  content?: string;
  image_url?: string;
  demo_url?: string;
  poll_question?: string;
  poll_option_a?: string;
  poll_option_b?: string;
  tags: string[];
}

export interface Asset {
  id: string;
  title: string;
  description: string;
  category: '2D' | '3D' | 'Audio' | 'UI' | 'Code';
  file_url?: string;
  image_url?: string;
  author: string;
  tags: string[];
  likes: number;
  downloads?: number;
  avg_rating: number;
  feedback_count: number;
  is_liked?: boolean;
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
    bio?: string;
    engine?: string;
    github_url?: string;
    steam_url?: string;
    itch_url?: string;
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
    comment_count?: number;
    image_url?: string;
    created_at: string;
  }>;
  recent_assets?: Array<{
    id: string;
    title: string;
    category: string;
    likes: number;
    image_url?: string;
    file_url?: string;
    created_at: string;
  }>;
}
