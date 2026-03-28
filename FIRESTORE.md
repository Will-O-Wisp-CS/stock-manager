# Firestore 設定ガイド

このドキュメントは、Firebase Firestore をこのプロジェクトで使用するための詳細な設定手順です。

## Firestore データベース構造

### 1. `players` コレクション

プレイヤー情報を保存するコレクションです。

**スキーマ:**
```typescript
{
  name: string;            // プレイヤー名
  score: number;           // 現在のスコア (デフォルト: 0)
  createdAt: Timestamp;    // 作成日時
  updatedAt: Timestamp;    // 最終更新日時
}
```

**例:**
```json
{
  "name": "太郎",
  "score": 150,
  "createdAt": "2026-03-28T09:00:00Z",
  "updatedAt": "2026-03-28T09:15:00Z"
}
```

### 2. `scoreHistory` コレクション

スコア移動の履歴を保存するコレクションです。すべてのポイント転送がここに記録されます。

**スキーマ:**
```typescript
{
  fromPlayerId: string;      // ポイント減少プレイヤーのID
  fromPlayerName: string;    // ポイント減少プレイヤー名
  toPlayerId: string;        // ポイント増加プレイヤーのID
  toPlayerName: string;      // ポイント増加プレイヤー名
  points: number;            // 移動したポイント数
  timestamp: Timestamp;      // 実行日時
  note: string;              // メモ (オプション)
}
```

**例:**
```json
{
  "fromPlayerId": "doc_id_1",
  "fromPlayerName": "太郎",
  "toPlayerId": "doc_id_2",
  "toPlayerName": "花子",
  "points": 50,
  "timestamp": "2026-03-28T09:10:00Z",
  "note": "ゲーム勝利"
}
```

## Firebase コンソール設定

### ステップ 1: Firebase プロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. **「プロジェクトを作成」** をクリック
3. プロジェクト名を入力 (例: `score-app`)
4. Google Analytics は不要であれば無効化
5. **「プロジェクトを作成」** をクリック

### ステップ 2: Firestore データベースを作成

1.左側のメニューから **「Firestore Database」** を選択
2. **「データベースを作成」** をクリック
3. ロケーションを選択 (例: `asia-northeast1` - 東京)
4. **テストモード** でデータベースを開始
5. **「完了」** をクリック

### ステップ 3: コレクションを手動作成

Firestore では、最初のドキュメントを追加するとコレクションが自動作成されます。

#### `players` コレクションを作成
1. **「コレクションを開始」** をクリック
2. コレクション ID: `players` を入力
3. **「次へ」** をクリック
4. ドキュメントを手動作成するか、アプリから自動作成

#### `scoreHistory` コレクションを作成
同様に、コレクション ID: `scoreHistory` を入力

### ステップ 4: ウェブアプリを登録

1. Firebase Console のプロジェクト概要ページで **「</> ウェブ」** をクリック
2. アプリのニックネーム (例: `score-app-web`) を入力
3. **「アプリを登録」** をクリック
4. Firebase SDK をコピー (以下の形式で表示されます)

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

## 環境変数設定

### .env.local ファイルの設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY_HERE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN_HERE
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID_HERE
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET_HERE
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID_HERE
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID_HERE
```

### 各フィールドの値の取得

Firebase Console のプロジェクト設定から:

1. **「プロジェクト設定」** (歯車アイコン) をクリック
2. **「アプリ」** タブで、登録したウェブアプリを選択
3. **「Firebase SDK snippet」** から設定オブジェクトをコピー
4. 各値を `.env.local` に貼り付け

## セキュリティ ルール設定

### Firestore セキュリティ ルール

**テスト用** (開発時のみ):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**本番用** (ログインなしアクセス許可):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    match /scoreHistory/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

> ⚠️ **注意**: 本番環境では、Cloud Functions や Backend Service を使用してスコア更新を管理することを推奨します。

## インデックス設定 (オプション)

大規模なデータの場合、複合インデックスが必要になる可能性があります。

### `scoreHistory` インデックス例

- **コレクション ID**: `scoreHistory`
- **クエリのスコープ**: コレクション
- **フィールド**: 
  - `timestamp` (降順)
  
Firestore はクエリ実行時に、インデックスが必要な場合は自動的に作成を提案します。

## トラブルシューティング

### Firebase 認証エラー

**問題**: `Permission denied` エラーが表示される

**解決策**:
1. Firestore セキュリティ ルールを確認
2. `.env.local` の設定値を確認
3. Firebase プロジェクトに正しいウェブアプリが登録されているか確認

### データが表示されない

**問題**: 作成したプレイヤーが画面に表示されない

**解決策**:
1. Firestore Console でコレクション `players` にドキュメントが存在するか確認
2. ブラウザのコンソール (F12) でエラーメッセージを確認
3. ネットワーク接続を確認

### リアルタイム更新が動作しない

**問題**: 別のタブで追加されたプレイヤーが表示されない

**解決策**:
1. `lib/hooks.ts` の `onSnapshot` がしっかりセットアップされているか確認
2. Firebase の Real-time Database ではなく Firestore を使用しているか確認

## 参考リンク

- [Firestore ドキュメント](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com)
- [Next.js と Firebase の統合](https://nextjs.org/learn-pages/foundations/how-nextjs-works)
