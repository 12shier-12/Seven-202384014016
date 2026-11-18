// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import App from '../src/App';
import { seedIfEmpty } from '../src/db/seed';

beforeAll(async () => {
  await seedIfEmpty();
});

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

describe('应用冒烟测试', () => {
  it('列表页能渲染示例行程', async () => {
    window.location.hash = '#/';
    render(<App />);

    await waitFor(() => expect(screen.getByText('我的行程')).toBeTruthy());
    await waitFor(() => expect(screen.getAllByText(/京都七日/).length).toBeGreaterThan(0));
  });

  it('打包清单页由规则生成条目', async () => {
    window.location.hash = '#/trip/trip-kyoto/packing';
    render(<App />);

    await waitFor(() => expect(screen.getByText('打包清单')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('护照')).toBeTruthy());
    expect(screen.getByText(/命中 \d+ 条规则/)).toBeTruthy();
  });

  it('时间线页能渲染活动并标出冲突', async () => {
    window.location.hash = '#/trip/trip-kyoto/itinerary';
    render(<App />);

    await waitFor(() => expect(screen.getByText('按天时间线')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('伏见稻荷大社')).toBeTruthy());
    await waitFor(() => expect(screen.getByText(/处活动时间重叠/)).toBeTruthy());
  });
});
