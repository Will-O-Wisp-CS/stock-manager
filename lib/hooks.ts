'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Player, ScoreHistory, COLLECTIONS } from './types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const playersRef = collection(db, COLLECTIONS.PLAYERS);
      const q = query(playersRef, orderBy('updatedAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const playersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        })) as Player[];

        setPlayers(playersData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setTimeout(() => {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }, 0);
    }
  }, []);

  const addPlayer = async (name: string) => {
    try {
      await addDoc(collection(db, COLLECTIONS.PLAYERS), {
        name,
        score: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
    }
  };

  const updatePlayerScore = async (playerId: string, oldScore: number, newScore: number, playerName: string) => {
    try {
      const difference = newScore - oldScore;

      // 履歴を記録
      await addDoc(collection(db, COLLECTIONS.SCORE_HISTORY), {
        playerId,
        playerName,
        oldScore,
        newScore,
        difference,
        timestamp: Timestamp.now(),
        type: 'direct',
      });

      // スコアを更新
      const playerRef = doc(db, COLLECTIONS.PLAYERS, playerId);
      await updateDoc(playerRef, {
        score: newScore,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update score');
    }
  };

  return { players, loading, error, addPlayer, updatePlayerScore };
}

export function useScoreHistory() {
  const [history, setHistory] = useState<ScoreHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const historyRef = collection(db, COLLECTIONS.SCORE_HISTORY);
      const q = query(historyRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const historyData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        })) as ScoreHistory[];

        setHistory(historyData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setTimeout(() => {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }, 0);
    }
  }, []);

  const recordTransfer = async (
    fromPlayerId: string,
    fromPlayerName: string,
    toPlayerId: string,
    toPlayerName: string,
    points: number,
    note?: string
  ) => {
    try {
      // スコア履歴を記録
      await addDoc(collection(db, COLLECTIONS.SCORE_HISTORY), {
        fromPlayerId,
        fromPlayerName,
        toPlayerId,
        toPlayerName,
        points,
        timestamp: Timestamp.now(),
        note: note || '',
      });

      // 敗北者のスコアを減らす
      const fromPlayerRef = doc(db, COLLECTIONS.PLAYERS, fromPlayerId);
      const fromPlayerSnapshot = await getDoc(fromPlayerRef);
      const fromPlayerScore = fromPlayerSnapshot.data()?.score || 0;

      await updateDoc(fromPlayerRef, {
        score: fromPlayerScore - points,
        updatedAt: Timestamp.now(),
      });

      // 勝利者のスコアを増やす
      const toPlayerRef = doc(db, COLLECTIONS.PLAYERS, toPlayerId);
      const toPlayerSnapshot = await getDoc(toPlayerRef);
      const toPlayerScore = toPlayerSnapshot.data()?.score || 0;

      await updateDoc(toPlayerRef, {
        score: toPlayerScore + points,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record transfer');
    }
  };

  return { history, loading, error, recordTransfer };
}

export function usePlayerHistory(playerId: string) {
  const [playerHistory, setPlayerHistory] = useState<ScoreHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setTimeout(() => {
        setLoading(false);
      }, 0);
      return;
    }

    try {
      const historyRef = collection(db, COLLECTIONS.SCORE_HISTORY);
      const q = query(
        historyRef,
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allHistoryData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        })) as ScoreHistory[];

        // プレイヤーに関連する履歴をフィルタ
        const filtered = allHistoryData.filter(
          (item) =>
            item.playerId === playerId ||
            item.fromPlayerId === playerId ||
            item.toPlayerId === playerId
        );

        setPlayerHistory(filtered);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setTimeout(() => {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }, 0);
    }
  }, [playerId]);

  return { playerHistory, loading, error };
}
