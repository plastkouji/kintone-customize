/* ==========================================================================
 * デイリーステータス アプリ用 カスタマイズJS（v1）
 *   - 時間帯別の挨拶バナー
 *   - 文字数に応じた応援メッセージ
 *   - 夜・週末の優しさメッセージ
 *
 * 設定エリア（先頭の GREETINGS / ENCOURAGE / KINDNESS）の文言を
 * 書き換えるだけでメッセージを差し替えられます。
 * ========================================================================== */

(function() {
  'use strict';

  /* ------------------------------------------------------------------
   * 設定エリア①：時間帯別の挨拶
   *   ここを書き換えれば、表示される文言が変わります。
   *   各時間帯に複数パターンを入れておくと、毎回ランダムで切り替わります。
   * ------------------------------------------------------------------ */
  var GREETINGS = {
    earlyMorning: { // 5時〜7時
      label: '早朝',
      messages: [
        'おはようございます、早いですね。コーヒーでも淹れてゆっくりどうぞ',
        '早朝からお疲れさまです。今日も一日のはじまりですね',
        '朝早くからすごいです。無理しないでくださいね'
      ]
    },
    morning: { // 7時〜9時
      label: '朝',
      messages: [
        'おはようございます。業務前5分のスタートですね',
        'おはようございます。今日もよろしくお願いします',
        'おはようございます。今日は何を1つ潰しますか'
      ]
    },
    lateMorning: { // 9時〜12時
      label: '午前',
      messages: [
        '午前の業務、進んでますか',
        '今日もすでに動いてますね',
        'いまのうちに業務前メモを残しておくと夕方ラクになりますよ'
      ]
    },
    noon: { // 12時〜14時
      label: '昼',
      messages: [
        'お昼ですね、午前お疲れさまでした',
        'ランチ前に書いておくとスッキリしますね',
        '一息ついて、午後に備えましょう'
      ]
    },
    afternoon: { // 14時〜17時
      label: '午後',
      messages: [
        '午後の部、いきましょう',
        '今日も後半戦ですね',
        'あと数時間、いきますか'
      ]
    },
    evening: { // 17時〜19時
      label: '夕方',
      messages: [
        'お疲れさまでした。終業前2分の時間ですね',
        '今日もよく動きましたね。お疲れさまです',
        '振り返りタイム。ざっくりでOKです'
      ]
    },
    night: { // 19時〜22時
      label: '夜',
      messages: [
        'お疲れさまです。もう夜ですね',
        '今日も長く動きましたね。お疲れさまでした',
        'そろそろ切り上げましょうか'
      ]
    },
    lateNight: { // 22時〜翌5時
      label: '深夜',
      messages: [
        '夜更かしですか。無理せず明日に回してもいいですよ',
        'もうこんな時間ですね。お体を大切に',
        '今日はここまででも十分ですよ'
      ]
    }
  };

  /* ------------------------------------------------------------------
   * 設定エリア②：文字数に応じた応援メッセージ
   * ------------------------------------------------------------------ */
  var ENCOURAGE = {
    short: [   // 1〜9文字
      'もう少し書いてみますか',
      'ざっくりでも書いておくと後で助かりますよ',
      '一行でいいので残しておきましょう'
    ],
    medium: [  // 10〜29文字
      'いい感じです',
      'しっかり書けてますね',
      'いいですね、その調子で'
    ],
    long: [    // 30文字以上
      '今日は丁寧ですね',
      'たっぷり書けましたね',
      'すごい、しっかり振り返りできてますね'
    ]
  };

  /* ------------------------------------------------------------------
   * 設定エリア③：優しさメッセージ
   *   夜遅い時間・週末・金曜夕方など、配慮が必要な状況で追加表示。
   * ------------------------------------------------------------------ */
  function getKindnessMessage() {
    var now = new Date();
    var hour = now.getHours();
    var day = now.getDay(); // 0=日, 1=月, ..., 6=土

    if (hour >= 21) {
      return '今日はここまでで大丈夫ですよ。明日また書けばいいですからね';
    }
    if (day === 5 && hour >= 17) {
      return '今週もお疲れさまでした。週末ゆっくりしてください';
    }
    if (day === 0 || day === 6) {
      return '休日に書いてくれてありがとうございます。無理しないでくださいね';
    }
    return null;
  }

  /* ------------------------------------------------------------------
   * フィールドコード（テンプレートから抽出した実物）
   *   フィールド名を変更したらここも揃えてください。
   * ------------------------------------------------------------------ */
  var FIELD_MORNING = '今日1日で1つミスを潰すための行動を書く';
  var FIELD_EVENING = '今日つまった事___今日進んだ事_のどちらかを1つだけ書く';

  /* ==========================================================================
   * ここから下は基本いじらなくてOK（ロジック本体）
   * ========================================================================== */

  // 時間帯を判定
  function getTimeSlot() {
    var h = new Date().getHours();
    if (h >= 5 && h < 7)  return 'earlyMorning';
    if (h >= 7 && h < 9)  return 'morning';
    if (h >= 9 && h < 12) return 'lateMorning';
    if (h >= 12 && h < 14) return 'noon';
    if (h >= 14 && h < 17) return 'afternoon';
    if (h >= 17 && h < 19) return 'evening';
    if (h >= 19 && h < 22) return 'night';
    return 'lateNight';
  }

  // ランダムで1つ選ぶ
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 挨拶バナーを画面上部に表示
  function showGreetingBanner() {
    var BANNER_ID = 'daily-greeting-banner';
    var old = document.getElementById(BANNER_ID);
    if (old) old.remove();

    var slot = getTimeSlot();
    var greet = GREETINGS[slot];
    var message = pickRandom(greet.messages);
    var kindness = getKindnessMessage();

    var banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.style.cssText = [
      'background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      'border-left: 4px solid #0ea5e9',
      'padding: 16px 20px',
      'margin: 12px 0 20px 0',
      'border-radius: 8px',
      'font-size: 15px',
      'line-height: 1.6',
      'color: #0c4a6e',
      'box-shadow: 0 2px 4px rgba(0,0,0,0.04)'
    ].join(';');

    var html = ''
      + '<div style="font-size:13px;color:#0369a1;margin-bottom:6px;font-weight:600;">'
      + '[' + greet.label + ']'
      + '</div>'
      + '<div>' + escapeHtml(message) + '</div>';

    if (kindness) {
      html += '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed #7dd3fc;font-size:14px;color:#0c4a6e;">'
        + escapeHtml(kindness) + '</div>';
    }

    // フィードバック表示エリアも用意（あとで応援メッセージを差し込む）
    html += '<div id="daily-feedback-area" style="margin-top:10px;"></div>';

    banner.innerHTML = html;

    var container = kintone.app.record.getHeaderMenuSpaceElement();
    if (container) container.appendChild(banner);
  }

  // 文字数で応援文を返す
  function encourageByLength(text) {
    var len = (text || '').length;
    if (len === 0) return null;
    if (len < 10)  return pickRandom(ENCOURAGE.short);
    if (len < 30)  return pickRandom(ENCOURAGE.medium);
    return pickRandom(ENCOURAGE.long);
  }

  // 応援メッセージをバナー内に表示
  function showFeedback(fieldLabel, message) {
    var area = document.getElementById('daily-feedback-area');
    if (!area) return;

    var key = 'feedback-' + fieldLabel;
    var old = document.getElementById(key);
    if (old) old.remove();

    if (!message) return;

    var box = document.createElement('div');
    box.id = key;
    box.style.cssText = [
      'background: #fef3c7',
      'border-radius: 4px',
      'padding: 6px 12px',
      'font-size: 13px',
      'color: #92400e',
      'margin-top: 4px',
      'display: inline-block',
      'margin-right: 8px'
    ].join(';');
    box.textContent = '【' + fieldLabel + '】 ' + message;
    area.appendChild(box);
  }

  // HTMLエスケープ（念のため）
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ------------------------------------------------------------------
   * イベント登録
   * ------------------------------------------------------------------ */

  // 追加・編集・詳細画面を開いた瞬間、挨拶バナーを表示
  kintone.events.on([
    'app.record.create.show',
    'app.record.edit.show',
    'app.record.detail.show'
  ], function(event) {
    showGreetingBanner();
    return event;
  });

  // 朝フィールドの入力に応じて応援
  kintone.events.on([
    'app.record.create.change.' + FIELD_MORNING,
    'app.record.edit.change.' + FIELD_MORNING
  ], function(event) {
    var text = event.record[FIELD_MORNING].value;
    showFeedback('朝の目標', encourageByLength(text));
    return event;
  });

  // 夕方フィールドの入力に応じて応援
  kintone.events.on([
    'app.record.create.change.' + FIELD_EVENING,
    'app.record.edit.change.' + FIELD_EVENING
  ], function(event) {
    var text = event.record[FIELD_EVENING].value;
    showFeedback('振り返り', encourageByLength(text));
    return event;
  });

})();
