# リズムスピーカー商店の移植

公式HPの公開候補は `/shoten/`。元画面は Sites v0.7.1 / 版11。ロゴ、案内役、CSS、検索・比較・画面遷移を元の実装から移植した。商品、購入ボタン、商品写真は承認済みデータがある場合に表示する。特集の見出し・URLは継承し、未承認の個別モデルに触れる本文は公開版向けに調整した。

- 公式HPの GitHub Pages は README に従い `main` のルート。作業ブランチの検証はローカルの静的配信で行う。
- 全サービスの商品レビュー欄から商店へ移動できる。既存の公式グッズ、ブログ、初回体験、予約と共通メニューのリンクは維持する。商店の読みもの一覧から既存の商品レビューブログへ移動できる。
- URLは `#/products`、`#/product/<product_id>`、`#/articles`、`#/article/<slug>`。商品詳細は商品マスターの共通IDを使う。CSS、画像、カタログは相対パスで読む。
- ロゴは商店で制作済みの商標風ロゴ。タプ太郎は既存Sitesに採用済みのリポジトリ素材。商品写真はファイル単位の利用根拠が必要。

## 更新手順

Private の Amazon Commerce Data OS のレビュー済み main を別ディレクトリに用意する。接続資格情報や Private 原本は公式HPにコピーしない。

```sh
python -m pip install jsonschema
python tools/build_shoten_catalog.py --commerce /path/to/private-commerce --sha <reviewed-main-sha>
python tools/test_shoten_catalog.py
python tools/navigation_audit.py --strict
python tools/trial_cta_audit.py --strict
```

上流の整合性検証、スキーマ検証、承認済みエクスポートを実行してから、`rhythmspeaker-web` 向けのデータを `shoten/catalog.json` に原子的に書き出す。Private checkout または出所情報付きのコネクター取得データを利用できる。媒体URLは `https://noritap.github.io/rhythmspeaker/shoten/` を今回の厳格な確認対象とした。公式HPルートのみが登録済みの場合は、配下URLの掲載適格性を管理画面・公式案内で確認してからマスターと投影ルールをレビューする。

先行運用では最大1商品。正式な直接リンクを取得し、ASIN・Tracking ID・媒体・商品・配置承認を照合する。画像は利用根拠が確認された自社制作・許諾素材を専用パスに配置する。リンクと画像の利用条件をそれぞれ確認する。価格、在庫、割引、実使用レビューは出力しない。

CTA直前とフッター／広告方針に広告表示を出す。Amazonへの導線は直接リンク。成果確認は Amazonアソシエイト・セントラルの該当Tracking IDのレポートで、クリック、注文、発送・紹介料を区別する。商店独自の計測は未設置。

## リリース前の判定

承認済み実商品1件で生成、商品・記事の相互導線、画像、公式リンクの遷移を再検証し、公式HP側のナビゲーション監査とCIを確認する。本番用の商品が1件以上あり、媒体登録と掲載承認を確認できた時点で main に統合する。登録に先立って公開状態が必要な場合は、別途承認を得た上で購入リンクなしの確認用ページを用意する。統合後に公開URLで回帰テストを行う。
