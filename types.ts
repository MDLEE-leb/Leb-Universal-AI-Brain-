
export enum BrainType {
  DASHBOARD = 'Dashboard',
  CHAT = 'Chat',
  CODE = 'Code',
  HTML = 'HTML',
  VISION = 'Vision',
  AUDIO = 'Audio',
  IMAGE = 'Image',
  EDIT = 'Edit',
  TASK = 'Tasks',
  QR = 'QR Code',
}

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
  image?: {
    url: string;
    file: File;
  };
}

export type VoiceOption = 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir';

export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  dueDate: string | null;
  creationDate: string;
  completed: boolean;
}