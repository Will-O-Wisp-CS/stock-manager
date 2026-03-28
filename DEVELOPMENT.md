# 開発ガイド

この文書はプロジェクトの開発に必要な情報をまとめています。

## プロジェクト構成

```
ストック管理/
├── app/
│   ├── page.tsx              # メインページ (リアルタイムスコア管理UI)
│   ├── layout.tsx            # ルートレイアウト
│   ├── globals.css           # グローバルスタイル
│   └── favicon.ico           # ファビコン
├── lib/
│   ├── firebase.ts           # Firebase初期化設定
│   ├── types.ts              # TypeScript型定義 (Player, ScoreHistory)
│   └── hooks.ts              # カスタムフック (usePlayers, useScoreHistory)
├── public/                   # 静的ファイル
├── .env.local                # 環境変数 (Firebase設定)
├── package.json              # プロジェクト依存関係
├── tsconfig.json             # TypeScript設定
├── next.config.ts            # Next.js設定
└── README.md                 # プロジェクト説明
```

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# ESLint 実行
npm run lint
```

### 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) で開発サーバーが起動します。

ファイル変更時に自動でリロードされます (Hot Module Replacement)。

## 技術スタック

- **フレームワーク**: [Next.js 16](https://nextjs.org) (App Router)
- **言語**: [TypeScript](https://www.typescriptlang.org)
- **UI フレームワーク**: [React 19](https://react.dev)
- **スタイリング**: [Tailwind CSS 4](https://tailwindcss.com)
- **バックエンド**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **リアルタイム**: `onSnapshot` (Firestore リアルタイムリスナー)

## コアコンポーネント

### `app/page.tsx` - メインコンポーネント

**責務**:
- UI 全体のレイアウト
- プレイヤー管理画面と履歴画面の切り替え
- フォーム入力の管理
- ローディング状態とエラー表示

**主要な State**:
- `newPlayerName`: 新規プレイヤー名入力
- `selectedFromPlayer`: 敗北者選択
- `selectedToPlayer`: 勝利者選択
- `transferPoints`: 移動ポイント数
- `activeTab`: 表示中のタブ (players / history)

### `lib/hooks.ts` - カスタムフック

#### `usePlayers()`

**説明**: プレイヤー一覧と追加機能

**戻り値**:
```typescript
{
  players: Player[];           // プレイヤー配列
  loading: boolean;            // 読み込み中か
  error: string | null;        // エラーメッセージ
  addPlayer: (name: string) => Promise<void>;  // プレイヤー追加
}
```

**実装**: 
- Firestore の `onSnapshot` でリアルタイム同期
- `createdAt` でソート (昇順)

#### `useScoreHistory()`

**説明**: スコア移動履歴とポイント転送

**戻り値**:
```typescript
{
  history: ScoreHistory[];     // 履歴配列
  loading: boolean;            // 読み込み中か
  error: string | null;        // エラーメッセージ
  recordTransfer: (fromId, fromName, toId, toName, points) => Promise<void>;
}
```

**実装**:
- `timestamp` でソート (降順/最新から)
- 履歴記録時に自動でプレイヤースコアを更新

## 主要な機能実装

### 1. プレイヤー追加

```typescript
const addPlayer = async (name: string) => {
  await addDoc(collection(db, 'players'), {
    name,
    score: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};
```

### 2. スコア移動（トランザクション）

```typescript
const recordTransfer = async (fromId, fromName, toId, toName, points) => {
  // 1. 履歴記録
  await addDoc(collection(db, 'scoreHistory'), {
    fromPlayerId: fromId,
    fromPlayerName: fromName,
    toPlayerId: toId,
    toPlayerName: toName,
    points,
    timestamp: Timestamp.now(),
  });

  // 2. 敗北者スコア更新   
  await updateDoc(doc(db, 'players', fromId), {
    score: fromScore - points,
    updatedAt: Timestamp.now(),
  });

  // 3. 勝利者スコア更新
  await updateDoc(doc(db, 'players', toId), {
    score: toScore + points,
    updatedAt: Timestamp.now(),
  });
};
```

### 3. リアルタイム同期

```typescript
useEffect(() => {
  const q = query(collection(db, 'players'), orderBy('createdAt', 'asc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPlayers(data);
  });

  return () => unsubscribe(); // コンポーネント削除時に購読解除
}, []);
```

## スタイリング

このプロジェクトは **Tailwind CSS** を使用しています。

### 主要なクラス

- `bg-gradient-to-br`: グラデーション背景
- `rounded-lg`: ボーダー半径
- `shadow-lg`: ドロップシャドウ
- `grid grid-cols-1 sm:grid-cols-2`: レスポンシブグリッド
- `text-indigo-600`: インディゴ色テキスト

### レスポンシブ設計

- `sm:`: 640px以上
- `md:`: 768px以上
- `lg:`: 1024px以上

## 開発時のチェックリスト

- [ ] Firebase `.env.local` が正しく設定されている
- [ ] `npm install` が完了している
- [ ] `npm run dev` でエラーなく起動する
- [ ] ブラウザコンソールでエラーがない
- [ ] Firestore データベースにアクセス可能
- [ ] プレイヤー追加が動作する
- [ ] スコア移動が動作する
- [ ] 複数タブでリアルタイム同期が動作する

## トラブルシューティング

### ビルドエラー

```
npm run build
```

TypeScript エラーが出た場合:
1. エラーメッセージを確認
2. 該当ファイルの型チェック
3. `lib/types.ts` の型定義を確認

### ホットリロードが動作しない

1. ター全体をリロード (`Ctrl+Shift+R`)
2. 開発サーバーを再起動 (`Ctrl+C` → `npm run dev`)
3. `.next` フォルダを削除して再起動

### Firebase 接続エラー

1. `.env.local` の値が正しいか確認
2. Firestore コンソールでセキュリティ ルルを確認
3. ネットワーク接続を確認

## デプロイ

### Vercel へのデプロイ

```bash
npm run build
```

で成功すれば、[Vercel](https://vercel.com) にデプロイ準備完了です。

1. GitHub にプッシュ
2. Vercel に接続
3. 環境変数 `.env.local` をセット
4. デプロイ

## 参考リソース

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)
- [Firebase/Firestore ドキュメント](https://firebase.google.com/docs/firestore)
- [React フック ドキュメント](https://react.dev/reference/react)
