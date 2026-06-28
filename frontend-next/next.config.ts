import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// __dirname yo'q (ESM) — fayl yo'lidan papkani olamiz
const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Workspace root'ni shu papkaga qotiramiz.
  // Aks holda Next C:\Users\admin\package-lock.json'ni topib,
  // butun home papkani (Desktop, Downloads, AppData...) "watch" qiladi → notbuk qotadi
  turbopack: {
    root: projectRoot,
  },
};

export default withNextIntl(nextConfig);
