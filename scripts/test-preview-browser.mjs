import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const pr = process.env.PR_NUMBER;
assert.match(pr || '', /^[1-9][0-9]*$/);
const url = 'https://deploy-preview-' + pr + '--dahoon-hospitality.netlify.app';
const publicResponse = await fetch(url + '/api/content/published');
assert.equal(publicResponse.status, 200);
const publicContent = await publicResponse.json();
const hero = publicContent.published?.heroPhoto;
assert.ok(hero?.imageUrl, 'Published hero media URL is missing');
const expectedTag = hero.mediaType === 'video' || /\\.(mp4|webm)(?:[?#]|$)/i.test(hero.imageUrl) ? 'video' : 'img';
console.log('Published hero expected media element:', expectedTag);
const browser = await chromium.launch({ headless: true });
await mkdir('test-artifacts', { recursive: true });

async function checkViewport(label, device) {
  const context = await browser.newContext(device);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    assert.equal(response?.status(), 200, label + ': preview HTML unavailable');
    await page.locator('#home h1').waitFor({ state: 'visible', timeout: 30000 });
    const title = await page.locator('#home h1').innerText();
    assert.ok(title.trim().length > 0, label + ': missing hero heading');
    console.log('[PASS] ' + label + ': React home content is rendered');

    // Wait for asynchronous published content hydration, not the initial
    // default image rendered before /api/content/published finishes loading.
    await page.waitForFunction(({ tag, src }) => {
      const el = document.querySelector('#home ' + tag);
      return el && el.getAttribute('src') === src && el.getBoundingClientRect().height > 0;
    }, { tag: expectedTag, src: hero.imageUrl }, { timeout: 30000 });
    const media = page.locator('#home ' + expectedTag).first();
    await media.waitFor({ state: 'visible', timeout: 10000 });
    const tag = await media.evaluate(el => el.tagName.toLowerCase());
    assert.equal(tag, expectedTag);
    if (tag === 'video') {
      const flags = await media.evaluate(el => ({
        autoPlay: el.autoplay,
        loop: el.loop,
        muted: el.muted,
        playsInline: el.playsInline,
        src: el.currentSrc || el.src
      }));
      assert.ok(flags.autoPlay && flags.loop && flags.muted && flags.playsInline && flags.src,
        label + ': representative video playback settings missing');
      const metadataReady = await media.evaluate(video => {
        if (video.readyState >= 1) return Promise.resolve(true);
        return new Promise(resolve => {
          const timer = window.setTimeout(() => finish(false), 20000);
          const finish = success => {
            window.clearTimeout(timer);
            video.removeEventListener('loadedmetadata', onLoad);
            video.removeEventListener('error', onError);
            resolve(success);
          };
          const onLoad = () => finish(true);
          const onError = () => finish(false);
          video.addEventListener('loadedmetadata', onLoad, { once: true });
          video.addEventListener('error', onError, { once: true });
        });
      });
      assert.equal(metadataReady, true, label + ': representative video metadata could not be loaded');
      console.log('[PASS] ' + label + ': published video URL and metadata loaded');
    } else {
      const src = await media.getAttribute('src');
      assert.equal(src, hero.imageUrl, label + ': published image URL mismatch');
    }
    console.log('[PASS] ' + label + ': published representative ' + tag + ' visible');

    const home = page.locator('#home');
    assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
    const japaneseCopy = await home.innerText();
    for (const [language, expectedLang] of [['한국어', 'ko'], ['English', 'en'], ['日本語', 'ja']]) {
      await page.locator('header').getByRole('button', { name: language, exact: true }).first().click();
      await page.waitForFunction(lang => document.documentElement.lang === lang, expectedLang, { timeout: 8000 });
      if (expectedLang !== 'ja') {
        assert.notEqual(await home.innerText(), japaneseCopy, label + ': translated content did not change to ' + expectedLang);
      }
      console.log('[PASS] ' + label + ': switched language to ' + expectedLang);
    }
    if (device.isMobile) {
      const menu = page.getByRole('button', { name: 'Navigation Menu' }).first();
      await menu.click();
      assert.ok(await page.locator('header').getByRole('button', { name: '한국어', exact: true }).count() >= 1);
      console.log('[PASS] ' + label + ': mobile navigation menu opens');
    }
    const overflow = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
    assert.ok(overflow <= 4, label + ': horizontal overflow of ' + overflow + 'px');
    console.log('[PASS] ' + label + ': no document-wide horizontal overflow');

    await page.screenshot({ path: 'test-artifacts/' + label + '.png', fullPage: false });
    assert.deepEqual(errors, [], label + ': unhandled JavaScript page errors');
    console.log('[PASS] ' + label + ': no unhandled JavaScript errors');
  } finally {
    await context.close();
  }
}

try {
  await checkViewport('desktop', { viewport: { width: 1365, height: 900 } });
  await checkViewport('mobile', {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  console.log('All preview browser smoke tests passed.');
} finally {
  await browser.close();
}
