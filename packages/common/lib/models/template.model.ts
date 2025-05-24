export interface Template {
  key: string;
  name: string;
  pictureUrl: string;
  previewUrl: string;
  requiredDependencies: string[];
  description?: string;
}