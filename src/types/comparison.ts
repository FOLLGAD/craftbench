
export type Generation = {
  id: string;
  prompt: string;
  model_name: string;
  generated_code: string;
};

export type Comparison = {
  id: string;
  generation_a_id: string;
  generation_b_id: string;
  prompt: string;
  generations: Generation[];
  voted: boolean;
  votes: {
    [key: string]: number;
  };
};
