# リアルタイム・スコア管理アプリ

Firebase (Firestore) と Next.js を使用したスマホ向けのリアルタイムスコア管理アプリケーション。複数プレイヤーのスコアをリアルタイムで管理し、ポイント移動を記録できます。

## 機能

- ✅ **ログイン不要**: リンクを知っている誰でも使用可能
- ✅ **プレイヤー管理**: プレイヤー追加とスコア表示
- ✅ **スコア移動**: プルダウンで勝者/敗者、ポイント数を選択して実行
- ✅ **リアルタイム同期**: 複数端末で即座に最新データが表示される
- ✅ **履歴保存**: すべてのスコア移動をタイムスタンプ付きで記録

## Firestore データ構造

### `players` コレクション
```typescript
{
  id: string;              // ドキュメントID
  name: string;            // プレイヤー名
  score: number;           // 現在のスコア
  createdAt: Timestamp;    // 作成日時
  updatedAt: Timestamp;    // 更新日時
}
```

### `scoreHistory` コレクション
```typescript
{
  id: string;                 // ドキュメントID
  fromPlayerId: string;       // スコア減少プレイヤーID
  fromPlayerName: string;     // スコア減少プレイヤー名
  toPlayerId: string;         // スコア増加プレイヤーID
  toPlayerName: string;       // スコア増加プレイヤー名
  points: number;             // 移動ポイント数
  timestamp: Timestamp;       // 実行日時
  note: string;               // 備考 (オプション)
}
```

## セットアップ

### 1. Firebase プロジェクト設定

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. 新しいプロジェクトを作成 (またはアプリを登録)
3. Firestore Database を作成 (テストモード)
4. ウェブアプリの認証情報を取得

### 2. 環境変数設定

`.env.local` ファイルを作成し、Firebase の認証情報を設定:

```bash
cp .env.local.example .env.local
```

`.env.local` を編集:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. 依存関係をインストール

```bash
npm install
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開く

## ファイル構造

```
app/
├── page.tsx                 # メインコンポーネント
├── layout.tsx               # レイアウト
├── globals.css              # グローバルスタイル
lib/
├── firebase.ts              # Firebase初期化
├── types.ts                 # TypeScript型定義
├── hooks.ts                 # カスタムフック (usePlayers, useScoreHistory)
```

## プロジェクト設定

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイル**: Tailwind CSS
- **バックエンド**: Firebase Firestore
- **リアルタイム**: Firestore の `onSnapshot` を使用

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
