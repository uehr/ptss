# PTSS
#### ー Pure P2P Text Sharing System ー

## Overview
### PTSSはピュアP2Pネットワークで構成されるシンプルなテキスト共有システムです。
### ※あくまで学習目的で開発した為、実用向きの設計ではありません。使用する際は自己責任でお願いします。
<img src="https://user-images.githubusercontent.com/26696733/40591168-32185798-6247-11e8-8f0c-44b69b8430e8.png" width=50%>

## Commands 
  ### help
  >ヘルプ

  ### hello
  >PTSSに挨拶！

  ### addnode (IP)
  >ネットワークに参加している他ノードのIPアドレスを登録
  PTSSは保持している他ノードの情報を用いてネットワークへ参加する為、初回起動時には他ノードのIPアドレスの登録が必要。

  ### clusterkey (key1) (key2) (key3)
  >クラスタキーを設定

  [More detail](#クラスタリング)

  ### download (text id)
  >テキストをダウンロード

  [More detail](#ダウンロード)

  ### texts
  >保存済みのテキスト一覧

  ### read (text id)
  >保存されたテキストを読み込む

  ### ip
  >ローカルIPアドレス

  ### peer
  >接続中のピア一覧

  [More detail](#ピア)

  ### upload (text name) (text content)
  >テキストをネットワークへアップロード

  ### seach (seach word)
  >ネットワーク内のテキストを検索

  [More detail](#検索)

## Details
### キー
>テキストをアップロードするのと同時に、テキストの情報 (筆者/ テキストID/ テキスト名)等を要約したキーをネットワーク内に拡散し、各ノードはこのキーを頼りにテキストをダウンロードします。

### キーの期限
>キーの期限を設定し、定期的にキーを生成することにより、各ノードのテキスト配信状況の変化に対応可能になっています。

### テキストID
>筆者のIPアドレス+テキスト内容をハッシュ化した物をテキストIDとしている為、両者どちらかを改ざんするとID自体が変わり、改ざんを検知出来る仕組みになっています。

### 検索
>検索クエリをネットワーク内に拡散させ、検索ワードにマッチするキーをクエリに詰め込み、ホップ数が限界に達すれば、検索元のノードとコネクションを開き検索結果を帰します。

### ダウンロード
>保存されたキーの中から、対象テキスト情報が格納されてあるキーを取得し、テキスト保有ノードへとアップロードリクエストを行います。

### ピア
>ピア接続をしたノード同士は、ネットワーク内に情報を拡散させる為、キー/ピアのステータス/他ノード情報 を定期的に共有します。

### クラスタリング
>クラスタキーと呼ばれる、興味がある3つのワードをユーザーに指定して貰う事で、ネットワークに参加するノードの論理距離を算出し、距離が短いノード同士を集める事で、興味のあるテキストを効率良く共有可能な設計になっています。

## Test locally
### ローカル環境でテストする場合は、Dockerを用いてネットワークを構築する事をオススメします。
```
$ cd ptss
$ sudo docker build -t ptss .
$ sudo docker run --rm -it ptss
ptss> 
```

## Demo
### 1. Check startup
#### Let's greeting !
```
$ cd ptss/src
$ node startCUI.js
ptss> hello
Hello from ptss :)
```

### 2. Join the ptss network
#### 初回起動時には、ネットワークに参加しているノードのIPの登録が必要です。
```
ptss> addnode (IPアドレス)
```

#### 3. Run any command
[commands](#commands)


## Author
[Homepage](https://www.uehr.co)
[Twitter](https://twitter.com/uehr37)
Email: [uehara.yudai@gmail.com](<mailto:uehara.yudai@gmail.com>)