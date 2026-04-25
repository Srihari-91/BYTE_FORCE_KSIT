import { useState } from 'react';
import { FileDown, Library, Share2, BarChart3, FileJson } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlowButton from '../components/GlowButton';

const STORAGE_KEY = 'rw_saved_runs_v1';

export default function ExportActionsBar({ data, onExportPdf, exporting }) {
  const [msg, setMsg] = useState('');

  const saveLibrary = () => {
    if (!data?.run_id) return;
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const next = [{ run_id: data.run_id, saved_at: new Date().toISOString(), query: data.query }, ...prev].slice(
        0,
        50,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMsg('Saved to in-browser library.');
    } catch {
      setMsg('Could not save locally.');
    }
    setTimeout(() => setMsg(''), 3200);
  };

  const shareSession = async () => {
    const text = `${window.location.origin}${window.location.pathname} · run ${data?.run_id || 'n/a'}`;
    try {
      await navigator.clipboard.writeText(text);
      setMsg('Session link copied to clipboard.');
    } catch {
      setMsg('Clipboard unavailable.');
    }
    setTimeout(() => setMsg(''), 3200);
  };

  const downloadJson = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportEvidence = () => {
    if (!data) return;
    const payload = {
      run_id: data.run_id,
      selection: data.selection,
      top_papers: data.top_papers,
      key_points: data.key_points,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    downloadJson(blob, `evidence-${data.run_id || 'run'}.json`);
  };

  const exportChartsMeta = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify({ run_id: data.run_id, note: 'Chart snapshots: capture from UI' }, null, 2)], {
      type: 'application/json',
    });
    downloadJson(blob, `charts-meta-${data.run_id || 'run'}.json`);
  };

  return (
    <GlassCard className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-lg font-bold text-white">Executive actions</h3>
        <p className="mt-1 text-sm text-slate-500">PDF uses your existing export endpoint; other actions are client-side.</p>
        {msg && <p className="mt-2 text-xs text-emerald-400/90">{msg}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <GlowButton variant="primary" disabled={!data?.run_id || exporting} onClick={onExportPdf}>
          <FileDown className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export PDF'}
        </GlowButton>
        <GlowButton variant="ghost" disabled={!data?.run_id} onClick={saveLibrary}>
          <Library className="h-4 w-4" />
          Save to library
        </GlowButton>
        <GlowButton variant="ghost" onClick={shareSession}>
          <Share2 className="h-4 w-4" />
          Share session
        </GlowButton>
        <GlowButton variant="ghost" onClick={exportChartsMeta}>
          <BarChart3 className="h-4 w-4" />
          Charts meta
        </GlowButton>
        <GlowButton variant="ghost" onClick={exportEvidence}>
          <FileJson className="h-4 w-4" />
          Evidence JSON
        </GlowButton>
      </div>
    </GlassCard>
  );
}
