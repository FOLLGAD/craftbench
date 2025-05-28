
export type Generation = {
  id: string;
  prompt: string;
  model_name: string;
  generated_code: string;
};

export type Comment = {
  id: string;
  user_id: string;
  comparison_id: string;
  content: string;
  created_at: string;
  user_name?: string;
};

export type Comparison = {
  id: string;
  generation_a_id: string;
  generation_b_id: string;
  prompt: string;
  created_at?: string;
  generation_a?: Generation;
  generation_b?: Generation;
  generations?: Generation[];
  voted?: boolean;
  votes?: {
    [key: string]: number;
  };
  comments?: Comment[];
};
