export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export function unescapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#x27;': "'",
  };
  return text.replace(/&(?:amp|lt|gt|quot|#039|#x27);/g, (entity) => map[entity] || entity);
}

export function sanitizeHtml(html: string, allowedTags: string[] = []): string {
  const defaultAllowedTags = [
    'a', 'b', 'i', 'u', 'strong', 'em', 'br', 'p', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
    'table', 'tr', 'td', 'th', 'thead', 'tbody', 'img',
  ];
  
  const allowed = new Set([...defaultAllowedTags, ...allowedTags]);
  
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
  
  return html.replace(tagPattern, (match, tagName) => {
    if (allowed.has(tagName.toLowerCase())) {
      return match;
    }
    return '';
  });
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function wrapInTable(content: string, styles: string = ''): string {
  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%"${styles ? ` style="${styles}"` : ''}>
      <tr>
        <td>
          ${content}
        </td>
      </tr>
    </table>
  `.trim();
}

export function createEmailWrapper(content: string, bodyStyles: string, containerStyles: string, maxWidth: string): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title></title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; width: 100%; word-break: break-word; -webkit-font-smoothing: antialiased; }
    img { border: 0; display: block; height: auto; line-height: 100%; max-width: 100%; text-decoration: none; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { border-collapse: collapse; }
    a { color: inherit; text-decoration: underline; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .stack-column, .stack-column-center { display: block !important; width: 100% !important; max-width: 100% !important; }
      .stack-column-center { text-align: center !important; }
      .mobile-center { text-align: center !important; }
      .mobile-full-width { width: 100% !important; }
      .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
    }
  </style>
</head>
<body style="${bodyStyles}">
  <center style="width: 100%; background: inherit;">
    <!--[if mso | IE]>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: inherit;">
    <tr>
    <td>
    <![endif]-->
    <table class="email-container" role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; ${containerStyles}; max-width: ${maxWidth};" width="${maxWidth.replace('px', '')}">
      ${content}
    </table>
    <!--[if mso | IE]>
    </td>
    </tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>
  `.trim();
}

export function createConditionalComment(content: string, condition: 'mso' | 'IE' | 'mso | IE' = 'mso'): string {
  return `<!--[if ${condition}]>${content}<![endif]-->`;
}
