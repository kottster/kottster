import { Page } from "../models/page.model";
import { transformToReadable } from "./transformToReadable";

export function getPageTitle(page: Page): string {
  return page.title ?? (
    page.type === 'table' 
      ? (page.config?.table ? transformToReadable(page.config.table) : 'Table page')
      : `Custom page`
  );
}