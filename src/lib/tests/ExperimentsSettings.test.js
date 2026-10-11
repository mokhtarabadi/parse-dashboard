/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import renderer from 'react-test-renderer';
import './renderWithAct';

// react-router needs TextEncoder, missing in this jsdom env. Polyfill from
// node util first: later require() calls honor order (unlike imports), and
// the subject chain pulls in react-router through the Sidebar.
const nodeUtil = require('util');
if (!global.TextEncoder) {
  global.TextEncoder = nodeUtil.TextEncoder;
}
if (!global.TextDecoder) {
  global.TextDecoder = nodeUtil.TextDecoder;
}

// NOTE: this repo's custom preprocessor runs plain babel without the
// jest-hoist plugin, so subjects must be require()d AFTER these mocks.
jest.mock('parse', () => ({
  __esModule: true,
  default: {
    _request: jest.fn(),
    Cloud: { run: jest.fn() },
  },
}));

// 'context/*' has no jest resolution (preprocessor only rewrites
// stylesheets/lib/components/dashboard), so serve it virtually. The view,
// DashboardView, and Sidebar all consume this same mock object.
let MockCurrentApp = null;
jest.mock(
  'context/currentApp',
  () => {
    const React = require('react');
    MockCurrentApp = React.createContext(null);
    return { CurrentApp: MockCurrentApp };
  },
  { virtual: true }
);

// Mock Popover to avoid createPortal issues with react-test-renderer
// (same workaround as ScriptResponseModal.test.js).
jest.mock('../../components/Popover/Popover.react', () => {
  const React = require('react');
  return class Popover extends React.Component {
    render() {
      return <div>{this.props.children}</div>;
    }
  };
});

const ExperimentsSettings = require('../../dashboard/Settings/ExperimentsSettings.react').default;
const Parse = require('parse').default;
const { MemoryRouter } = require('react-router');

const appContext = {
  slug: 'test',
  name: 'Test',
  hasCheckedForMigraton: true,
  serverInfo: { features: {}, error: null },
  apps: [{ slug: 'test', name: 'Test' }],
  primaryBackgroundColor: '#ffffff',
  secondaryBackgroundColor: '#000000',
};

function setPath() {
  window.history.pushState({}, '', '/apps/test/settings/experiments');
}

async function renderView() {
  let component = null;
  await act(async () => {
    component = renderer.create(
      <MemoryRouter initialEntries={['/apps/test/settings/experiments']}>
        <MockCurrentApp.Provider value={appContext}>
          <ExperimentsSettings />
        </MockCurrentApp.Provider>
      </MemoryRouter>
    );
  });
  return component;
}

function mockConfig(experiments, enabled) {
  Parse._request.mockImplementation(async (method, path, body) => {
    if (method === 'GET') {
      return { params: { ab_enabled: !!enabled, ab_experiments: experiments } };
    }
    mockConfig.lastPut = body;
    return {};
  });
  mockConfig.lastPut = null;
}

beforeEach(() => {
  setPath();
  mockConfig([], false);
  Parse.Cloud.run.mockReset();
  window.confirm = jest.fn(() => true);
  window.prompt = jest.fn(() => 'CONFIRM');
  // Sidebar fetches the mount path on render; stub the user lookup.
  global.fetch = jest.fn(() => Promise.resolve({ headers: { get: () => '' } }));
});

describe('ExperimentsSettings', () => {
  test('empty state offers seed action', async () => {
    const component = await renderView();
    const seed = component.root.findByProps({ 'data-testid': 'seed-sample-button' });
    expect(seed).toBeTruthy();
  });

  test('malformed entry warns and blocks save', async () => {
    mockConfig([{ key: '', traffic_pct: 200, target: 'new', start_iso: '' }], true);
    const component = await renderView();
    const warnings = component.root.findByProps({ 'data-testid': 'exp-warnings-0' });
    expect(warnings.findAllByType('li').length).toBeGreaterThan(0);
    const save = component.root.findAllByProps({ value: 'Save' })[0];
    expect(save.props.disabled).toBe(true);
  });

  test('kill asks confirm and persists killed flag', async () => {
    mockConfig([{ key: 'vip_for_new_10', traffic_pct: 10, target: 'new', start_iso: '' }], true);
    const component = await renderView();
    const kill = component.root.findAllByProps({ value: 'Kill' })[0];
    await act(async () => {
      kill.props.onClick();
    });
    expect(window.confirm).toHaveBeenCalled();
    expect(mockConfig.lastPut.params.ab_experiments[0].killed).toBe(true);
  });

  test('compare failure shows error state', async () => {
    mockConfig([{ key: 'vip_for_new_10', traffic_pct: 10, target: 'new', start_iso: '' }], true);
    Parse.Cloud.run.mockRejectedValue(new Error('missing'));
    const component = await renderView();
    const compare = component.root.findAllByProps({ value: 'Compare A vs B' })[0];
    await act(async () => {
      compare.props.onClick();
    });
    expect(component.root.findByProps({ 'data-testid': 'compare-error' })).toBeTruthy();
  });

  test('compare with no arms shows empty state', async () => {
    mockConfig([{ key: 'vip_for_new_10', traffic_pct: 10, target: 'new', start_iso: '' }], true);
    Parse.Cloud.run.mockResolvedValue({});
    const component = await renderView();
    const compare = component.root.findAllByProps({ value: 'Compare A vs B' })[0];
    await act(async () => {
      compare.props.onClick();
    });
    expect(component.root.findByProps({ 'data-testid': 'compare-empty' })).toBeTruthy();
  });

  test('preview matches shared vector 86', async () => {
    mockConfig([{ key: 'vip_for_new_10', traffic_pct: 100, target: 'new', start_iso: '' }], true);
    const component = await renderView();
    const input = component.root.findByProps({ 'data-testid': 'preview-userid' });
    await act(async () => {
      input.props.onChange({ target: { value: 'vftE0NKr0C' } });
    });
    expect(component.root.findByProps({ 'data-testid': 'preview-bucket' }).children).toEqual([
      '86',
    ]);
    expect(component.root.findByProps({ 'data-testid': 'preview-arm' }).children).toEqual([
      'variant',
    ]);
  });
});
