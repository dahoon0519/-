import React, { useEffect, useRef, useState } from 'react';
import { Download, RotateCcw, Save, ShieldCheck, Upload, AlertTriangle } from 'lucide-react';
import { Language } from '../types';
import { apiClient } from '../services/apiClient';

interface RecoveryPoint {
  id: string;
  createdAt: string;
  reason: string;
  hasPublished: boolean;
  hasDraft: boolean;
}
interface BackupExport {
  format: string;
  version: number;
  exportedAt: string;
  published: unknown;
  draft: unknown;
  history: unknown[];
  media: string;
  inquiries: string;
}

export function AdminRecoveryPanel({ currentLang }: { currentLang: Language }) {
  const [backups, setBackups] = useState<RecoveryPoint[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = (ja: string, ko: string, en: string) =>
    currentLang === 'ja' ? ja : currentLang === 'ko' ? ko : en;

  const refresh = async () => {
    const response = await apiClient.get<{ backups: RecoveryPoint[] }>('/api/content/backups');
    setBackups(response.backups || []);
  };
  useEffect(() => {
    refresh().catch(error => setMessage({ error: true, text: error.message }));
  }, []);

  const run = async (job: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await job();
    } catch (error: any) {
      setMessage({ error: true, text: error?.message || 'Operation failed' });
    } finally {
      setBusy(false);
    }
  };

  const download = () => run(async () => {
    const data = await apiClient.get<BackupExport>('/api/content/backups/export');
    if (data.format !== 'dahoon-portfolio-documents') throw new Error('Unexpected backup format');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    try {
      anchor.href = url;
      anchor.download = 'dahoon_portfolio_server_backup_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      URL.revokeObjectURL(url);
    }
    setMessage({ error: false, text: t('サーバーデータをダウンロードしました', '서버 백업을 다운로드했습니다', 'Server backup downloaded') });
  });

  const create = () => run(async () => {
    await apiClient.post('/api/content/backups/create');
    await refresh();
    setMessage({ error: false, text: t('復元ポイントを作成しました', '안전 복원 지점을 만들었습니다', 'Recovery point created') });
  });

  const restore = (id: string, source: 'published' | 'draft') => run(async () => {
    if (!window.confirm(t(
      '選んだ内容を下書きに読み込みます。現在の下書きは別の安全バックアップに保存されます。公開中の内容は変わりません。続行しますか？',
      '선택한 내용을 임시저장으로 불러옵니다. 현재 임시저장은 별도 안전 백업됩니다. 게시 중인 내용은 바뀌지 않습니다. 계속할까요?',
      'Load this recovery point into Draft? The existing draft will be backed up first. The live site will not change.'
    ))) return;
    await apiClient.post('/api/content/backups/restore-draft', { id, source });
    await refresh();
    window.alert(t('下書きに復元しました。ページを再読み込みします。', '임시저장으로 복원했습니다. 페이지를 새로고침합니다.', 'Restored to Draft. Page will reload.'));
    window.location.reload();
  });

  const importFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    run(async () => {
      if (file.size > 20 * 1024 * 1024) throw new Error(t('20MB 以下の JSON を選んでください', '20MB 이하 JSON만 허용됩니다', 'Choose a JSON file under 20 MB'));
      const backup = JSON.parse(await file.text()) as BackupExport;
      if (backup?.format !== 'dahoon-portfolio-documents' || backup.version !== 1) {
        throw new Error(t('以前のブラウザ用バックアップではなく、新しいサーバーバックアップを指定してください。',
          '기존 브라우저 전용 파일이 아닌 새 서버 백업 파일을 선택해주세요.',
          'Please choose a current server backup, not a legacy browser-only file.'));
      }
      const source = backup.published ? 'published' : 'draft';
      if (!window.confirm(t('ファイルの内容を下書きに読み込みますか？公開中の内容は変更しません。',
        '파일을 임시저장으로 불러올까요? 게시 중인 내용은 변경되지 않습니다.',
        'Import as Draft only? The live content will not change.'))) return;
      await apiClient.post('/api/content/backups/import-draft', { backup, source });
      window.alert(t('下書きに読み込みました。ページを再読み込みします。',
        '임시저장으로 불러왔습니다. 페이지를 새로고침합니다.',
        'Imported as Draft. Page will reload.'));
      window.location.reload();
    });
  };

  return (
    <section className="space-y-4 text-xs text-[#3D342C]" aria-label={t('サーバーバックアップ','서버 백업','Server backups')}>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <h4 className="font-semibold flex items-center gap-2 text-emerald-900">
          <ShieldCheck className="w-4 h-4" />
          {t('サーバー保存・安全復元', '서버 저장·안전 복원', 'Server backup & safe recovery')}
        </h4>
        <p className="mt-2 leading-relaxed text-emerald-950">
          {t('公開・下書き・バージョン履歴をサーバーから取得します。公開・復元の前に復元ポイントを作成します。',
            '게시·임시저장·버전 기록을 실제 서버에서 가져옵니다. 게시하거나 버전을 복원하기 전에 자동 복원 지점을 만듭니다.',
            'Export published content, draft and version history from the server. Automatic recovery points precede publishing and version restores.')}
        </p>
        <p className="mt-1 text-[11px] text-amber-900">
          {t('画像・動画の実ファイルとお問い合わせの個人情報は JSON に含まれません。メディア URL の参照のみ保持します。',
            '사진·영상 원본 파일 및 문의자의 개인정보는 JSON에 포함되지 않습니다. 미디어 URL 참조만 보관합니다.',
            'Backup JSON preserves media URLs, not the original Cloudinary/video files. Private inquiries are excluded.')}
        </p>
      </div>

      {message && <div role="status" className={'rounded border p-3 ' + (message.error ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200')}>{message.text}</div>}

      <div className="rounded-lg border border-[#E4DDD2] bg-white p-4 space-y-3">
        <h5 className="font-semibold">{t('サーバーバックアップ', '서버 백업', 'Server export')}</h5>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={download} className="flex items-center gap-2 rounded bg-[#44362C] px-3 py-2 text-white disabled:opacity-50">
            <Download className="w-4 h-4" />{t('JSON をダウンロード', '서버 JSON 다운로드', 'Download server JSON')}
          </button>
          <button type="button" disabled={busy} onClick={create} className="flex items-center gap-2 rounded border px-3 py-2 disabled:opacity-50">
            <Save className="w-4 h-4" />{t('復元ポイントを作成', '안전 복원 지점 생성', 'Create recovery point')}
          </button>
          <label className={'flex items-center gap-2 rounded border px-3 py-2 ' + (busy ? 'opacity-50' : 'cursor-pointer')}>
            <Upload className="w-4 h-4" />{t('JSON を下書きに読込', 'JSON을 임시저장에 불러오기', 'Import JSON into Draft')}
            <input ref={fileRef} type="file" accept=".json,application/json" disabled={busy} className="hidden" onChange={importFile}/>
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-[#E4DDD2] bg-white p-4 space-y-3">
        <h5 className="font-semibold">{t('自動・手動の復元ポイント', '자동·수동 복원 지점', 'Recovery points')}</h5>
        <p className="text-[11px] text-[#6F6559]">
          {t('公開中のページを直接上書きせず、内容を下書きとして読み込みます。',
            '운영 게시물을 직접 덮어쓰지 않고 선택한 내용을 임시저장으로만 복원합니다.',
            'Recovery only loads content into Draft, never overwrites the live site.')}
        </p>
        <button type="button" disabled={busy} onClick={() => run(refresh)} className="rounded border px-3 py-1.5 disabled:opacity-50">
          {t('一覧を更新', '목록 새로고침', 'Refresh list')}
        </button>
        {!backups.length && <p className="text-[#776D61]">{t('復元ポイントはまだありません。', '아직 복원 지점이 없습니다.', 'No recovery points yet.')}</p>}
        {backups.map(item => <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t pt-3">
          <div>
            <p className="font-medium">{item.reason}</p>
            <p className="text-[11px] text-[#776D61]">{new Date(item.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {item.hasPublished && <button disabled={busy} onClick={() => restore(item.id, 'published')} className="flex items-center gap-1 rounded border px-2.5 py-1.5 disabled:opacity-50"><RotateCcw className="w-3 h-3"/>{t('公開版→下書き', '게시본→임시저장', 'Published → Draft')}</button>}
            {item.hasDraft && <button disabled={busy} onClick={() => restore(item.id, 'draft')} className="flex items-center gap-1 rounded border px-2.5 py-1.5 disabled:opacity-50"><RotateCcw className="w-3 h-3"/>{t('旧下書き→下書き', '기존 Draft 복원', 'Draft → Draft')}</button>}
          </div>
        </div>)}
      </div>
      <p className="flex items-start gap-2 text-[11px] text-[#7A5A32]">
        <AlertTriangle className="w-4 h-4 shrink-0"/>
        {t('読み込んだ下書きを公開するには、別途「公開」操作が必要です。',
          '복원된 임시저장을 방문자에게 공개하려면 별도로 게시 버튼을 눌러야 합니다.',
          'Publishing a recovered Draft is always a separate administrator action.')}
      </p>
    </section>
  );
}
