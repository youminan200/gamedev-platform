export interface DevLog {
  id: string;
  title: string;
  author: string;
  likes: number;
  tags: string[];
}

export interface DevLogCreateRequest {
  title: string;
  author: string;
  tags: string[];
}
