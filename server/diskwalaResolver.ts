export interface ResolverResult {
  ok: boolean;
  error?: string;
  message?: string;
  result?: {
    id: string;
    originalUrl: string;
    title: string;
    fileName: string;
    fileSize: string;
    fileSizeBytes: number;
    fileType: 'video' | 'audio' | 'document' | 'archive' | 'image' | 'file';
    mimeType?: string;
    downloadUrl: string;
    streamUrl?: string;
    vlcUrl?: string;
    mxPlayerUrl?: string;
    thumbnailUrl?: string;
    uploaderName?: string;
    resolvedAt: string;
    sourceEngine: string;
  };
}

/**
 * Extracts DiskWala file ID or normalizes the link.
 */
export function extractDiskWalaId(inputUrl: string): { id: string | null; normalizedUrl: string } {
  const trimmed = inputUrl.trim();

  // Check if it's already an ID
  if (/^[a-fA-F0-9]{20,32}$/.test(trimmed)) {
    return {
      id: trimmed,
      normalizedUrl: `https://www.diskwala.com/app/${trimmed}`,
    };
  }

  // Regex patterns for DiskWala URLs
  const patterns = [
    /https?:\/\/(?:www\.)?diskwala\.com\/app\/([a-zA-Z0-9_\-]+)/i,
    /https?:\/\/(?:www\.)?diskwala\.com\/file\/([a-zA-Z0-9_\-]+)/i,
    /https?:\/\/(?:www\.)?diskwala\.com\/([a-zA-Z0-9_\-]+)/i,
    /https?:\/\/(?:www\.)?thediskwala\.com\/(?:app\/|file\/)?([a-zA-Z0-9_\-]+)/i,
    /https?:\/\/(?:www\.)?diskwala\.fun\/(?:diskwala\/)?([a-zA-Z0-9_\-]+)/i,
    /https?:\/\/(?:www\.)?dw\.link\/([a-zA-Z0-9_\-]+)/i,
    /https?:\/\/(?:www\.)?diskflow\.me\/([a-zA-Z0-9_\-]+)/i,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1] && match[1] !== 'diskwala' && match[1] !== 'app') {
      return {
        id: match[1],
        normalizedUrl: `https://www.diskwala.com/app/${match[1]}`,
      };
    }
  }

  // Generic fallback if it's a URL
  try {
    const parsed = new URL(trimmed);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.length >= 8) {
      return {
        id: lastPart,
        normalizedUrl: `https://www.diskwala.com/app/${lastPart}`,
      };
    }
  } catch {
    // not a valid URL
  }

  return { id: null, normalizedUrl: trimmed };
}

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Determines file type classification
 */
function classifyFileType(fileNameOrExt: string, mime?: string): 'video' | 'audio' | 'document' | 'archive' | 'image' | 'file' {
  const lower = (fileNameOrExt || '').toLowerCase();
  const mimeLower = (mime || '').toLowerCase();

  if (mimeLower.startsWith('video/') || /\.(mp4|mkv|webm|avi|mov|flv|m4v|3gp|ts)$/i.test(lower)) {
    return 'video';
  }
  if (mimeLower.startsWith('audio/') || /\.(mp3|aac|wav|ogg|flac|m4a|opus)$/i.test(lower)) {
    return 'audio';
  }
  if (mimeLower.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(lower)) {
    return 'image';
  }
  if (/\.(zip|rar|7z|tar|gz|bz2|xz)$/i.test(lower)) {
    return 'archive';
  }
  if (/\.(pdf|docx?|xlsx?|pptx?|txt|epub|odt)$/i.test(lower) || mimeLower.includes('pdf') || mimeLower.includes('document')) {
    return 'document';
  }
  return 'file';
}

/**
 * Primary resolver: Queries the specialized Diskwala link resolver API.
 */
async function resolveViaDiskwalaFun(normalizedUrl: string): Promise<ResolverResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('https://diskwala.fun/api/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://diskwala.fun',
        'Referer': 'https://diskwala.fun/diskwala',
      },
      body: JSON.stringify({ url: normalizedUrl }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          return { ok: false, error: 'upstream_error', message: errorJson.message };
        }
      } catch {
        // ignore
      }
      return null;
    }

    const data = await res.json();
    if (data.ok && data.result) {
      const r = data.result;
      const downloadUrl = r.downloadUrl || r.streamUrl || r.watchUrl || '';
      const streamUrl = r.watchUrl || r.streamUrl || r.downloadUrl || '';
      const title = r.title || r.fileName || 'DiskWala Shared File';
      const fileType = classifyFileType(title);
      const fileSize = r.fileSize || 'Unknown Size';

      return {
        ok: true,
        result: {
          id: r.id || extractDiskWalaId(normalizedUrl).id || 'file',
          originalUrl: normalizedUrl,
          title,
          fileName: r.fileName || title,
          fileSize,
          fileSizeBytes: r.fileSizeBytes || 0,
          fileType,
          downloadUrl,
          streamUrl: streamUrl !== downloadUrl ? streamUrl : undefined,
          vlcUrl: streamUrl ? `vlc://${streamUrl}` : undefined,
          mxPlayerUrl: streamUrl ? `intent:${streamUrl}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;end` : undefined,
          thumbnailUrl: r.thumbnail,
          uploaderName: r.uploader || 'DiskWala Creator',
          resolvedAt: new Date().toISOString(),
          sourceEngine: 'DiskWala Resolver (Fast Engine)',
        },
      };
    } else if (data.message) {
      return { ok: false, error: data.error || 'resolve_error', message: data.message };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[Resolver] diskwala.fun failed:', errorMsg);
  }
  return null;
}

/**
 * Secondary resolver: Parses DiskWala web page metadata.
 */
async function resolveViaWebScraper(normalizedUrl: string, id: string): Promise<ResolverResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://www.diskwala.com/app/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.status === 404) {
      return { ok: false, error: 'not_found', message: `DiskWala file ID '${id}' was not found or was removed by the creator.` };
    }

    const html = await res.text();
    // Extract metadata from OpenGraph or Title tags
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);

    let title = titleMatch ? titleMatch[1].trim() : `DiskWala File (${id})`;
    if (title.includes('Free Unlimited Cloud Storage')) {
      title = `DiskWala File (${id})`;
    }

    // Check if there is an active direct link or preview
    return {
      ok: true,
      result: {
        id,
        originalUrl: normalizedUrl,
        title,
        fileName: title,
        fileSize: 'Cloud Stored',
        fileSizeBytes: 0,
        fileType: classifyFileType(title),
        downloadUrl: `https://www.diskwala.com/app/${id}`,
        thumbnailUrl: imageMatch ? imageMatch[1] : undefined,
        uploaderName: descMatch ? descMatch[1] : 'DiskWala User',
        resolvedAt: new Date().toISOString(),
        sourceEngine: 'DiskWala Web Inspector',
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[Resolver] Web scraper error:', errorMsg);
  }
  return null;
}

/**
 * Master resolve function with multi-engine fallback.
 */
export async function resolveDiskWalaLink(inputUrl: string): Promise<ResolverResult> {
  const { id, normalizedUrl } = extractDiskWalaId(inputUrl);

  if (!id) {
    return {
      ok: false,
      error: 'invalid_url',
      message: 'Invalid DiskWala URL format. Please provide a valid link like https://www.diskwala.com/app/<id> or https://dw.link/<id>.',
    };
  }

  // Demo / Showcase sample ID support so the bot can be tested instantly!
  if (id.toLowerCase() === 'demo' || id === 'sample' || id === 'test') {
    return {
      ok: true,
      result: {
        id: 'demo-sample-2026',
        originalUrl: normalizedUrl,
        title: 'Big_Buck_Bunny_1080p_DiskWala_FastStream.mp4',
        fileName: 'Big_Buck_Bunny_1080p_DiskWala_FastStream.mp4',
        fileSize: '158.40 MB',
        fileSizeBytes: 166094438,
        fileType: 'video',
        mimeType: 'video/mp4',
        downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        vlcUrl: 'vlc://https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        mxPlayerUrl: 'intent:https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4#Intent;package=com.mxtech.videoplayer.ad;type=video/*;end',
        thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&auto=format&fit=crop&q=80',
        uploaderName: 'DiskWala Official Media',
        resolvedAt: new Date().toISOString(),
        sourceEngine: 'DiskWala Verification Engine (Verified Sample)',
      },
    };
  }

  // 1. Try Primary Online Diskwala Resolver
  const funResult = await resolveViaDiskwalaFun(normalizedUrl);
  if (funResult && funResult.ok) {
    return funResult;
  }
  if (funResult && funResult.error === 'upstream_error' && funResult.message?.includes('404')) {
    return {
      ok: false,
      error: 'not_found',
      message: `The file was not found on DiskWala. Upstream returned HTTP 404 (ID: ${id}). The link might be expired or deleted by the uploader.`,
    };
  }

  // 2. Try Web Scraper fallback
  const webResult = await resolveViaWebScraper(normalizedUrl, id);
  if (webResult && webResult.ok) {
    return webResult;
  }

  return {
    ok: false,
    error: 'resolution_failed',
    message: funResult?.message || `Unable to resolve DiskWala link '${inputUrl}'. Please check that the link is active and accessible.`,
  };
}
