/* ==========================================================================
 * デイリーステータス アプリ用 カスタマイズJS（v2）
 *
 *   v1からの継続機能：
 *     - 時間帯別の挨拶バナー
 *     - 文字数に応じた応援メッセージ
 *     - 夜・週末の優しさメッセージ
 *
 *   v2の新機能：
 *     - ログインユーザー名で呼びかけ（「○○さん、おはようございます」）
 *     - 過去の自分の投稿3件を画面上に表示
 * ========================================================================== */

(function() {
  'use strict';

  /* ------------------------------------------------------------------
   * 設定エリア①：時間帯別の挨拶
   * ------------------------------------------------------------------ */
  var GREETINGS = {
    earlyMorning: {
      label: '早朝',
      messages: [
        'おはようございます、早いですね。コーヒーでも淹れてゆっくりどうぞ',
        '早朝からお疲れさまです。今日も一日のはじまりですね',
        '朝早くからすごいです。無理しないでくださいね'
      ]
    },
    morning: {
      label: '朝',
      messages: [
        'おはようございます。業務前5分のスタートですね',
        'おはようございます。今日もよろしくお願いします',
        'おはようございます。今日は何を1つ潰しますか'
      ]
    },
    lateMorning: {
      label: '午前',
      messages: [
        '午前の業務、進んでますか',
        '今日もすでに動いてますね',
        'いまのうちに業務前メモを残しておくと夕方ラクになりますよ'
      ]
    },
    noon: {
      label: '昼',
      messages: [
        'お昼ですね、午前お疲れさまでした',
        'ランチ前に書いておくとスッキリしますね',
        '一息ついて、午後に備えましょう'
      ]
    },
    afternoon: {
      label: '午後',
      messages: [
        '午後の部、いきましょう',
        '今日も後半戦ですね',
        'あと数時間、いきますか'
      ]
    },
    evening: {
      label: '夕方',
      messages: [
        'お疲れさまでした。終業前2分の時間ですね',
        '今日もよく動きましたね。お疲れさまです',
        '振り返りタイム。ざっくりでOKです'
      ]
    },
    night: {
      label: '夜',
      messages: [
        'お疲れさまです。もう夜ですね',
        '今日も長く動きましたね。お疲れさまでした',
        'そろそろ切り上げましょうか'
      ]
    },
    lateNight: {
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
    short: [
      'もう少し書いてみますか',
      'ざっくりでも書いておくと後で助かりますよ',
      '一行でいいので残しておきましょう'
    ],
    medium: [
      'いい感じです',
      'しっかり書けてますね',
      'いいですね、その調子で'
    ],
    long: [
      '今日は丁寧ですね',
      'たっぷり書けましたね',
      'すごい、しっかり振り返りできてますね'
    ]
  };

  /* ------------------------------------------------------------------
   * 設定エリア③：優しさメッセージ
   * ------------------------------------------------------------------ */
  function getKindnessMessage() {
    var now = new Date();
    var hour = now.getHours();
    var day = now.getDay();
    if (hour >= 21) return '今日はここまでで大丈夫ですよ。明日また書けばいいですからね';
    if (day === 5 && hour >= 17) return '今週もお疲れさまでした。週末ゆっくりしてください';
    if (day === 0 || day === 6) return '休日に書いてくれてありがとうございます。無理しないでくださいね';
    return null;
  }

  /* ------------------------------------------------------------------
   * 設定エリア④：過去レコードへの問いかけ文言
   * ------------------------------------------------------------------ */
  var PAST_PROMPTS = [
    '前のはどうなりましたか？',
    '前回の続き、進みましたか？',
    'これは解決しましたか？',
    '前に書いた事、片付きましたか？',
    'これ、いまどうなってますか？'
  ];

  /* ------------------------------------------------------------------
   * フィールドコード（テンプレートから抽出した実物）
   * ------------------------------------------------------------------ */
  var FIELD_MORNING = '今日1日で1つミスを潰すための行動を書く';
  var FIELD_EVENING = '今日つまった事___今日進んだ事_のどちらかを1つだけ書く';
  var FIELD_DATE    = '日付';
  var FIELD_NAME    = '氏名';
  var FIELD_RESULT  = '本日の結果';

  /* ==========================================================================
   * ロジック本体
   * ========================================================================== */

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

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

  // ---- ログインユーザー名取得（自然な「○○さん」呼び） ----------------
  function shortenName(fullName) {
    if (!fullName) return '';
    var trimmed = String(fullName).trim();
    if (/\s/.test(trimmed)) return trimmed.split(/\s+/)[0];   // スペース区切りなら姓
    if (trimmed.length >= 4) return trimmed.substring(0, 2);  // 4文字以上は先頭2文字
    return trimmed;
  }

  function getLoginUserShortName() {
    try {
      var user = kintone.getLoginUser();
      return shortenName(user && user.name ? user.name : '');
    } catch (e) { return ''; }
  }

  // ---- 挨拶バナー描画 ----------------------------------------------------
  function renderGreetingBanner() {
    var BANNER_ID = 'daily-greeting-banner';
    var old = document.getElementById(BANNER_ID);
    if (old) old.remove();

    var slot = getTimeSlot();
    var greet = GREETINGS[slot];
    var message = pickRandom(greet.messages);
    var kindness = getKindnessMessage();
    var userName = getLoginUserShortName();
    var nameCall = userName ? escapeHtml(userName) + 'さん、' : '';

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
      + '[' + escapeHtml(greet.label) + ']'
      + '</div>'
      + '<div>' + nameCall + escapeHtml(message) + '</div>';

    if (kindness) {
      html += '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed #7dd3fc;font-size:14px;">'
        + escapeHtml(kindness) + '</div>';
    }

    html += '<div id="daily-feedback-area" style="margin-top:10px;"></div>';
    html += '<div id="daily-history-area" style="margin-top:14px;"></div>';

    banner.innerHTML = html;
    var container = kintone.app.record.getHeaderMenuSpaceElement();
    if (container) container.appendChild(banner);
  }

  // ---- 文字数応援 -------------------------------------------------------
  function encourageByLength(text) {
    var len = (text || '').length;
    if (len === 0) return null;
    if (len < 10)  return pickRandom(ENCOURAGE.short);
    if (len < 30)  return pickRandom(ENCOURAGE.medium);
    return pickRandom(ENCOURAGE.long);
  }

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

  // ---- 過去レコードの取得と表示 ----------------------------------------

  function fetchMyRecentRecords(callback) {
    var loginUser = kintone.getLoginUser();
    if (!loginUser || !loginUser.code) { callback([]); return; }

    var appId = kintone.app.getId();
    if (!appId) { callback([]); return; }

    // 氏名フィールドにログインユーザーが含まれるレコードを、日付の降順で4件取得。
    // （現在編集中のレコードを除外して結果的に3件表示するため、1件多めに取る）
    var query = ''
      + FIELD_NAME + ' in ("' + loginUser.code + '") '
      + 'order by ' + FIELD_DATE + ' desc '
      + 'limit 4';

    var params = {
      app: appId,
      query: query,
      fields: ['$id', FIELD_DATE, FIELD_MORNING, FIELD_EVENING, FIELD_RESULT]
    };

    kintone.api(kintone.api.url('/k/v1/records', true), 'GET', params, function(resp) {
      callback(resp.records || []);
    }, function(err) {
      // 取得失敗してもアプリは止めない
      callback([]);
    });
  }

  function renderHistory(records, currentRecordId) {
    var area = document.getElementById('daily-history-area');
    if (!area) return;

    // 今開いているレコードは「過去」ではないので除外
    var filtered = records.filter(function(r) {
      return !currentRecordId || r['$id'].value !== String(currentRecordId);
    }).slice(0, 3);

    if (filtered.length === 0) {
      area.innerHTML = ''
        + '<div style="font-size:13px;color:#64748b;font-style:italic;">'
        + 'まだ過去の投稿がありません。今日が最初の一歩ですね。'
        + '</div>';
      return;
    }

    var prompt = pickRandom(PAST_PROMPTS);

    var html = ''
      + '<div style="font-size:13px;color:#0369a1;font-weight:600;margin-bottom:6px;">'
      + '【過去のあなたから】 ' + escapeHtml(prompt)
      + '</div>';

    filtered.forEach(function(r) {
      var date    = r[FIELD_DATE]    && r[FIELD_DATE].value    ? r[FIELD_DATE].value    : '';
      var morning = r[FIELD_MORNING] && r[FIELD_MORNING].value ? r[FIELD_MORNING].value : '';
      var evening = r[FIELD_EVENING] && r[FIELD_EVENING].value ? r[FIELD_EVENING].value : '';
      var result  = r[FIELD_RESULT]  && r[FIELD_RESULT].value  ? r[FIELD_RESULT].value  : '';

      var resultColor = '#64748b';
      if (result === '達成')        resultColor = '#16a34a';
      else if (result === '一部未達') resultColor = '#ca8a04';
      else if (result === '未達')    resultColor = '#dc2626';

      html += ''
        + '<div style="background:#fff;border:1px solid #bae6fd;border-radius:6px;'
        + 'padding:10px 12px;margin-bottom:6px;font-size:13px;line-height:1.5;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
        + '<span style="color:#0c4a6e;font-weight:600;">' + escapeHtml(date) + '</span>'
        + (result
            ? '<span style="color:' + resultColor + ';font-weight:600;font-size:12px;">' + escapeHtml(result) + '</span>'
            : '')
        + '</div>';

      if (morning) {
        html += '<div style="color:#475569;"><span style="color:#94a3b8;">朝の目標：</span>'
          + escapeHtml(morning) + '</div>';
      }
      if (evening) {
        html += '<div style="color:#475569;margin-top:2px;"><span style="color:#94a3b8;">振り返り：</span>'
          + escapeHtml(evening) + '</div>';
      }
      if (!morning && !evening) {
        html += '<div style="color:#94a3b8;font-style:italic;">（記入なし）</div>';
      }

      html += '</div>';
    });

    area.innerHTML = html;
  }

  function loadAndShowHistory(currentRecordId) {
    fetchMyRecentRecords(function(records) {
      renderHistory(records, currentRecordId);
    });
  }

  /* ------------------------------------------------------------------
   * イベント登録
   * ------------------------------------------------------------------ */

  kintone.events.on([
    'app.record.create.show',
    'app.record.edit.show',
    'app.record.detail.show'
  ], function(event) {
    renderGreetingBanner();
    var currentId = event.recordId
      || (event.record && event.record['$id'] && event.record['$id'].value)
      || null;
    loadAndShowHistory(currentId);
    return event;
  });

  kintone.events.on([
    'app.record.create.change.' + FIELD_MORNING,
    'app.record.edit.change.' + FIELD_MORNING
  ], function(event) {
    var text = event.record[FIELD_MORNING].value;
    showFeedback('朝の目標', encourageByLength(text));
    return event;
  });

  kintone.events.on([
    'app.record.create.change.' + FIELD_EVENING,
    'app.record.edit.change.' + FIELD_EVENING
  ], function(event) {
    var text = event.record[FIELD_EVENING].value;
    showFeedback('振り返り', encourageByLength(text));
    return event;
  });

})();
