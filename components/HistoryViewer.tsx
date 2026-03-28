import React, { useMemo, useState } from 'react';
import { ScoreHistory, Player } from '../lib/types';

type HistoryViewerProps = {
  history: ScoreHistory[];
  player: Player;
};

const ITEMS_PER_PAGE = 10;

export default function HistoryViewer({ history, player }: HistoryViewerProps) {
  const [page, setPage] = useState(1);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(history.length / ITEMS_PER_PAGE)), [history.length]);

  const pagedHistory = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return history.slice(start, end);
  }, [history, page]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div>
      <div className="space-y-3">
        {pagedHistory.map((record) => (
          <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {record.type === 'direct' ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">{record.playerName}</span>
                  <span
                    className={`text-lg font-bold ${(record.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {(record.difference || 0) >= 0 ? '+' : ''}
                    {record.difference}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {record.oldScore} → {record.newScore}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">
                    {record.fromPlayerId === player.id
                      ? `${record.toPlayerName} に譲渡`
                      : `${record.fromPlayerName} から受取`}
                  </span>
                  <span className={`text-lg font-bold ${record.fromPlayerId === player.id ? 'text-red-600' : 'text-green-600'}`}>
                    {record.fromPlayerId === player.id ? '-' : '+'}
                    {record.points}
                  </span>
                </div>
              </>
            )}
            <p className="text-sm text-gray-500 mt-2">{new Date(record.timestamp).toLocaleString('ja-JP')}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={page <= 1}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          前へ
        </button>
        <div className="text-sm font-medium text-gray-700">
          {page}/{totalPages}
        </div>
        <button
          onClick={goNext}
          disabled={page >= totalPages}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          次へ
        </button>
      </div>
    </div>
  );
}
