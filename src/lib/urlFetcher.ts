const CORS_PROXIES = [
  (url: string) =>
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) =>
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) =>
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) =>
    `https://thingproxy.freeboard.io/fetch/${url}`,
];

function extractTextFromHTML(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const removeElements = doc.querySelectorAll(
    'script, style, nav, header, footer, ' +
    'iframe, noscript, aside, .nav, .footer, ' +
    '.header, .menu, .sidebar, .advertisement, ' +
    '.cookie, .popup, .modal, .banner'
  );
  removeElements.forEach((el) => el.remove());

  const jobContainers = doc.querySelectorAll(
    '[class*="job-description"], ' +
    '[class*="jobDescription"], ' +
    '[class*="job_description"], ' +
    '[id*="job-description"], ' +
    '[id*="jobDescription"], ' +
    '[class*="description"], ' +
    '[class*="content"], ' +
    '[class*="details"], ' +
    'article, main, .main-content, ' +
    '[role="main"]'
  );

  let text = '';

  if (jobContainers.length > 0) {
    jobContainers.forEach((container) => {
      text += container.textContent + '\n';
    });
  } else {
    text = doc.body?.textContent || '';
  }

  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/\t/g, ' ')
    .trim()
    .slice(0, 8000);
}

export async function fetchJobFromURL(url: string): Promise<string> {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Please enter a valid URL starting with https://');
  }

  if (url.includes('linkedin.com')) {
    throw new Error(
      'LinkedIn blocks automated access. Open the job, select all text (Ctrl+A), copy (Ctrl+C), and paste it in the Job Description box.'
    );
  }

  let lastError: Error | null = null;

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = CORS_PROXIES[i](url);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: { Accept: 'text/html,application/json,*/*' },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Proxy ${i + 1} failed: ${response.status}`);
      }

      let content = '';

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        content = (json as { contents?: string; content?: string }).contents || (json as { contents?: string; content?: string }).content || '';
      } else {
        content = await response.text();
      }

      if (!content || content.length < 100) {
        throw new Error('Empty response from proxy');
      }

      const extractedText = extractTextFromHTML(content);

      if (extractedText.length < 50) {
        throw new Error('Could not extract meaningful text');
      }

      return extractedText;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  throw new Error(
    'Could not fetch from URL automatically. Please paste the job description manually.'
  );
}
