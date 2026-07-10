import sanitizeHtml from 'sanitize-html';
import xss from 'xss';

const allowedTags = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img',
];

const allowedAttributes: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  '*': ['class'],
};

export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' },
      }),
    },
  });
}

export function sanitizeText(text: string): string {
  return xss(text, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
}

export function sanitizeInput(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeText(value.trim());
  if (Array.isArray(value)) return value.map(sanitizeInput);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeInput(v)])
    );
  }
  return value;
}
