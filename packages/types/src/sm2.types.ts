export interface SM2Progress {
  easiness_factor: number;    
  interval_days: number;      
  repetition_count: number;   
}

export interface SM2Input {
  progress: SM2Progress | null;   
  is_correct: boolean;
  response_time_ms: number;
}

export interface SM2Result {
  q: number;                     
  new_ef: number;                
  new_interval: number;          
  new_repetition_count: number;  
  next_review_date: Date;        
}

export const SM2_DEFAULTS: SM2Progress = {
  easiness_factor: 2.5,
  interval_days: 1,
  repetition_count: 0,
} as const;

export const SM2_CONSTANTS = {
  EF_MIN: 1.3,
  EF_MAX: 5.0,
  EF_DEFAULT: 2.5,
  RESPONSE_FAST_MS: 5_000,    
  RESPONSE_MEDIUM_MS: 15_000, 
  RESPONSE_SLOW_WRONG_MS: 20_000, 
} as const;
