import { chromium } from 'playwright';

export default async (url: string): Promise<string | { file: string, name: string }> => {
  if (!url || url.trim() === "") return "Invalid URL";

  const urlInfo = url.match(/kick\.com\/([^\/]+)\/videos\/([a-f0-9-]+)/);
  
  if (!urlInfo) return "Invalid URL";

  const user = urlInfo[1];
  const uuid = urlInfo[2];

  const browser = await chromium.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--disable-extensions',
      '--disable-popup-blocking',
      '--window-size=1920,1080',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    acceptDownloads: false,
    baseURL: 'https://kick.com',
  });

  await context.setDefaultTimeout(180000);

  const page = await context.newPage();

  await page.goto(`https://kick.com/api/v1/channels/${user}`);
  await page.waitForLoadState('networkidle');

  const bodyJson = await page.evaluate(async (user) => {
    const response = await fetch(`https://kick.com/api/v1/channels/${user}`);
    return response.json();
  }, user);

  let vod: any;
  let ls: any;

  (bodyJson.previous_livestreams || []).forEach((l: { video?: { uuid: string } }) => {
    if (l.video?.uuid === uuid) {
      [vod, ls] = [l.video, l];
    }
  });

  await page.goto(`https://kick.com/api/v1/video/${uuid}`);
  await page.waitForLoadState('networkidle');

  const bodyContentVideoJson = await page.evaluate(async (uuid) => {
    const response = await fetch(`https://kick.com/api/v1/video/${uuid}`);
    return response.json();
  }, uuid);

  if (!vod) vod = bodyContentVideoJson;

  const thumb = ls?.thumbnail?.src || vod.thumbnail?.src || vod.thumbnail?.url;

  const matchThumb = thumb.match(/video_thumbnails\/([^\/]+)\/([^\/]+)\//);

  if (!matchThumb) return 'Thumbnail ID extraction failed';

  const session = matchThumb[1];
  const segment = matchThumb[2];

  const date = new Date(ls?.created_at || ls?.start_time || vod.created_at || vod.start_time);
  const time = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()].join('/');

  await browser.close();

  return {
    file: `https://stream.kick.com/3c81249a5ce0/ivs/v1/196233775518/${session}/${time}/${segment}/media/hls/master.m3u8`,
    name: bodyContentVideoJson.livestream.session_title,
  };
};