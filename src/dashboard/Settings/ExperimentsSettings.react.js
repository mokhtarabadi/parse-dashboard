/*
 * ExperimentsSettings.react.js — Native A/B control room (fork addition).
 *
 * Edits the `ab_enabled` + `ab_experiments` Parse Config params through the
 * same master-key REST path as the Config page (Parse._request with
 * useMasterKey), and reads live arm sizes plus A-vs-B comparison through the
 * getAnalyticsExperiment cloud function. No dashboard-server changes: the
 * browser talks to Parse Server directly with the app's master key, exactly
 * like the Config store does.
 */
import Button from 'components/Button/Button.react';
import DashboardView from 'dashboard/DashboardView.react';
import Field from 'components/Field/Field.react';
import Fieldset from 'components/Fieldset/Fieldset.react';
import Label from 'components/Label/Label.react';
import Parse from 'parse';
import React from 'react';
import TextInput from 'components/TextInput/TextInput.react';
import Toggle from 'components/Toggle/Toggle.react';
import Toolbar from 'components/Toolbar/Toolbar.react';
import Notification from 'dashboard/Data/Browser/Notification.react';
import { CurrentApp } from 'context/currentApp';

const PCT_PRESETS = [0, 10, 25, 50, 100];

function useApp() {
  const context = React.useContext(CurrentApp);
  const app = context && (context.app || context.currentApp || context);
  if (app && typeof app.setParseKeys === 'function') {
    app.setParseKeys();
  }
  return app;
}

async function readAbConfig() {
  const result = await Parse._request('GET', 'config', {}, { useMasterKey: true });
  const params = (result && result.params) || {};
  return {
    enabled: params.ab_enabled === true,
    experiments: Array.isArray(params.ab_experiments) ? params.ab_experiments : [],
  };
}

async function writeAbConfig(patch) {
  await Parse._request('PUT', 'config', { params: patch }, { useMasterKey: true });
}

export default function ExperimentsSettings() {
  useApp();
  const [loading, setLoading] = React.useState(true);
  const [enabled, setEnabled] = React.useState(false);
  const [experiments, setExperiments] = React.useState([]);
  const [compare, setCompare] = React.useState({});
  const [note, setNote] = React.useState(null);
  const [busy, setBusy] = React.useState(null);
  const [drafts, setDrafts] = React.useState({});

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await readAbConfig();
      setEnabled(cfg.enabled);
      setExperiments(cfg.experiments);
      setNote(null);
    } catch {
      setNote({ message: 'Failed to load experiments.', isError: true });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  async function persist(patch, key) {
    setBusy(key);
    try {
      await writeAbConfig(patch);
      await reload();
      setNote({ message: 'Saved.', isError: false });
    } catch {
      setNote({ message: 'Save failed.', isError: true });
    } finally {
      setBusy(null);
    }
  }

  async function toggleGlobal() {
    await persist({ ab_enabled: !enabled }, 'global');
  }

  async function savePct(entry) {
    const pct = drafts[entry.key] !== undefined ? drafts[entry.key] : entry.traffic_pct;
    if (pct < entry.traffic_pct) {
      const typed = window.prompt(
        `Narrowing ${entry.key} from ${entry.traffic_pct}% to ${pct}% corrupts the read. Type CONFIRM to proceed.`
      );
      if (typed !== 'CONFIRM') {
        return;
      }
    }
    const next = experiments.map(e =>
      e && e.key === entry.key ? { ...e, traffic_pct: pct } : e
    );
    await persist({ ab_experiments: next }, entry.key);
  }

  async function killOne(entry) {
    if (!window.confirm(`Kill experiment ${entry.key}? Variant traffic stops immediately.`)) {
      return;
    }
    const next = experiments.map(e => (e && e.key === entry.key ? { ...e, killed: true } : e));
    await persist({ ab_experiments: next }, entry.key);
  }

  async function loadCompare(entry) {
    try {
      const result = await Parse.Cloud.run(
        'getAnalyticsExperiment',
        { experimentKey: entry.key },
        { useMasterKey: true }
      );
      setCompare(prev => ({ ...prev, [entry.key]: result }));
    } catch {
      setNote({ message: 'Comparison failed to load.', isError: true });
    }
  }

  return (
    <DashboardView section="App Settings" subsection="Experiments">
      <Toolbar section="Settings" subsection="Experiments" />
      <Fieldset legend="A/B Experiments">
        {note && <Notification note={note.message} isError={!!note.isError} />}
        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            <Field
              label={<Label text="Framework enabled" description="Global kill-switch. Off means every user gets control behavior." />}
              input={
                <Toggle
                  value={enabled}
                  onChange={toggleGlobal}
                  additionalStyles={{ margin: '6px 0' }}
                />
              }
            />
            {experiments.length === 0 && (
              <p>
                No experiments defined. Add the first map via the Config page (`ab_experiments`) or
                enable the framework seed.
              </p>
            )}
            {experiments.map(entry => {
              const cmp = compare[entry.key];
              const pct = drafts[entry.key] !== undefined ? drafts[entry.key] : entry.traffic_pct;
              return (
                <Fieldset key={entry.key} legend={entry.key + (entry.killed ? ' (killed)' : '')}>
                  <Field
                    label={<Label text="Traffic %" description="Variant share 0–100. Widen-only mid-flight." />}
                    input={
                      <select
                        value={pct}
                        disabled={!!entry.killed || busy === entry.key}
                        onChange={e =>
                          setDrafts(prev => ({ ...prev, [entry.key]: Number(e.target.value) }))
                        }
                      >
                        {PCT_PRESETS.map(p => (
                          <option key={p} value={p}>
                            {p}%
                          </option>
                        ))}
                      </select>
                    }
                  />
                  <Field
                    label={<Label text="Target" description="new = registered after start_iso, all = everybody." />}
                    input={<TextInput value={String(entry.target || 'new')} onChange={() => {}} />}
                  />
                  <Button value="Save" onClick={() => savePct(entry)} />
                  {!entry.killed && (
                    <Button value="Kill" onClick={() => killOne(entry)} />
                  )}
                  <Button value="Compare A vs B" onClick={() => loadCompare(entry)} />
                  {cmp && cmp.arms && (
                    <table>
                      <thead>
                        <tr>
                          <th>Arm</th>
                          <th>Users</th>
                          <th>Payers</th>
                          <th>Revenue</th>
                          <th>Rev/user</th>
                          <th>Day-7</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cmp.arms.map(arm => (
                          <tr key={arm.variant}>
                            <td>{arm.variant}</td>
                            <td>{arm.users}</td>
                            <td>{arm.payers}</td>
                            <td>{arm.revenue_irr}</td>
                            <td>{Math.round(arm.revenue_per_user * 100) / 100}</td>
                            <td>{Math.round(arm.day7_return_rate * 100) + '%'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Fieldset>
              );
            })}
          </>
        )}
      </Fieldset>
    </DashboardView>
  );
}
