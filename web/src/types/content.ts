export enum MaterialType {
  PDF = 'PDF',
  PPT = 'PPT',
  DOC = 'DOC',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER',
  MOTIVATIONAL = 'MOTIVATIONAL'
}

export enum MaterialStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export interface UploadData {
  title: string;
  description: string;
  type: MaterialType;
  status: MaterialStatus;
  file?: File;
  courseId?: string;
} 