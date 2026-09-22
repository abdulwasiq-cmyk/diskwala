import { resolveDiskWalaLink, extractDiskWalaId, type ResolverResult } from './diskwalaResolver.ts';
import { resolveTeraBoxLink, isTeraboxUrl, extractTeraBoxSurl } from './teraboxResolver.ts';

export type SupportedPlatform = 'diskwala' | 'terabox' | 'unknown';

export interface UnifiedDetection {
  platform: SupportedPlatform;
  url: string;
  idOrSurl: string | null;
}

/**
 * Detects whether an input string is DiskWala or TeraBox
 */
export function detectPlatform(input: string): UnifiedDetection {
  const text = (input || '').trim();

  // TeraBox detection
  if (isTeraboxUrl(text)) {
    return {
      platform: 'terabox',
      url: text,
      idOrSurl: extractTeraBoxSurl(text),
    };
  }

  // DiskWala detection
  const dw = extractDiskWalaId(text);
  if (dw.id) {
    return {
      platform: 'diskwala',
      url: dw.normalizedUrl,
      idOrSurl: dw.id,
    };
  }

  // Check if it's a generic link with terabox keywords
  if (/terabox|1024tera|nephobox|mirrobox|4funbox/i.test(text)) {
    return {
      platform: 'terabox',
      url: text,
      idOrSurl: extractTeraBoxSurl(text),
    };
  }

  return {
    platform: 'unknown',
    url: text,
    idOrSurl: null,
  };
}

/**
 * Resolves any supported link (DiskWala or TeraBox)
 */
export async function resolveAnyLink(url: string): Promise<ResolverResult> {
  const detection = detectPlatform(url);

  if (detection.platform === 'terabox') {
    return await resolveTeraBoxLink(url);
  }

  if (detection.platform === 'diskwala') {
    return await resolveDiskWalaLink(url);
  }

  return {
    ok: false,
    error: 'unsupported_platform',
    message: 'Unsupported link. Please provide a valid DiskWala link (diskwala.com, dw.link) or TeraBox link (terabox.com, 1024tera.com, etc.).',
  };
}
