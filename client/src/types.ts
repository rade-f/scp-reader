export interface Article {
  slug: string;
  title: string;
  series: string | null;
  object_class: string | null;
  source_type: "cn_translated" | "cn_original" | "en_ai_translated";
  html_content: string;
  styles: string[];
  tags: string[];
  raw_en_content?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogItem {
  slug: string;
  title: string;
  object_class?: string;
  source_type?: string;
}

export interface ReadingSettings {
  fontSize: number; // 14 ~ 22px
  maxWidth: number; // 700 ~ 1000px
  theme: "light" | "sepia" | "dark" | "oled";
  fontFamily: "sans" | "serif" | "mono";
}
