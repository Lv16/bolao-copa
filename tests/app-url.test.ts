import assert from 'node:assert/strict';
import test from 'node:test';

import { getAppUrl } from '../lib/app-url';

test('app url prefers APP_URL without trailing slash', () => {
  const previous = process.env.APP_URL;
  process.env.APP_URL = 'https://bolao-copa-happy-cloud.ssr.trapiche.cloud/';

  try {
    assert.equal(getAppUrl(), 'https://bolao-copa-happy-cloud.ssr.trapiche.cloud');
  } finally {
    process.env.APP_URL = previous;
  }
});

test('app url falls back to forwarded headers when APP_URL is absent', () => {
  const previous = process.env.APP_URL;
  delete process.env.APP_URL;

  try {
    const request = new Request('http://internal', {
      headers: {
        'x-forwarded-host': 'example.com',
        'x-forwarded-proto': 'https',
      },
    });

    assert.equal(getAppUrl(request), 'https://example.com');
  } finally {
    process.env.APP_URL = previous;
  }
});
