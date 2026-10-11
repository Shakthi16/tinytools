export const TIKTOK_LIMIT = 4000;
export const X_LIMIT = 280;
export const FOCUS_SECONDS = 25 * 60;

export const characterCount = (text: string) => Array.from(text).length;

export const STOP_WORDS = new Set([
  'the', 'and', 'of', 'to', 'in', 'a', 'is', 'that', 'for', 'on', 'with', 'as',
  'by', 'at', 'from', 'it', 'this', 'be', 'are', 'was', 'or', 'an', 'not',
  'your', 'all', 'have', 'new', 'more', 'so', 'if', 'out', 'up', 'do', 'my',
  'we', 'you', 'he', 'she', 'they', 'them', 'their', 'our', 'us', 'me', 'him',
  'her', 'its', 'who', 'which', 'what', 'where', 'when', 'why', 'how', 'can',
  'will', 'just', 'should', 'could', 'would', 'then', 'than', 'but', 'about',
]);

export interface WordCountStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingMinutes: number;
  readingSeconds: number;
  speakingMinutes: number;
  speakingSeconds: number;
}

export function extractWords(text: string): string[] {
  if (!text.trim()) return [];
  // Use Intl.Segmenter if available for non-spaced languages (Chinese, Japanese, etc.)
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      return segments
        .filter((s) => s.isWordLike)
        .map((s) => s.segment);
    } catch {
      // Fallback
    }
  }
  // Matches letters/numbers including contractions (don't, it's) and hyphenated words (state-of-the-art)
  const matches = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  return matches ? Array.from(matches) : [];
}

export function getWordCountStats(
  text: string,
  readingWpm = 250,
  speakingWpm = 130
): WordCountStats {
  const wordsList = extractWords(text);
  const words = wordsList.length;
  const characters = Array.from(text).length;
  const charactersNoSpaces = Array.from(text.replace(/\s+/g, '')).length;

  // Sentences split by [.!?]+ followed by whitespace or end of string
  const sentenceMatches = text.trim() ? text.trim().split(/(?<=[.!?])\s+/).filter(Boolean) : [];
  const sentences = sentenceMatches.length || (words > 0 ? 1 : 0);

  // Paragraphs split by one or more blank lines
  const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(Boolean).length : 0;
  const lines = text ? text.split('\n').length : 0;

  const readingTotalSeconds = words > 0 ? Math.ceil((words / Math.max(1, readingWpm)) * 60) : 0;
  const speakingTotalSeconds = words > 0 ? Math.ceil((words / Math.max(1, speakingWpm)) * 60) : 0;

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    readingMinutes: Math.floor(readingTotalSeconds / 60),
    readingSeconds: readingTotalSeconds % 60,
    speakingMinutes: Math.floor(speakingTotalSeconds / 60),
    speakingSeconds: speakingTotalSeconds % 60,
  };
}

export interface KeywordDensity {
  phrase: string;
  count: number;
  density: number; // percentage e.g. 3.5
}

export function getTopKeywords(
  text: string,
  ngram = 1,
  ignoreStopWords = true
): KeywordDensity[] {
  const rawWords = extractWords(text).map((w) => w.toLowerCase());
  if (rawWords.length < ngram) return [];

  const counts = new Map<string, number>();
  let totalPhrases = 0;

  for (let i = 0; i <= rawWords.length - ngram; i++) {
    const slice = rawWords.slice(i, i + ngram);

    // If ignoring stop words for 1-word, skip stop word
    if (ignoreStopWords) {
      const first = slice[0];
      const last = slice[slice.length - 1];
      if (ngram === 1 && first && STOP_WORDS.has(first)) continue;
      // For multi-word, skip if both first and last are stop words
      if (ngram > 1 && first && last && STOP_WORDS.has(first) && STOP_WORDS.has(last)) {
        continue;
      }
    }

    const phrase = slice.join(' ');
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    totalPhrases++;
  }

  const results: KeywordDensity[] = [];
  counts.forEach((count, phrase) => {
    results.push({
      phrase,
      count,
      density: totalPhrases > 0 ? Number(((count / totalPhrases) * 100).toFixed(1)) : 0,
    });
  });

  return results.sort((a, b) => b.count - a.count || b.density - a.density).slice(0, 10);
}

export interface CleanLinkResult {
  cleanedText: string;
  cleanedUrls: string[];
  removedParams: string[];
  removedCount: number;
  unwrappedCount: number;
}

export function cleanLinkDetailed(
  input: string,
  options: {
    stripAllParams?: boolean;
    preserveAffiliate?: boolean;
    customParams?: string[];
  } = {}
): CleanLinkResult {
  const lines = input.split('\n');
  const removedParamsSet = new Set<string>();
  let unwrappedCount = 0;
  let totalRemovedCount = 0;

  const trackingParamRegex = /^(utm_[a-z0-9_]*|fbclid|gclid|dclid|msclkid|twclid|gbraid|wbraid|igshid|mc_eid|mc_cid|_hsenc|_hsmi|si|spm|scm|tt_medium|tt_content|_r|checksum|ref_src|ref_url)$/i;

  const cleanedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Check if it's a URL or contains a URL
    const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
    if (!urlMatch) return line;

    const rawUrl = urlMatch[0];
    try {
      let parsed = new URL(rawUrl);

      // Unwrap Google redirects (e.g., google.com/url?q=https://...)
      if (
        (parsed.hostname.includes('google.') || parsed.hostname === 'google.com') &&
        parsed.pathname === '/url' &&
        (parsed.searchParams.has('q') || parsed.searchParams.has('url'))
      ) {
        const unwrapped = parsed.searchParams.get('q') || parsed.searchParams.get('url');
        if (unwrapped) {
          parsed = new URL(unwrapped);
          unwrappedCount++;
        }
      }

      // Unwrap Facebook link shims (e.g., l.facebook.com/l.php?u=https://...)
      if (
        parsed.hostname.includes('facebook.com') &&
        parsed.pathname.includes('/l.php') &&
        parsed.searchParams.has('u')
      ) {
        const unwrapped = parsed.searchParams.get('u');
        if (unwrapped) {
          parsed = new URL(unwrapped);
          unwrappedCount++;
        }
      }

      // Clean Amazon links to clean canonical format (amazon.com/dp/ASIN)
      if (parsed.hostname.includes('amazon.')) {
        const asinMatch = parsed.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
        if (asinMatch) {
          parsed.pathname = `/dp/${asinMatch[1]}`;
        }
      }

      // Strip query parameters
      if (options.stripAllParams) {
        const keys = Array.from(parsed.searchParams.keys());
        keys.forEach((k) => {
          removedParamsSet.add(k);
          totalRemovedCount++;
          parsed.searchParams.delete(k);
        });
      } else {
        const keys = Array.from(parsed.searchParams.keys());
        keys.forEach((k) => {
          const isTracking = trackingParamRegex.test(k);
          const isCustom = options.customParams?.some(
            (c) => c.toLowerCase() === k.toLowerCase()
          );
          const isAffiliate = /^(tag|aff|affiliate|ref)$/i.test(k);

          if (isAffiliate && options.preserveAffiliate) {
            return; // keep affiliate tag
          }

          if (isTracking || isCustom || (isAffiliate && !options.preserveAffiliate)) {
            removedParamsSet.add(k);
            totalRemovedCount++;
            parsed.searchParams.delete(k);
          }
        });
      }

      const cleanedStr = parsed.toString();
      return line.replace(rawUrl, cleanedStr);
    } catch {
      return line;
    }
  });

  return {
    cleanedText: cleanedLines.join('\n'),
    cleanedUrls: cleanedLines.filter((l) => /^https?:\/\//i.test(l.trim())),
    removedParams: Array.from(removedParamsSet),
    removedCount: totalRemovedCount,
    unwrappedCount,
  };
}

export function splitThread(text: string, limit = X_LIMIT): string[] {
  const safeLimit = Math.max(1, Math.floor(limit));
  const result: string[] = [];
  let rest = Array.from(text.trim());
  while (rest.length) {
    let cut = Math.min(safeLimit, rest.length);
    if (rest.length > safeLimit) {
      const space = rest.slice(0, safeLimit + 1).lastIndexOf(' ');
      if (space > safeLimit / 2) cut = space;
    }
    result.push(rest.slice(0, cut).join('').trim());
    rest = rest.slice(cut);
    while (rest[0] === ' ') rest.shift();
  }
  return result;
}

export function cleanMarkdown(t: string): string {
  return t
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1') // preserve code content
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_~]/g, '');
}

export function cleanLink(t: string): string {
  const result = cleanLinkDetailed(t);
  return result.cleanedText;
}

export function transformText(
  id: string,
  t: string,
  mode: string,
  find: string,
  replace: string
): string {
  const words = t
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

  switch (id) {
    case 'list-sorter': {
      const lines = t
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      return (mode === 'Z–A' ? lines.reverse() : lines).join('\n');
    }
    case 'duplicate-remover':
      return [...new Set(t.split('\n'))].join('\n');
    case 'find-replace':
      return find ? t.split(find).join(replace) : t;
    case 'smart-quotes':
      if (mode === 'Straighten' || mode === 'camelCase') {
        return t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
      }
      // Curl mode
      return t
        .replace(/(^|[\s([{<])"/g, '$1“')
        .replace(/"/g, '”')
        .replace(/(^|[\s([{<])'/g, "$1‘")
        .replace(/'/g, '’');
    case 'case-cleaner':
      switch (mode) {
        case 'UPPERCASE':
          return t.toUpperCase();
        case 'lowercase':
          return t.toLowerCase();
        case 'snake_case':
          return words.join('_');
        case 'kebab-case':
          return words.join('-');
        case 'Title Case':
          return t.replace(
            /\b\w+/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
          );
        default:
          return words
            .map((w, i) => (i ? w.charAt(0).toUpperCase() + w.slice(1) : w))
            .join('');
      }
    case 'prompt-debloater':
      return t
        .replace(/^\s*(sure[,!.]?|certainly[!.]?|absolutely[!.]?|of course[!.]?)[^\n]*\n?/i, '')
        .replace(/\n?\s*(let me know if|hope this helps|feel free to ask|as an ai)[\s\S]*$/i, '')
        .replace(/\b(in order to)\b/gi, 'to')
        .replace(/\b(delve into|tapestry of|pivotal role)\b/gi, '')
        .replace(/—/g, ' - ')
        .trim();
    case 'markdown-clean':
      return cleanMarkdown(t);
    case 'instagram-spacer':
      return t.split(/\n\s*\n/).join('\n⠀\n');
    case 'link-cleaner':
      return cleanLink(t);
    default:
      return t;
  }
}
