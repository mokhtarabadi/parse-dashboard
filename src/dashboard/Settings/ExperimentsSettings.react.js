/*
 * ExperimentsSettings.react.js — Native A/B control room (fork addition).
 *
 * Edits the `ab_enabled` + `ab_experiments` Parse Config params through the
 * same master-key REST path as the Config page (Parse._request with
 * useMasterKey), and reads live arm sizes plus A-vs-B comparison through the
 * getAnalyticsExperiment cloud function. No dashboard-server changes: the
 * browser talks to Parse Server directly with the app's master key, exactly
 * like the Config store does.
 *
 * G1 composer + seed, G2 editable target/start_iso, G3 validation warnings,
 * G4 bucket preview via lib/abBucketPreview (local state only, never saved),
 * G5 compare empty/error states.
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
import { getArm, validateExperiment } from 'lib/abBucketPreview';

const PCT_PRESETS = [0, 10, 25, 50, 100];
const TARGETS = ['new', 'all'];

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

function toDateTimeLocal(iso) {
  // Coerce non-string server values (numeric start_iso must not crash render).
  if (iso === undefined || iso === null) {
    return '';
  }
  return String(iso).slice(0, 16);
}

function toIso(value) {
  // Empty input clears the field; otherwise store UTC ISO-8601.
  if (!value) {
    return '';
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    return value;
  }
  return new Date(ms).toISOString();
}

function blockingWarning(warnings) {
  // Key, traffic, and start-date problems all block save.
  return warnings.some(
    w =>
      w === 'Missing key' ||
      w === 'Traffic must be numeric' ||
      w === 'Traffic must be 0-100' ||
      w === 'Invalid start date'
  );
}

export default function ExperimentsSettings() {
  useApp();
  const [loading, setLoading] = React.useState(true);
  const [enabled, setEnabled] = React.useState(false);
  const [experiments, setExperiments] = React.useState([]);
  const [compare, setCompare] = React.useState({});
  const [compareErr, setCompareErr] = React.useState({});
  const [note, setNote] = React.useState(null);
  const [busy, setBusy] = React.useState(null);
  const [drafts, setDrafts] = React.useState({});
  const [draftTargets, setDraftTargets] = React.useState({});
  const [draftStarts, setDraftStarts] = React.useState({});
  const [composer, setComposer] = React.useState({
    key: '',
    traffic: '',
    target: 'new',
    start: '',
  });
  const [previewKey, setPreviewKey] = React.useState('');
  const [previewUserId, setPreviewUserId] = React.useState('');

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

  function effective(entry) {
    // Merge per-field drafts over the server entry for validate + save.
    const pct = drafts[entry.key] !== undefined ? drafts[entry.key] : entry.traffic_pct;
    const target = draftTargets[entry.key] !== undefined ? draftTargets[entry.key] : entry.target;
    const startIso =
      draftStarts[entry.key] !== undefined ? draftStarts[entry.key] : entry.start_iso;
    return {
      key: entry.key,
      traffic_pct: pct,
      target: target,
      start_iso: startIso,
      killed: entry.killed,
    };
  }

  async function saveEntry(entry) {
    const next_entry = effective(entry);
    if (blockingWarning(validateExperiment(next_entry))) {
      setNote({ message: 'Fix the highlighted problems before saving.', isError: true });
      return;
    }
    if (next_entry.traffic_pct < entry.traffic_pct) {
      const typed = window.prompt(
        `Narrowing ${entry.key} from ${entry.traffic_pct}% to ${next_entry.traffic_pct}% corrupts the read. Type CONFIRM to proceed.`
      );
      if (typed !== 'CONFIRM') {
        return;
      }
    }
    const updated = {
      key: entry.key,
      traffic_pct: next_entry.traffic_pct,
      target: next_entry.target,
      start_iso: next_entry.start_iso,
      killed: entry.killed,
    };
    const next = experiments.map(e => (e && e.key === entry.key ? updated : e));
    await persist({ ab_experiments: next }, entry.key);
  }

  function uniqueKey(base) {
    const taken = {};
    experiments.forEach(e => {
      if (e && e.key) {
        taken[e.key] = true;
      }
    });
    if (!taken[base]) {
      return base;
    }
    let i = 2;
    while (taken[base + '_' + i]) {
      i++;
    }
    return base + '_' + i;
  }

  async function seedSample() {
    const next = experiments.concat([
      {
        key: uniqueKey('sample_exp_1'),
        traffic_pct: 10,
        target: 'new',
        start_iso: new Date().toISOString(),
      },
    ]);
    await persist({ ab_experiments: next }, 'seed');
  }

  async function addComposed() {
    const key = composer.key.trim();
    const traffic = composer.traffic.trim() === '' ? NaN : Number(composer.traffic);
    const candidate = {
      key: key,
      traffic_pct: traffic,
      target: composer.target,
      start_iso: toIso(composer.start),
    };
    if (blockingWarning(validateExperiment(candidate))) {
      setNote({ message: 'Fix the highlighted problems before adding.', isError: true });
      return;
    }
    if (experiments.some(e => e && e.key === key)) {
      setNote({ message: 'An experiment with this key already exists.', isError: true });
      return;
    }
    const next = experiments.concat([candidate]);
    await persist({ ab_experiments: next }, key);
    setComposer({ key: '', traffic: '', target: 'new', start: '' });
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
      setCompareErr(prev => ({ ...prev, [entry.key]: null }));
      setCompare(prev => ({ ...prev, [entry.key]: result }));
    } catch {
      setCompareErr(prev => ({ ...prev, [entry.key]: 'Comparison failed to load.' }));
      setNote({ message: 'Comparison failed to load.', isError: true });
    }
  }

  const previewExpKey = previewKey.trim() || (experiments[0] && experiments[0].key) || '';
  // Pass the full experiment so the arm respects traffic_pct and arms.
  const previewExp = experiments.find(e => e && e.key === previewExpKey) || { key: previewExpKey };
  let preview = null;
  if (previewExpKey && previewUserId) {
    try {
      preview = getArm(previewExp, previewUserId);
    } catch {
      preview = null;
    }
  }
  const composerWarnings = validateExperiment({
    key: composer.key.trim(),
    traffic_pct: composer.traffic.trim() === '' ? NaN : Number(composer.traffic),
    start_iso: toIso(composer.start),
  });

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
              label={
                <Label
                  text="Framework enabled"
                  description="Global kill-switch. Off means every user gets control behavior."
                />
              }
              input={
                <Toggle
                  value={enabled}
                  onChange={toggleGlobal}
                  additionalStyles={{ margin: '6px 0' }}
                />
              }
            />
            {experiments.length === 0 && (
              <Fieldset legend="First experiment">
                <p>No experiments defined. Seed a sample or compose the first map below.</p>
                <span data-testid="seed-sample-button">
                  <Button value="Seed sample experiment" onClick={seedSample} />
                </span>
              </Fieldset>
            )}
            <Fieldset legend="Compose experiment">
              {composerWarnings.length > 0 && (
                <ul>
                  {composerWarnings.map(w => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
              <Field
                label={
                  <Label text="Key" description="Unique experiment key, e.g. vip_for_new_10." />
                }
                input={
                  <input
                    type="text"
                    data-testid="exp-key-input"
                    value={composer.key}
                    placeholder="vip_for_new_10"
                    onChange={e => setComposer(prev => ({ ...prev, key: e.target.value }))}
                  />
                }
              />
              <Field
                label={<Label text="Traffic %" description="Variant share 0–100." />}
                input={
                  <input
                    type="text"
                    data-testid="exp-traffic-input"
                    value={composer.traffic}
                    placeholder="10"
                    onChange={e => setComposer(prev => ({ ...prev, traffic: e.target.value }))}
                  />
                }
              />
              <Field
                label={
                  <Label
                    text="Target"
                    description="new = registered after start_iso, all = everybody."
                  />
                }
                input={
                  <select
                    data-testid="exp-target-select"
                    value={composer.target}
                    onChange={e => setComposer(prev => ({ ...prev, target: e.target.value }))}
                  >
                    {TARGETS.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                }
              />
              <Field
                label={<Label text="Start" description="UTC start; empty means immediately." />}
                input={
                  <input
                    type="datetime-local"
                    data-testid="exp-start-input"
                    value={composer.start}
                    onChange={e => setComposer(prev => ({ ...prev, start: e.target.value }))}
                  />
                }
              />
              <span data-testid="exp-add-button">
                <Button value="Add experiment" onClick={addComposed} />
              </span>
            </Fieldset>
            {experiments.map((entry, index) => {
              const cmp = compare[entry.key];
              const cmpErr = compareErr[entry.key];
              const eff = effective(entry);
              const warnings = validateExperiment(eff);
              const blocked = blockingWarning(warnings);
              const pct = eff.traffic_pct;
              return (
                <Fieldset key={entry.key} legend={entry.key + (entry.killed ? ' (killed)' : '')}>
                  <Field
                    label={
                      <Label
                        text="Traffic %"
                        description="Variant share 0–100. Widen-only mid-flight."
                      />
                    }
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
                    label={
                      <Label
                        text="Target"
                        description="new = registered after start_iso, all = everybody."
                      />
                    }
                    input={
                      <select
                        data-testid={'exp-target-select-' + index}
                        value={eff.target || 'new'}
                        disabled={!!entry.killed || busy === entry.key}
                        onChange={e =>
                          setDraftTargets(prev => ({ ...prev, [entry.key]: e.target.value }))
                        }
                      >
                        {TARGETS.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    }
                  />
                  <Field
                    label={<Label text="Start" description="UTC start; empty means immediately." />}
                    input={
                      <input
                        type="datetime-local"
                        data-testid={'exp-start-input-' + index}
                        value={toDateTimeLocal(eff.start_iso)}
                        disabled={!!entry.killed || busy === entry.key}
                        onChange={e =>
                          setDraftStarts(prev => ({ ...prev, [entry.key]: toIso(e.target.value) }))
                        }
                      />
                    }
                  />
                  {warnings.length > 0 && (
                    <ul data-testid={'exp-warnings-' + index}>
                      {warnings.map(w => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  )}
                  <Button value="Save" onClick={() => saveEntry(entry)} disabled={blocked} />
                  {!entry.killed && <Button value="Kill" onClick={() => killOne(entry)} />}
                  <Button value="Compare A vs B" onClick={() => loadCompare(entry)} />
                  {cmp && Array.isArray(cmp.arms) && cmp.arms.length > 0 ? (
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
                  ) : cmpErr ? (
                    <p data-testid="compare-error">
                      {cmpErr} The getAnalyticsExperiment function may be missing.
                    </p>
                  ) : cmp ? (
                    <p data-testid="compare-empty">No arms reported for this experiment yet.</p>
                  ) : null}
                </Fieldset>
              );
            })}
            {experiments.length > 0 && (
              <Fieldset legend="Arm preview">
                <p>
                  Calculator only. Enter a key and user id to see the bucket and arm. Nothing is
                  saved.
                </p>
                <Field
                  label={
                    <Label text="Experiment key" description="Defaults to the first experiment." />
                  }
                  input={
                    <TextInput
                      value={previewKey}
                      placeholder={(experiments[0] && experiments[0].key) || ''}
                      onChange={value => setPreviewKey(value)}
                    />
                  }
                />
                <Field
                  label={
                    <Label
                      text="User id"
                      description="Hashed with the key to pick a bucket 0–99."
                    />
                  }
                  input={
                    <input
                      type="text"
                      data-testid="preview-userid"
                      value={previewUserId}
                      placeholder="vftE0NKr0C"
                      onChange={e => setPreviewUserId(e.target.value)}
                    />
                  }
                />
                {preview && (
                  <p>
                    Bucket <span data-testid="preview-bucket">{preview.bucket}</span> Arm{' '}
                    <span data-testid="preview-arm">{preview.arm}</span>
                  </p>
                )}
              </Fieldset>
            )}
          </>
        )}
      </Fieldset>
    </DashboardView>
  );
}
