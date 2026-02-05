// src/config/catalogSource.js

export const DEFAULT_CATALOG_URL =
  "https://raw.githubusercontent.com/tinitiateprime/tinitiate_it_traning_app/main/metacard/qna_catalogcard.json";

// Allow override from env, but default is now metacard/qna_catalogcard.json
export const CATALOG_URL = import.meta.env.VITE_CATALOG_URL || DEFAULT_CATALOG_URL;
