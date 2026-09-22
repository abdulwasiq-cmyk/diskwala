import path from 'path';
import type { ResolverResult } from './diskwalaResolver.ts';

export const TERABOX_DOMAINS_PATTERN =
  /(?:terabox|terashare|terafileshare|1024tera|1024-tera|tera-box|nephobox|mirrobox|mirrorbox|momerybox|tibibox|gibibox|pebibox|4funbox|dubox|bestclouddrive)/i;

export const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mkv',
  '.webm',
  '.mov',
  '.avi',
  '.m4v',
  '.mpeg',
  '.mpg',
  '.3gp',
  '.ts',
  '.flv',
]);

/**
 * Checks if input text or URL is a TeraBox link.
 */
export function isTeraboxUrl(text: string): boolean {
  if (!text) return false;
  if (TERABOX_DOMAINS_PATTERN.test(text)) return true;
  if (
    /(?:\/s\/|\/share\/init|\/sharing\/link)\?.*?(?:surl=|s\/1)[a-zA-Z0-9_-]+|\/s\/1[a-zA-Z0-9_-]{10,}/i.test(
      text
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Extracts surl (short code) from TeraBox URL.
 */
export function extractTeraBoxSurl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  try {
    const urlObj = new URL(trimmed);
    const surlParam = urlObj.searchParams.get('surl');
    if (surlParam) {
      return surlParam.replace(/^1/, '');
    }
    const match = trimmed.match(/\/s\/(?:1)?([a-zA-Z0-9_-]+)/);
    if (match) {
      return match[1].replace(/^1/, '');
    }
  } catch {
    const m = trimmed.match(/(?:surl=|s\/)(?:1)?([a-zA-Z0-9_-]+)/i);
    if (m) return m[1].replace(/^1/, '');
  }

  // Handle direct short code format
  if (/^(?:1)?[a-zA-Z0-9_-]{8,32}$/.test(trimmed)) {
    return trimmed.replace(/^1/, '');
  }

  return null;
}

export function cleanFilename(filename: string): string {
  if (!filename) return 'terabox_download.mp4';
  try {
    filename = decodeURIComponent(filename);
  } catch {
    // ignore
  }
  filename = path.basename(filename);
  filename = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  filename = filename.trim().replace(/^[. ]+|[. ]+$/g, '');
  return filename || 'terabox_download.mp4';
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Resolves TeraBox links using official Web API and fallback mirrors.
 * Grounded in wroxtaaar/terabox-studio methods.
 */
export async function resolveTeraBoxLink(rawUrl: string): Promise<ResolverResult> {
  const cleanUrl = rawUrl.trim();
  const shortCode = extractTeraBoxSurl(cleanUrl);

  if (!shortCode && !isTeraboxUrl(cleanUrl)) {
    return {
      ok: false,
      error: 'invalid_terabox_url',
      message: 'Invalid TeraBox URL. Supported formats: terabox.com/s/1..., 1024tera.com, etc.',
    };
  }

  // Demo / Showcase sample test support
  if (shortCode && (shortCode.toLowerCase() === 'demo' || shortCode.toLowerCase() === 'sample' || shortCode.toLowerCase() === 'test')) {
    return {
      ok: true,
      result: {
        id: `terabox-${shortCode}`,
        originalUrl: cleanUrl,
        title: 'Nature_Wildlife_4K_TeraBox_FastStream.mp4',
        fileName: 'Nature_Wildlife_4K_TeraBox_FastStream.mp4',
        fileSize: '124.50 MB',
        fileSizeBytes: 130548121,
        fileType: 'video',
        mimeType: 'video/mp4',
        downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        vlcUrl: 'vlc://https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        mxPlayerUrl: 'intent:https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4#Intent;package=com.mxtech.videoplayer.ad;type=video/*;end',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
        uploaderName: 'TeraBox Cloud Share',
        resolvedAt: new Date().toISOString(),
        sourceEngine: 'TeraBox Verification Engine (Sample Stream)',
      },
    };
  }

  const surl = shortCode || '';
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    Referer: 'https://www.terabox.app/',
  };

  let pageText = '';
  let finalUrl = cleanUrl;
  let cookieHeader = '';

  // 1. Fetch initial landing page to collect cookies and jsToken
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(cleanUrl, {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    finalUrl = response.url || cleanUrl;
    pageText = await response.text();
    const rawCookies = response.headers.get('set-cookie') || '';
    if (rawCookies) {
      cookieHeader = rawCookies
        .split(',')
        .map((c) => c.split(';')[0].trim())
        .filter(Boolean)
        .join('; ');
    }
  } catch (fetchErr) {
    console.warn('[TeraBox Resolver] Landing page fetch warning:', fetchErr);
  }

  const finalSurl = extractTeraBoxSurl(finalUrl) || surl;
  const jsTokenMatch =
    pageText.match(/fn\("([A-F0-9]+)"\)/i) ||
    pageText.match(/window\.jsToken\s*=\s*["']([^"']+)["']/i);
  const jsToken = jsTokenMatch ? jsTokenMatch[1] : '';

  // 2. Method A: TeraBox shorturlinfo API (primary method from terabox-studio)
  if (finalSurl) {
    const shortUrlVariations = [
      finalSurl.startsWith('1') ? finalSurl : `1${finalSurl}`,
      finalSurl.replace(/^1/, ''),
    ];

    for (const surlVariant of shortUrlVariations) {
      try {
        const infoApiUrl = `https://www.terabox.app/api/shorturlinfo?app_id=250528&shorturl=${surlVariant}&root=1&web=1&channel=dubox&clienttype=0&jsToken=${jsToken}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const apiRes = await fetch(infoApiUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
            Referer: finalUrl,
            Cookie: cookieHeader,
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (apiRes.ok) {
          const apiData = (await apiRes.json()) as any;
          if (apiData.errno === 0 && Array.isArray(apiData.list) && apiData.list.length > 0) {
            const shareId = apiData.shareid ? String(apiData.shareid) : undefined;
            const uk = apiData.uk ? String(apiData.uk) : undefined;
            const sign = apiData.sign;
            const timestamp = apiData.timestamp ? String(apiData.timestamp) : undefined;
            const item = apiData.list[0];

            const rawFilename = item.server_filename || item.filename || 'TeraBox_File.mp4';
            const filename = cleanFilename(rawFilename);
            const size = parseInt(item.size || '0', 10);
            const ext = path.extname(filename).toLowerCase();
            const isVideo = VIDEO_EXTENSIONS.has(ext) || true;

            let streamUrl: string | undefined;
            if (shareId && uk && sign && timestamp && item.fs_id) {
              streamUrl = `https://www.terabox.app/share/streaming?app_id=250528&web=1&channel=dubox&clienttype=0&shareid=${shareId}&uk=${uk}&fid=${item.fs_id}&sign=${encodeURIComponent(
                sign
              )}&timestamp=${timestamp}&type=M3U8_AUTO_480`;
            }

            const downloadUrl = item.dlink || streamUrl || finalUrl;
            const chosenStream = streamUrl || downloadUrl;

            return {
              ok: true,
              result: {
                id: item.fs_id ? String(item.fs_id) : finalSurl,
                originalUrl: cleanUrl,
                title: filename,
                fileName: filename,
                fileSize: formatBytes(size),
                fileSizeBytes: size,
                fileType: isVideo ? 'video' : 'file',
                mimeType: isVideo ? 'video/mp4' : undefined,
                downloadUrl,
                streamUrl: chosenStream,
                vlcUrl: chosenStream ? `vlc://${chosenStream}` : undefined,
                mxPlayerUrl: chosenStream
                  ? `intent:${chosenStream}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;end`
                  : undefined,
                thumbnailUrl: item.thumbs?.url3 || item.thumbs?.url2 || item.thumbs?.url1,
                uploaderName: 'TeraBox User',
                resolvedAt: new Date().toISOString(),
                sourceEngine: 'TeraBox Studio Engine (Direct API)',
              },
            };
          }
        }
      } catch (err) {
        console.warn('[TeraBox Resolver] shorturlinfo error:', err);
      }
    }

    // 3. Method B: share/list API endpoint
    try {
      const listApiUrl = `https://www.terabox.app/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=${jsToken}&shorturl=${finalSurl}&root=1`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const apiRes = await fetch(listApiUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
          Referer: finalUrl,
          Cookie: cookieHeader,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (apiRes.ok) {
        const apiData = (await apiRes.json()) as any;
        if (apiData.errno === 0 && Array.isArray(apiData.list) && apiData.list.length > 0) {
          const item = apiData.list[0];
          const filename = cleanFilename(item.server_filename || item.filename || 'TeraBox_File.mp4');
          const size = parseInt(item.size || '0', 10);
          const ext = path.extname(filename).toLowerCase();
          const isVideo = VIDEO_EXTENSIONS.has(ext) || true;

          const downloadUrl = item.dlink || finalUrl;

          return {
            ok: true,
            result: {
              id: item.fs_id ? String(item.fs_id) : finalSurl,
              originalUrl: cleanUrl,
              title: filename,
              fileName: filename,
              fileSize: formatBytes(size),
              fileSizeBytes: size,
              fileType: isVideo ? 'video' : 'file',
              mimeType: isVideo ? 'video/mp4' : undefined,
              downloadUrl,
              streamUrl: downloadUrl,
              vlcUrl: `vlc://${downloadUrl}`,
              mxPlayerUrl: `intent:${downloadUrl}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;end`,
              thumbnailUrl: item.thumbs?.url3 || item.thumbs?.url2 || item.thumbs?.url1,
              uploaderName: 'TeraBox User',
              resolvedAt: new Date().toISOString(),
              sourceEngine: 'TeraBox Studio Engine (share/list)',
            },
          };
        }
      }
    } catch (err) {
      console.warn('[TeraBox Resolver] share/list error:', err);
    }
  }

  // 4. Method C: Embedded window.initData from HTML
  const listMatch =
    pageText.match(/window\.initData\s*=\s*({.*?});/s) ||
    pageText.match(/list:\s*(\[\{.*?\}\])/s) ||
    pageText.match(/"list":\s*(\[\{.*?\}\])/s);

  if (listMatch) {
    try {
      const parsed = JSON.parse(listMatch[1]);
      const items = Array.isArray(parsed) ? parsed : parsed.list || [];
      if (items.length > 0) {
        const item = items[0];
        const filename = cleanFilename(item.server_filename || item.filename || 'TeraBox_File.mp4');
        const size = parseInt(item.size || '0', 10);
        return {
          ok: true,
          result: {
            id: item.fs_id ? String(item.fs_id) : finalSurl || 'terabox-file',
            originalUrl: cleanUrl,
            title: filename,
            fileName: filename,
            fileSize: formatBytes(size),
            fileSizeBytes: size,
            fileType: 'video',
            mimeType: 'video/mp4',
            downloadUrl: item.dlink || finalUrl,
            streamUrl: item.dlink || finalUrl,
            vlcUrl: item.dlink ? `vlc://${item.dlink}` : undefined,
            mxPlayerUrl: item.dlink
              ? `intent:${item.dlink}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;end`
              : undefined,
            thumbnailUrl: item.thumbs?.url3 || item.thumbs?.url2,
            uploaderName: 'TeraBox User',
            resolvedAt: new Date().toISOString(),
            sourceEngine: 'TeraBox HTML initData Scraper',
          },
        };
      }
    } catch {
      // ignore
    }
  }

  // 5. Method D: Fast public TeraBox mirror bypass service
  try {
    const mirrorRes = await fetch('https://ytshorts.savetube.me/api/v1/terabox-downloader', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl }),
      signal: AbortSignal.timeout(6000),
    });
    if (mirrorRes.ok) {
      const mirrorData = (await mirrorRes.json()) as any;
      if (mirrorData.response && Array.isArray(mirrorData.response) && mirrorData.response.length > 0) {
        const item = mirrorData.response[0];
        const filename = cleanFilename(item.title || 'TeraBox_Video.mp4');
        const dlink = item.resolutions?.['Fast Download'] || item.resolutions?.['HD Video'] || item.resolutions?.['Auto'] || cleanUrl;
        return {
          ok: true,
          result: {
            id: finalSurl || 'terabox-fast',
            originalUrl: cleanUrl,
            title: filename,
            fileName: filename,
            fileSize: item.size || 'Online Video',
            fileSizeBytes: 0,
            fileType: 'video',
            mimeType: 'video/mp4',
            downloadUrl: dlink,
            streamUrl: dlink,
            vlcUrl: `vlc://${dlink}`,
            mxPlayerUrl: `intent:${dlink}#Intent;package=com.mxtech.videoplayer.ad;type=video/*;end`,
            thumbnailUrl: item.thumbnail,
            uploaderName: 'TeraBox Creator',
            resolvedAt: new Date().toISOString(),
            sourceEngine: 'TeraBox Studio Fast Mirror',
          },
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    ok: false,
    error: 'terabox_resolution_failed',
    message: `Unable to extract download stream for TeraBox link '${cleanUrl}'. Please check that the file is not password-protected and still actively shared.`,
  };
}
