import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const pr = process.env.PR_NUMBER;
assert.match(pr || '', /^[1-9][0-9]*$/);
const url = 'https://deploy-preview-' + pr + '--dahoon-hospitality.netlify.app';
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

    const media = page.locator('#home video, #home img').first();
    await media.waitFor({ state: 'visible', timeout: 15000 });
    const tag = await media.evaluate(el => el.tagName.toLowerCase());
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
    } else {
      const src = await media.getAttribute('src');
      assert.ok(src, label + ': representative image src missing');
    }
    console.log('[PASS] ' + label + ': representative ' + tag + ' visible');

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
