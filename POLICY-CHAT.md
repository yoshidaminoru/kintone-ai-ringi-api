# 就業規則・休暇申請チャットの試作

既存の稟議書アプリに `/policy-chat` を追加しました。規程集（アプリ573）の指定レコードから最新版として登録されたPDFを読み取り、質問に関連するページの抜粋を使って回答します。回答には規程集のレコードへのリンクとPDFのページ番号が付きます。

## OpenAI接続の確認

既存の `OPENAI_API_KEY` が設定されている環境で `yarn check:policy-model` を実行します。既定モデルは `gpt-6-luna` です。コマンドは固定の短い確認文を1件送り、モデル名またはエラーの種別だけを表示します。規程の本文とAPIキーは表示しません。

## 試作の設定

アプリ573から外部に送る規程は、試作の全利用者に閲覧が認められ、OpenAI APIでの処理が許可されたものを選びます。所属・雇用区分は適用規程を選ぶための項目です。試作では利用者本人のkintone権限を個別に判定しないため、閲覧者が異なる規程は対象から外してください。

| 環境変数 | 内容 |
|---|---|
| `OPENAI_API_KEY` | 既存のOpenAI APIキー。利用可能なら再発行は不要 |
| `KINTONE_POLICY_API_TOKEN` | 規程集（アプリ573）のレコード閲覧専用トークン |
| `POLICY_PILOT_PASSWORD` | 16文字以上の試作用パスワード。ログイン名は `pilot` |
| `POLICY_PROFILES_JSON` | 対象区分ごとのレコード番号。任意で休暇申請先の社内kintone URLも設定 |
| `POLICY_OPENAI_MODEL` | 既定以外のモデルを使う場合に設定 |

`POLICY_PROFILES_JSON` の設定例です。レコード27の適用範囲を総務に確認してから、区分名を実際の名称に置き換えてください。

```json
[
  { "label": "総務確認済みの対象区分", "records": [27] }
]
```

設定はRenderの環境変数または手元の実行環境に登録します。資格情報はリポジトリやチャットに貼らないでください。Node.jsは22.13以降を使用します。

```sh
yarn install --frozen-lockfile
yarn check:policy-model
yarn start
```

起動後は `/policy-chat` を開きます。kintoneから使う場合は、試作環境で接続・回答を確認してから、そのHTTPS URLをポータルまたは社内規程ポータルに掲載します。

`OPENAI_API_KEY` と `KINTONE_POLICY_API_TOKEN` が設定されている環境では、`yarn check:policy-record` でレコード27の実機テストができます。GPT-6 Lunaに年次有給休暇について質問し、レコード27の原文リンクとPDFページ番号が付くことを確認します。ログには合否と参照ページだけを表示します。

## 参照する規程の扱い

- 設定したレコードから「新」のPDFだけを使用します。改定で別レコードに切り替わった場合は、参照するレコード番号を更新します。
- 同じ添付ファイルは起動中に再利用します。規程の新版や添付差し替えは次の質問から反映します。
- Renderのビルドで `yarn prepare:policy-index` を実行して、対象PDFをあらかじめ文字認識できます。生成された索引はビルド内に保持し、GitHubには含めません。ファイルが差し替わり、索引と一致しないときは新しいPDFを読み取ります。正式な判断に使う場合は、回答に付いた原文を確認してください。
- 申請画面のURLを設定すると、休暇に関する質問からその画面へ移動できます。画面の操作手順を回答させる場合は、現行の手順書も参照対象に含めます。

## kintoneログインでの試用

cybozu.com共通管理の［OAuth］でクライアントを追加し、利用者を試用参加者に限定します。リダイレクトエンドポイントは `https://kintone-ai-ringi-api.onrender.com/policy-chat-kintone/callback` です。

Renderで `POLICY_KINTONE_CLIENT_ID` と `POLICY_KINTONE_CLIENT_SECRET` を設定します。新しい入口は `/policy-chat-kintone` です。規程集のレコードと添付は利用者本人の読み取り権限で取得します。

実機確認後は `POLICY_DISABLE_SHARED_LOGIN` を `true` に設定すると、従来の入口はkintoneログイン版に移動します。利用対象とkintone上の閲覧権限が反映されることを確認したあとで切り替えてください。
