'use client';

import { useEffect, useState } from 'react';
import HistoryViewer from '@/components/HistoryViewer';
import { useProjects, usePlayers, useScoreHistory, usePlayerHistory } from '@/lib/hooks';
import { Player, Project } from '@/lib/types';

export default function Home() {
  const { projects, loading: projectsLoading, error: projectsError, addProject } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const selectedProject = projects.find((item) => item.id === selectedProjectId) as Project | undefined;

  const { players, loading: playersLoading, error: playersError, addPlayer, updatePlayerScore } = usePlayers(selectedProjectId);
  const { history, loading: historyLoading, error: historyError, recordTransfer } = useScoreHistory(selectedProjectId);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedFromPlayer, setSelectedFromPlayer] = useState<string>('');
  const [selectedToPlayer, setSelectedToPlayer] = useState<string>('');
  const [transferPoints, setTransferPoints] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [activeTab, setActiveTab] = useState<'players' | 'ranking' | 'history' | 'summary'>('players');
  
  // 集計用
  const [summaryFromDate, setSummaryFromDate] = useState<string>('');
  const [summaryToDate, setSummaryToDate] = useState<string>('');
  
  // ストック編集用
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingScoreValue, setEditingScoreValue] = useState<string>('');
  
  // 履歴表示用
  const [selectedForHistory, setSelectedForHistory] = useState<Player | null>(null);
  const { playerHistory } = usePlayerHistory(selectedForHistory?.id || '', selectedProjectId);

  useEffect(() => {
    const storedProjectId = localStorage.getItem('selectedProjectId') || '';
    if (storedProjectId && projects.some((item) => item.id === storedProjectId)) {
      setSelectedProjectId(storedProjectId);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('selectedProjectId', selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    setActiveTab('players');
    setSelectedFromPlayer('');
    setSelectedToPlayer('');
    setTransferPoints('');
    setSelectedForHistory(null);
    setEditingPlayerId(null);
  }, [selectedProjectId]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      return;
    }
    await addProject(newProjectName.trim());
    setNewProjectName('');
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim() && selectedProjectId) {
      await addPlayer(newPlayerName, selectedProjectId);
      setNewPlayerName('');
    }
  };

  const handleTransferScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFromPlayer || !selectedToPlayer || !transferPoints) {
      alert('すべてのフィールドを填蔵してください');
      return;
    }

    if (selectedFromPlayer === selectedToPlayer) {
      alert('異なるプレイヤーを選択してください');
      return;
    }

    const points = parseInt(transferPoints, 10);
    if (isNaN(points) || points <= 0) {
      alert('有効なストック数を入力してください');
      return;
    }

    const fromPlayer = players.find((p) => p.id === selectedFromPlayer);
    const toPlayer = players.find((p) => p.id === selectedToPlayer);

    if (!fromPlayer || !toPlayer) {
      alert('プレイヤーが見つかりません');
      return;
    }

    setIsTransferring(true);
    try {
      await recordTransfer(
        fromPlayer.id,
        fromPlayer.name,
        toPlayer.id,
        toPlayer.name,
        points,
        selectedProjectId
      );
      setSelectedFromPlayer('');
      setSelectedToPlayer('');
      setTransferPoints('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleEditScore = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingScoreValue(player.score.toString());
  };

  const handleSaveScore = async () => {
    if (!editingPlayerId) return;

    const newScore = parseInt(editingScoreValue, 10);
    if (isNaN(newScore)) {
      alert('有効な数値を入力してください');
      return;
    }

    const player = players.find((p) => p.id === editingPlayerId);
    if (!player) return;

    try {
      await updatePlayerScore(editingPlayerId, player.score, newScore, player.name, selectedProjectId);
      setEditingPlayerId(null);
      setEditingScoreValue('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditingScoreValue('');
  };

  if (!selectedProjectId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 mobile-contrast">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">プロジェクト選択</h1>
            <p className="text-gray-600">参加するプロジェクトを選ぶか、新しく作成してください。</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">プロジェクト一覧</h2>
            {projectsLoading ? (
              <p className="text-center text-gray-600">読み込み中...</p>
            ) : projectsError ? (
              <p className="text-center text-red-600">エラー: {projectsError}</p>
            ) : projects.length === 0 ? (
              <p className="text-center text-gray-600">プロジェクトがありません。下から追加してください。</p>
            ) : (
              <div className="space-y-3">
                {projects.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedProjectId(item.id)}
                    className="w-full text-left bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition"
                  >
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600 mt-1">作成: {new Date(item.createdAt).toLocaleString('ja-JP')}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">プロジェクトを追加</h2>
            <form onSubmit={handleAddProject} className="flex gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="プロジェクト名を入力"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                追加
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 mobile-contrast">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ストック管理
          </h1>
          <p className="text-gray-600">ストックを管理します。1ストックあたり500。</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
              プロジェクト: {selectedProject?.name || '未選択'}
            </div>
            <button
              onClick={() => setSelectedProjectId('')}
              className="px-3 py-1 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              プロジェクト選択へ
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow">
          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
              activeTab === 'players'
                ? 'bg-indigo-600 text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            プレイヤー
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
              activeTab === 'ranking'
                ? 'bg-indigo-600 text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            ランキング
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            履歴
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
              activeTab === 'summary'
                ? 'bg-indigo-600 text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            集計
          </button>
        </div>

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            {/* Score Transfer Form */}
            {players.length >= 2 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  結果登録
                </h2>
                <form onSubmit={handleTransferScore} className="space-y-4">
                  {/* From Player */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      敗北者を選択
                    </label>
                    <select
                      value={selectedFromPlayer}
                      onChange={(e) => setSelectedFromPlayer(e.target.value)}
                      className="w-full text-gray-900 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- プレイヤーを選択 --</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} (ストック: {player.score})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* To Player */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      勝利者を選択
                    </label>
                    <select
                      value={selectedToPlayer}
                      onChange={(e) => setSelectedToPlayer(e.target.value)}
                      className="w-full text-gray-900 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- プレイヤーを選択 --</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} (ストック: {player.score})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Points */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      移動ストック数
                    </label>
                    <input
                      type="number"
                      value={transferPoints}
                      onChange={(e) => setTransferPoints(e.target.value)}
                      placeholder="ストック数を入力"
                      min="1"
                      className="w-full text-gray-900 placeholder:text-gray-600 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isTransferring}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold disabled:bg-gray-400"
                  >
                    {isTransferring ? '処理中...' : 'ストックを移動'}
                  </button>
                </form>
              </div>
            )}

            {/* Players List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                プレイヤー一覧
              </h2>
              {playersLoading ? (
                <p className="text-center text-gray-600">読み込み中...</p>
              ) : playersError ? (
                <p className="text-center text-red-600">エラー: {playersError}</p>
              ) : players.length === 0 ? (
                <p className="text-center text-gray-600">
                  プレイヤーがいません。新しいプレイヤーを追加してください。
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {players.map((player) => (
                    <div key={player.id}>
                      {editingPlayerId === player.id ? (
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                          <h3 className="font-bold text-lg text-gray-800">{player.name}</h3>
                          <div className="mt-4 space-y-2">
                            <input
                              type="number"
                              value={editingScoreValue}
                              onChange={(e) => setEditingScoreValue(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveScore();
                                }}
                                className="flex-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                              >
                                保存
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEdit();
                                }}
                                className="flex-1 px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-medium"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200 cursor-pointer hover:shadow-md transition"
                          onClick={() => setSelectedForHistory(player)}
                        >
                          <h3 className="font-bold text-lg text-gray-800">{player.name}</h3>
                          <p className="text-3xl font-bold text-indigo-600 mt-2">
                            {player.score}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            クリックで「編集・履歴表示」
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            更新: {new Date(player.updatedAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Player Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                プレイヤーを追加
              </h2>
              <form onSubmit={handleAddPlayer} className="flex gap-2">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="プレイヤー名を入力"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  追加
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Ranking Tab */}
        {activeTab === 'ranking' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              ストックランキング
            </h2>
            {playersLoading ? (
              <p className="text-center text-gray-600">読み込み中...</p>
            ) : playersError ? (
              <p className="text-center text-red-600">エラー: {playersError}</p>
            ) : players.length === 0 ? (
              <p className="text-center text-gray-600">
                プレイヤーがいません
              </p>
            ) : (
              <div className="space-y-3">
                {[...players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full font-bold">
                          {index + 1}
                        </div>
                        <span className="font-bold text-gray-800">{player.name}</span>
                      </div>
                      <span className="text-2xl font-bold text-indigo-600">
                        {player.score}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              ストック履歴
            </h2>
            {historyLoading ? (
              <p className="text-center text-gray-600">読み込み中...</p>
            ) : historyError ? (
              <p className="text-center text-red-600">エラー: {historyError}</p>
            ) : history.length === 0 ? (
              <p className="text-center text-gray-600">
                ストック移動履歴がありません
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">
                        {record.fromPlayerName} → {record.toPlayerName}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        +{record.points}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(record.timestamp).toLocaleString('ja-JP')}
                    </p>
                    {record.note && (
                      <p className="text-sm text-gray-600 mt-2">メモ: {record.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              ストック集計
            </h2>
            
            {/* Date Range Selector */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  開始日
                </label>
                <input
                  type="date"
                  value={summaryFromDate}
                  onChange={(e) => setSummaryFromDate(e.target.value)}
                  className="w-full text-gray-900 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  終了日
                </label>
                <input
                  type="date"
                  value={summaryToDate}
                  onChange={(e) => setSummaryToDate(e.target.value)}
                  className="w-full text-gray-900 px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Summary Results */}
            {!summaryFromDate || !summaryToDate ? (
              <p className="text-center text-gray-800">期間を選択してください</p>
            ) : (() => {
              const fromDate = new Date(summaryFromDate);
              const toDate = new Date(summaryToDate);
              toDate.setHours(23, 59, 59, 999);

              // Filter history by date range
              const filteredRecords = history.filter((record) => {
                const recordDate = new Date(record.timestamp);
                return recordDate >= fromDate && recordDate <= toDate;
              });

              // Group by date and player
              const summaryByDateAndPlayer: Record<string, Record<string, number>> = {};
              filteredRecords.forEach((record) => {
                const recordDate = new Date(record.timestamp).toLocaleDateString('ja-JP');
                if (!summaryByDateAndPlayer[recordDate]) {
                  summaryByDateAndPlayer[recordDate] = {};
                }

                // Assuming transfer type (from/to player)
                if (record.fromPlayerId && record.toPlayerId) {
                  if (!summaryByDateAndPlayer[recordDate][record.fromPlayerId]) {
                    summaryByDateAndPlayer[recordDate][record.fromPlayerId] = 0;
                  }
                  summaryByDateAndPlayer[recordDate][record.fromPlayerId] -= (record.points || 0);

                  if (!summaryByDateAndPlayer[recordDate][record.toPlayerId]) {
                    summaryByDateAndPlayer[recordDate][record.toPlayerId] = 0;
                  }
                  summaryByDateAndPlayer[recordDate][record.toPlayerId] += (record.points || 0);
                } else if (record.playerId) {
                  // Direct score edit
                  if (!summaryByDateAndPlayer[recordDate][record.playerId]) {
                    summaryByDateAndPlayer[recordDate][record.playerId] = 0;
                  }
                  summaryByDateAndPlayer[recordDate][record.playerId] += (record.difference || 0);
                }
              });

              const sortedDates = Object.keys(summaryByDateAndPlayer).sort().reverse();

              return sortedDates.length === 0 ? (
                <p className="text-center text-gray-800">この期間にはデータがありません</p>
              ) : (
                <div className="space-y-6">
                  {sortedDates.map((date) => (
                    <div key={date} className="border-b pb-4">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">{date}</h3>
                      <div className="space-y-2">
                        {Object.entries(summaryByDateAndPlayer[date]).map(([playerId, total]) => {
                          const playerName = players.find((p) => p.id === playerId)?.name || 'Unknown';
                          return (
                            <div
                              key={`${date}-${playerId}`}
                              className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200"
                            >
                              <span className="font-bold text-gray-800">{playerName}</span>
                              <span
                                className={`text-lg font-bold ${
                                  total >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {total >= 0 ? '+' : ''}{total}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Player History Modal */}
        {selectedForHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedForHistory.name} の管理
                  </h2>
                  <p className="text-lg font-bold text-indigo-600 mt-2">
                    現在のストック: {selectedForHistory.score}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedForHistory(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                {/* Direct Score Edit */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">ストック編集</h3>
                  {editingPlayerId === selectedForHistory.id ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={editingScoreValue}
                          onChange={(e) => setEditingScoreValue(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveScore}
                            className="flex-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-medium"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditScore(selectedForHistory)}
                      className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      ストックを編集
                    </button>
                  )}
                </div>

                {/* History Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">変動履歴</h3>
                  {playerHistory.length === 0 ? (
                    <p className="text-center text-gray-600">変動履歴がありません</p>
                  ) : (
                    <HistoryViewer history={playerHistory} player={selectedForHistory} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
