export interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  description: string;
  isDoubleLesson?: boolean;
  startTime: Date;
  endTime: Date;
  isRecurring?: boolean;
  seriesMasterId?: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  state: 'focused' | 'bored' | 'stressed' | 'neutral';
  lessonId?: string;
  lessonTitle?: string;
  note: string;
}

export interface RewardStats {
  totalPoints: number;
  pointsThisWeek: number;
  completedLessons: string[];
  lastUpdated: string;
  gamePoints: number;
  focusPoints: number;
  moodPoints: number;
}

export interface FocusSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  interruptions: number;
  activities: Activity[];
}

export interface Activity {
  id: string;
  timestamp: Date;
  type: 'leave' | 'return' | 'tab_switch' | 'window_focus';
  details: string;
} 