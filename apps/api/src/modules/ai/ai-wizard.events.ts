import { EventEmitter } from 'events';

export interface WizardProgressEvent {
  type: 'unit_started' | 'unit_completed' | 'all_completed' | 'unit_error';
  class_id: string;
  lesson_temp_id?: string;
  progress_pct: number;
  topics?: any[];
  questions?: any[];
  error?: string;
}

class WizardEventEmitter extends EventEmitter {}

export const wizardEvents = new WizardEventEmitter();
