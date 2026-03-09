// ==UserScript==
// @name         Hello LMS 助手
// @namespace    http://tampermonkey.net/
// @version      6.16
// @description  探针穿透版：使用 GM_xmlhttpRequest 重构底层雷达，无视CORS/CSP跨域拦截，实现100%静默传回
// @author       Peng
// @match        *://lms.cu.ac.kr/ilos/*
// @match        *://www.youtube.com/embed/*
// @match        *://www.youtube-nocookie.com/embed/*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ========================================================================
    // 📺 【YouTube 外部播放器 - 5秒防误触强杀引擎】
    // ========================================================================
    if (location.host.includes("youtube.com") || location.host.includes("youtube-nocookie.com")) {
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'HELLOLMS_MUTE_SYNC') {
                let v = document.querySelector('video');
                if (v) v.muted = e.data.muted;
            }
        });

        let ytTimer = setInterval(() => {
            let v = document.querySelector('video');
            let smallPlayBtn = document.querySelector('.ytp-play-button');
            let largePlayBtn = document.querySelector('.ytp-large-play-button');
            
            let isPlaying = (v && !v.paused && v.currentTime > 0 && v.readyState > 2);
            let btnLabel = smallPlayBtn ? (smallPlayBtn.getAttribute('aria-label') || smallPlayBtn.getAttribute('title') || "").toLowerCase() : "";
            
            if (!isPlaying && btnLabel && (btnLabel.includes('暂停') || btnLabel.includes('pause'))) {
                isPlaying = true; 
            }
            if (isPlaying) return; 

            if (largePlayBtn && window.getComputedStyle(largePlayBtn).display !== 'none') {
                largePlayBtn.click();
            } else if (smallPlayBtn && (btnLabel.includes('播放') || btnLabel.includes('play') || btnLabel === '')) {
                smallPlayBtn.click();
            } else if (v && v.paused) {
                v.play().catch(()=>{});
            }
        }, 5000); 
        return; 
    }

    if (window.self !== window.top) return;

    if (localStorage.getItem('gm_dcu_show') === 'false') {
        localStorage.setItem('gm_dcu_show', 'true');
    }

    // ========================================================================
    // 🌟 【官方 OTA 云端通信通道】
    const UPDATE_API_URL = "https://raw.githubusercontent.com/hmlxly/HelloLMS-Assistant/refs/heads/main/hellolms_update.json"; 
    const ABOUT_API_URL = "https://raw.githubusercontent.com/hmlxly/HelloLMS-Assistant/refs/heads/main/about.txt"; 
    const CURRENT_VERSION = 6.16; 
    
    // 🌟 【探针配置】
    const GOOGLE_FORM_ID = "1FAIpQLSeHiB3ExQrJ53hz132Vl4lGU5QtTogIWiU7P5-UyUpXwO2KoQ";
    const _E = { uuid: "entry.1878354025", time: "entry.2034928039", cour: "entry.1819257798", prog: "entry.1762136082", sys: "entry.318327329", ver: "entry.1659447108", env: "entry.1029161112", bot: "entry.1350846264", stat: "entry.325229386", eta: "entry.25793732" };
    // ========================================================================

    const LANG_DB = {
        cn: { title: "Hello LMS 助手 v6.16", start: "🚀 启动", stop: "⏸️ 停止", exp: "💾 导出", import: "📂 导入", cur: "当前项目", total: "总进度", run: "● 自动挂机中", pause: "○ 已停止", done: "✅ 已完成", todo: "⏳ 待学习", empty: "点击下方[📡 补满]开全图", watching: "▶ 正在看", hide: "收起", lock: "🔒锁定", log: "📝 操作审计日志", scan: "📡 补满", update: "🔄 更新", about: "ℹ️ 关于", reset: "🗑️ 重置", unlock: "立即解锁 (Enter)", err: "验证码无效", mute: "🔇 静音模式", unmute: "🔊 开启声音", scanning: "物理开图中...", scan_done: "✅ 上帝视角开启！", scan_err: "❌ 找不到周次", clear: "[免疫] 自动粉碎弹窗", manual: "用户手动操作", seek: "跳至记忆点", reset_msg: "确定要重置所有缓存数据吗？", import_ok: "✅ 导入成功！", import_err: "❌ 导入失败", rem: "剩余时长", eta: "预计完成", up_check: "连接云端...", up_new: "🚀 发现新版本 v", up_go: "是否前往下载？", up_none: "✅ 已是最新版本", up_fail: "❌ 连接失败", req_fail: "获取失败", req_time: "请求超时", force_title: "⚠️ 版本已过期", force_msg: "当前版本 (v{1}) 已停用，请强制更新至最新版本 (v{2}) 才能继续使用。", force_btn: "🚀 立即前往更新" },
        en: { title: "Hello LMS Bot v6.16", start: "🚀 Start", stop: "⏸️ Stop", exp: "💾 Export", import: "📂 Import", cur: "Course", total: "Total", run: "● Running", pause: "○ Paused", done: "✅ Done", todo: "⏳ To-Do", empty: "Click [Scan] below", watching: "▶ Watching", hide: "Hide", lock: "🔒Lock", log: "📝 Audit Logs", scan: "📡 Scan", update: "🔄 Update", about: "ℹ️ About", reset: "🗑️ Reset", unlock: "Unlock (Enter)", err: "Invalid Code", mute: "🔇 Muted", unmute: "🔊 Unmuted", scanning: "Scanning...", scan_done: "✅ Scan Complete!", scan_err: "❌ No weeks found", clear: "[Auto] Popup killed", manual: "Manual stop", seek: "Seek to memory", reset_msg: "Reset all data?", import_ok: "✅ Import Success!", import_err: "❌ Import Failed", rem: "Remaining", eta: "ETA", up_check: "Checking...", up_new: "🚀 New version v", up_go: "Download now?", up_none: "✅ Up to date", up_fail: "❌ Connection failed", req_fail: "Load failed", req_time: "Timeout", force_title: "⚠️ Version Outdated", force_msg: "Current version (v{1}) is disabled. Please update to v{2}.", force_btn: "🚀 Update Now" },
        kr: { title: "Hello LMS 봇 v6.16", start: "🚀 시작", stop: "⏸️ 정지", exp: "💾 내보내기", import: "📂 불러오기", cur: "현재과목", total: "총 진도", run: "● 자동재생 중", pause: "○ 정지됨", done: "✅ 완료됨", todo: "⏳ 학습예정", empty: "아래 [스캔] 클릭", watching: "▶ 시청중", hide: "숨기기", lock: "🔒잠금", log: "📝 작업 로그", scan: "📡 스캔", update: "🔄 업뎃", about: "ℹ️ 정보", reset: "🗑️ 초기화", unlock: "잠금해제 (Enter)", err: "코드 오류", mute: "🔇 음소거", unmute: "🔊 소리켜기", scanning: "스캔 중...", scan_done: "✅ 스캔 완료!", scan_err: "❌ 주차를 찾을 수 없음", clear: "[자동] 팝업 닫힘", manual: "수동 조작", seek: "이전 시점 이동", reset_msg: "모든 데이터를 초기화하시겠습니까?", import_ok: "✅ 불러오기 성공!", import_err: "❌ 불러오기 실패", rem: "남은시간", eta: "예상완료", up_check: "확인 중...", up_new: "🚀 새 버전 v", up_go: "지금 다운로드하시겠습니까?", up_none: "✅ 최신 버전입니다", up_fail: "❌ 연결 실패", req_fail: "불러오기 실패", req_time: "시간 초과", force_title: "⚠️ 버전 만료됨", force_msg: "현재 버전(v{1})의 지원이 중단되었습니다. 원활한 사용을 위해 v{2}(으)로 업데이트해 주세요.", force_btn: "🚀 지금 업데이트" }
    };

    const _K = { P: 'gm_dcu_total', L: 'gm_dcu_logs', F: 'gm_dcu_list', A: 'gm_dcu_auto', M: 'gm_dcu_mute', S: 'gm_dcu_sub', U: 'gm_dcu_ui', X: 'gm_dcu_auth', G: 'gm_dcu_lang', US: 'gm_dcu_show', SK: 'gm_dcu_seek', UUID: 'gm_dcu_uuid', TRK: 'gm_dcu_tracked', TOFF: 'gm_dcu_tracker_off' };

    const _LD = {
        l: (k, d = '[]') => JSON.parse(localStorage.getItem(k) || d),
        s: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
        getL: () => localStorage.getItem(_K.G) || 'cn',
        sub() { const f = document.querySelector('#subject-span')?.innerText.trim() || document.querySelector('.welcome_subject')?.innerText.trim(); if(f) this.s(_K.S, f); return localStorage.getItem(_K.S) || "Hello LMS Course"; },
        log(m) { let l = this.l(_K.L); l.push(`[${new Date().toLocaleTimeString()}] ${m}`); if(l.length > 500) l.shift(); this.s(_K.L, l); _syncLogOnly(); },
        listKey() { return `${_K.F}_${this.sub()}`; },
        getList() { return JSON.parse(localStorage.getItem(this.listKey()) || '[]'); },
        setList(v) { localStorage.setItem(this.listKey(), JSON.stringify(v)); }
    };

    const _VC = {
        m: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", p: [8, 30, 29, 21, 20, 31, 10, 29, 25, 16, 11, 31, 22, 1, 28, 24],
        b32(s) { let b = ""; for (let i=0; i<s.length; i++) { let v = this.m.indexOf(s.charAt(i).toUpperCase()); if (v >= 0) b += v.toString(2).padStart(5, '0'); } const r = new Uint8Array(Math.floor(b.length/8)); for (let i=0; i<r.length; i++) r[i] = parseInt(b.substr(i*8, 8), 2); return r; },
        async g(s, e) { const kb = this.b32(s), cb = new ArrayBuffer(8), dv = new DataView(cb); dv.setBigUint64(0, BigInt(e), false); const ck = await crypto.subtle.importKey("raw", kb, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]); const sig = await crypto.subtle.sign("HMAC", ck, cb), hm = new Uint8Array(sig), o = hm[hm.length-1] & 0x0f; const p = (((hm[o] & 0x7f) << 24) | ((hm[o+1] & 0xff) << 16) | ((hm[o+2] & 0xff) << 8) | (hm[o+3] & 0xff)) % 1000000; return p.toString().padStart(6, '0'); },
        async v(i) { const sk = this.p.map(x => this.m.charAt(x)).join(''), ep = Math.floor(Date.now() / 30000); for (let j = -2; j <= 2; j++) { if (await this.g(sk, ep + j) === i.trim()) return true; } return false; }
    };

    let _watching = null;
    let _bz = false;
    const getWin = () => typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // 🌟 【重头戏：探针系统重构 - 底层API穿透】 🌟
    function _fireTelemetry() {
        if (localStorage.getItem(_K.TOFF) === 'true') return;
        const trackKey = `${_K.TRK}_${_LD.sub()}_${new Date().toDateString()}`;
        if (localStorage.getItem(trackKey) === 'sent') return; 

        let uuid = localStorage.getItem(_K.UUID);
        if (!uuid) { uuid = 'HelloLMS-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36); localStorage.setItem(_K.UUID, uuid); }

        const entries = { 
            [_E.uuid]: uuid, 
            [_E.time]: new Date().toLocaleString(), 
            [_E.cour]: _LD.sub(), 
            [_E.prog]: localStorage.getItem(`${_K.P}_${_LD.sub()}`) || "0%", 
            [_E.sys]: `Node:${navigator.hardwareConcurrency||'N/A'}`, 
            [_E.ver]: `v${CURRENT_VERSION}`, 
            [_E.env]: Intl.DateTimeFormat().resolvedOptions().timeZone, 
            [_E.bot]: localStorage.getItem(_K.A)==='true'?'RUN':'STOP', 
            [_E.stat]: `Active`, 
            [_E.eta]: `N/A` 
        };

        // 将数据转换为 URL 编码格式，适配 Google 表单要求
        const params = new URLSearchParams();
        for (let key in entries) {
            params.append(key, entries[key]);
        }

        // 调用油猴最高权限 API 发送 POST 请求，彻底穿透跨域(CORS)与安全(CSP)限制
        GM_xmlhttpRequest({
            method: "POST",
            url: `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`,
            data: params.toString(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {
                // 如果请求成功发出去，记录今天已发状态
                if (response.status === 200 || response.status === 0) {
                    localStorage.setItem(trackKey, 'sent');
                    _LD.log("🛰️ 硬件雷达握手成功");
                }
            },
            onerror: function(err) {
                console.warn("[Hello LMS 助手] 探针发射失败：", err);
            }
        });
    }

    // --- 🛠️ 独立管理员悬浮窗 ---
    function _openAdminCenter() {
        const win = getWin();
        let pwd = win._orig_prompt ? win._orig_prompt("🔐 Admin Password:") : prompt("🔐 Admin Password:");
        if (pwd !== "18890") return;
        if (document.querySelector('#gm-admin-center')) return;

        const adm = document.createElement('div');
        adm.id = 'gm-admin-center';
        adm.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:260px; background:#1a1a1a; color:#0f0; border:2px solid #ffff60; border-radius:15px; padding:20px; z-index:2147483645; font-family:monospace; box-shadow:0 0 100px rgba(0,0,0,0.8);';
        
        let isOff = localStorage.getItem(_K.TOFF) === 'true';
        adm.innerHTML = `
            <div style="font-weight:bold; color:#ffff60; text-align:center; margin-bottom:20px; font-size:14px;">🛠️ 管理员控制中枢</div>
            <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                <span>后台探针状态:</span>
                <button id="_adm_tk_btn" style="background:${isOff?'#500':'#050'}; color:#fff; border:1px solid #888; cursor:pointer; padding:5px 12px; border-radius:5px;">${isOff?'已切断':'运行中'}</button>
            </div>
            <div style="font-size:11px; margin-bottom:8px; color:#aaa;">注入精确授权时长 (H:M:S):</div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:20px;">
                <input id="_adm_h" type="number" placeholder="时" style="width:100%; background:#000; color:#0f0; border:1px solid #444; text-align:center; padding:5px;">
                <input id="_adm_m" type="number" placeholder="分" style="width:100%; background:#000; color:#0f0; border:1px solid #444; text-align:center; padding:5px;">
                <input id="_adm_s" type="number" placeholder="秒" style="width:100%; background:#000; color:#0f0; border:1px solid #444; text-align:center; padding:5px;">
            </div>
            <button id="_adm_apply" style="width:100%; background:#ffff60; color:#000; border:none; padding:12px; font-weight:bold; cursor:pointer; border-radius:10px; margin-bottom:10px;">💾 应用设置并重载</button>
            <button id="_adm_close_btn" style="width:100%; background:#333; color:#ccc; border:none; padding:8px; cursor:pointer; border-radius:8px;">❌ 关闭此窗口</button>
        `;
        document.body.appendChild(adm);

        document.querySelector('#_adm_tk_btn').onclick = (e) => {
            let cur = localStorage.getItem(_K.TOFF) === 'true';
            localStorage.setItem(_K.TOFF, !cur);
            e.target.innerText = !cur ? '已切断' : '运行中';
            e.target.style.background = !cur ? '#500' : '#050';
        };

        document.querySelector('#_adm_apply').onclick = () => {
            const h=parseInt(document.querySelector('#_adm_h').value||0), m=parseInt(document.querySelector('#_adm_m').value||0), s=parseInt(document.querySelector('#_adm_s').value||0);
            localStorage.setItem(_K.X, Date.now() - (86400000 - ((h*3600+m*60+s)*1000)));
            location.reload();
        };
        document.querySelector('#_adm_close_btn').onclick = () => adm.remove();
    }

    function makePanelSafe() {
        const panel = document.querySelector('#gm-panel');
        if (!panel) return;
        let wW = window.innerWidth || document.documentElement.clientWidth;
        let wH = window.innerHeight || document.documentElement.clientHeight;
        let pL = panel.offsetLeft;
        let pT = panel.offsetTop;
        let pW = panel.offsetWidth || 340;
        let pH = panel.offsetHeight || 680;

        let newL = pL;
        let newT = pT;

        if (pL + pW > wW) newL = Math.max(10, wW - pW - 10);
        if (pT + pH > wH) newT = Math.max(10, wH - pH - 10);
        if (pL < 0) newL = 10;
        if (pT < 0) newT = 10;

        if (newL !== pL || newT !== pT) {
            panel.style.left = newL + 'px';
            panel.style.top = newT + 'px';
            panel.style.right = 'auto';
            let currentV = _LD.l(_K.U, '{"t":"41px","l":"auto"}');
            currentV.l = newL + 'px';
            currentV.t = newT + 'px';
            _LD.s(_K.U, currentV);
        }
    }

    // --- 🖥️ 原生 UI 面板 ---
    function _ui() {
        if (localStorage.getItem(_K.US) === 'false') {
            const b = document.createElement('div'); b.innerText="⚙️"; b.style.cssText='position:fixed;bottom:20px;right:20px;z-index:2147483647;cursor:pointer;background:#ffff60;padding:12px;border-radius:50%;font-size:22px;box-shadow:0 5px 15px rgba(0,0,0,0.3);';
            b.onclick=()=>{ localStorage.setItem(_K.US,'true'); location.reload(); }; document.body.appendChild(b); return;
        }
        if (document.querySelector('#gm-panel')) return;

        const curLang = _LD.getL();
        const curL = LANG_DB[curLang] || LANG_DB.cn;
        
        const st = document.createElement('style');
        st.innerHTML = `
            #gm-panel { display:flex; flex-direction:column; width:340px; height:680px; border:2px solid #ffff60; background:rgba(255,255,255,0.92); backdrop-filter:blur(20px); position:fixed; z-index:2147483640; padding:15px; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,0.5); font-family:sans-serif; color:#222; }
            #_h_v { cursor: move; user-select: none; border-bottom: 2px solid rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; flex-shrink:0; }
            .lang-btn { font-size:10px; padding:2px 5px; background:#eee; border:1px solid #ccc; cursor:pointer; border-radius:4px; margin-left:3px; }
            .lang-active { background:#ffff60; font-weight:bold; border-color:#d4d400; }
            .top-btn { border:none; padding:4px 8px; border-radius:6px; font-size:10px; cursor:pointer; font-weight:bold; margin-left:4px; transition:0.2s; }
            .list-box { font-size:11px; overflow-y:auto; background:rgba(255,255,255,0.7); border:1px solid #ddd; border-radius:12px; margin-bottom:10px; padding:8px; flex-grow:1; }
            .item-row { display:flex; justify-content:space-between; border-bottom:1px dashed rgba(0,0,0,0.06); padding:4px 0; }
            .done-item { color:#2e7d32; opacity:0.85; } .todo-item { color:#333; font-weight:bold; }
            .watch-item { color:#d32f2f !important; font-weight:bold; background:rgba(211,47,47,0.1); border-radius:6px; padding:4px; box-shadow: 0 0 8px rgba(211,47,47,0.2); }
            #_lb_v { height:110px; font-size:10px; overflow-y:auto; color:#555; background:#f5f5f5; padding:8px; border-radius:10px; border:1px solid #ccc; flex-shrink:0; line-height:1.4; scroll-behavior: smooth; }
            .btn-row { display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:6px; flex-shrink:0; margin-bottom: 5px; }
            button.action-btn { border:none; padding:10px 0; cursor:pointer; border-radius:8px; font-weight:bold; font-size:11px; transition:0.2s; text-align:center; }
            .bottom-btn { background:#fff; border:1px solid; border-radius:6px; padding:6px 0; font-size:10px; font-weight:bold; cursor:pointer; transition:0.2s; display:flex; justify-content:center; align-items:center; }
            .bottom-btn:hover { filter: brightness(0.9); }
            ._rs { position:absolute; background: transparent; z-index:2147483648; }
            ._rs-n { top:-5px; left:0; width:100%; height:10px; cursor:ns-resize; } ._rs-s { bottom:-5px; left:0; width:100%; height:10px; cursor:ns-resize; }
            ._rs-e { top:0; right:-5px; width:10px; height:100%; cursor:ew-resize; } ._rs-w { top:0; left:-5px; width:10px; height:100%; cursor:ew-resize; }
            ._rs-nw { top:-5px; left:-5px; width:15px; height:15px; cursor:nwse-resize; } ._rs-ne { top:-5px; right:-5px; width:15px; height:15px; cursor:nesw-resize; }
            ._rs-sw { bottom:-5px; left:-5px; width:15px; height:15px; cursor:nesw-resize; } ._rs-se { bottom:-5px; right:-5px; width:15px; height:15px; cursor:nwse-resize; }
            .author-sig { position: absolute; bottom: -20px; right: 10px; font-size: 10px; color: rgba(0,0,0,0.3); font-weight: bold; }
        `;
        document.head.appendChild(st);
        let v = _LD.l(_K.U, '{"t":"41px","l":"auto"}');

        const h_html = `
            <div id="gm-panel" style="top:${v.t}; left:${v.l}; right:${v.l==='auto'?'10px':'auto'}; width:${v.w||'340px'}; height:${v.h||'680px'};">
                <div id="_h_v">
                    <div style="display:flex; align-items:center;">
                        <span style="font-weight:bold; font-size:13px; color:#111;">${curL.title}</span>
                        <span id="_auth_timer" style="font-size:11px; color:#d32f2f; margin-left:6px; font-family:monospace; font-weight:bold;"></span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <span class="lang-btn ${curLang === 'cn' ? 'lang-active' : ''}" data-lang="cn">CN</span>
                        <span class="lang-btn ${curLang === 'en' ? 'lang-active' : ''}" data-lang="en">EN</span>
                        <span class="lang-btn ${curLang === 'kr' ? 'lang-active' : ''}" data-lang="kr">KR</span>
                        <button id="_cls_b" class="top-btn" style="background:#ddd; color:#333;">${curL.hide}</button>
                        <button id="_lck_b" class="top-btn" style="background:#d32f2f; color:white;">${curL.lock}</button>
                    </div>
                </div>
                <div style="background:#fffbe6; border:1px solid #ffe58f; padding:12px; font-size:12px; border-radius:12px; margin: 10px 0; flex-shrink:0;">
                    <div style="font-weight:bold; color:#000;">${curL.cur}: <span id="_sub_v">-</span></div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; position:relative;">
                        <span>${curL.total}: <b id="_tp_v" style="font-size:18px; color:#d84315;">0%</b></span>
                        <div id="_adm_zone" style="position:absolute; right:0; top:-18px; width:50px; height:18px; cursor:default; z-index:10; background:transparent;"></div>
                        <button id="_mt_v" style="border:1px solid #aaa; font-size:10px; padding:5px 10px; border-radius:8px; cursor:pointer; font-weight:bold; min-width:80px;"></button>
                    </div>
                    <div id="_eta_box" style="font-size:10px; color:#856404; margin-top:6px; font-weight:normal;"></div>
                    <div id="_st_v" style="font-size:11px; font-weight:bold; margin-top:6px;"></div>
                </div>
                <div style="font-size:12px; font-weight:bold; margin-bottom:5px; color:#ef6c00;">${curL.todo}</div>
                <div id="_tl_v" class="list-box"></div>
                <div style="font-size:12px; font-weight:bold; margin-bottom:5px; color:#2e7d32;">${curL.done}</div>
                <div id="_dl_v" class="list-box" style="height:120px;"></div>
                
                <div class="btn-row">
                    <button id="_st_b" class="action-btn" style="background:#2e7d32; color:white;">${curL.start}</button>
                    <button id="_sp_b" class="action-btn" style="background:#c62828; color:white;">${curL.stop}</button>
                    <button id="_ep_b" class="action-btn" style="background:#1565c0; color:white;">${curL.exp}</button>
                    <button id="_ipt_b" class="action-btn" style="background:#f57c00; color:white;">${curL.import}</button>
                </div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap:4px; margin-top:8px; margin-bottom:4px;">
                    <button id="_scn_b" class="bottom-btn" style="border-color:#007bff; color:#007bff;">${curL.scan}</button>
                    <button id="_upd_b" class="bottom-btn" style="border-color:#6c757d; color:#6c757d;">${curL.update}</button>
                    <button id="_abt_b" class="bottom-btn" style="border-color:#17a2b8; color:#17a2b8;">${curL.about}</button>
                    <button id="_rs_b"  class="bottom-btn" style="border-color:#dc3545; color:#dc3545;">${curL.reset}</button>
                </div>

                <div id="_lb_v"></div>
                <div class="author-sig">Designed by Peng</div>
                <div class="_rs _rs-n"></div><div class="_rs _rs-s"></div><div class="_rs _rs-e"></div><div class="_rs _rs-w"></div><div class="_rs _rs-nw"></div><div class="_rs _rs-ne"></div><div class="_rs _rs-sw"></div><div class="_rs _rs-se"></div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', h_html);
        
        const panel = document.querySelector('#gm-panel');

        makePanelSafe();
        window.addEventListener('resize', makePanelSafe);

        let clks = 0, t = null;
        document.querySelector('#_adm_zone').onclick = () => { clks++; clearTimeout(t); if(clks>=3){ clks=0; _openAdminCenter(); } else t=setTimeout(()=>clks=0, 500); };

        document.querySelector('#_h_v').onmousedown = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('.lang-btn')) return;
            _bz = true; let x = e.clientX - panel.getBoundingClientRect().left, y = e.clientY - panel.getBoundingClientRect().top;
            const mv = (ee) => { panel.style.left = ee.clientX - x + 'px'; panel.style.top = ee.clientY - y + 'px'; panel.style.right = 'auto'; };
            const st = () => { _bz = false; _LD.s(_K.U, { w: panel.style.width, h: panel.style.height, t: panel.style.top, l: panel.style.left }); makePanelSafe(); document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', st); };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', st);
        };
        ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].forEach(r => {
            const s = document.querySelector(`._rs-${r}`); 
            if(s) s.onmousedown = (e) => {
                e.preventDefault(); e.stopPropagation(); _bz = true;
                const sX=e.clientX, sY=e.clientY, sW=panel.offsetWidth, sH=panel.offsetHeight, sL=panel.offsetLeft, sT=panel.offsetTop;
                const mv = (ee) => {
                    if (r.includes('e')) panel.style.width = sW + (ee.clientX - sX) + 'px';
                    if (r.includes('s')) panel.style.height = sH + (ee.clientY - sY) + 'px';
                    if (r.includes('w')) { panel.style.width = sW - (ee.clientX - sX) + 'px'; panel.style.left = sL + (ee.clientX - sX) + 'px'; }
                    if (r.includes('n')) { panel.style.height = sH - (ee.clientY - sY) + 'px'; panel.style.top = sT + (ee.clientY - sY) + 'px'; }
                };
                const st = () => { _bz = false; _LD.s(_K.U, { w: panel.style.width, h: panel.style.height, t: panel.style.top, l: panel.style.left }); makePanelSafe(); document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', st); };
                document.addEventListener('mousemove', mv); document.addEventListener('mouseup', st);
            };
        });

        document.querySelector('#_cls_b').onclick = () => { localStorage.setItem(_K.US, 'false'); location.reload(); };
        document.querySelector('#_lck_b').onclick = () => { localStorage.removeItem(_K.X); location.reload(); };
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.onclick = (e) => { e.stopPropagation(); localStorage.setItem(_K.G, e.target.dataset.lang); window.removeEventListener('resize', makePanelSafe); panel.remove(); _ui(); };
        });

        document.querySelector('#_st_b').onclick = () => { localStorage.setItem(_K.A, 'true'); _LD.log(`${curL.start} 执行`); location.reload(); };
        document.querySelector('#_sp_b').onclick = () => { localStorage.setItem(_K.A, 'false'); _LD.log(`${curL.stop} 执行`); };
        
        document.querySelector('#_mt_v').onclick = () => { 
            const m = localStorage.getItem(_K.M) !== 'false'; 
            localStorage.setItem(_K.M, !m); 
            _sync(); 
            const irWin = document.getElementById("contentViewer")?.contentWindow;
            if (irWin) {
                let ytFrame = irWin.document.querySelector('iframe[src*="youtube"]');
                if (ytFrame) ytFrame.contentWindow.postMessage({ type: 'HELLOLMS_MUTE_SYNC', muted: !m }, '*');
            }
        };

        document.querySelector('#_scn_b').onclick = _silentScanAll;
        document.querySelector('#_rs_b').onclick = () => { if(confirm(curL.reset_msg)) { localStorage.clear(); location.reload(); } };

        document.querySelector('#_abt_b').onclick = () => {
            if (document.querySelector('#gm-abt-modal')) return;
            const modal = document.createElement('div');
            modal.id = 'gm-abt-modal';
            modal.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:300px; background:#fff; border:2px solid #17a2b8; border-radius:12px; z-index:2147483645; box-shadow:0 10px 40px rgba(0,0,0,0.5); display:flex; flex-direction:column; overflow:hidden; font-family:sans-serif;';
            modal.innerHTML = `
                <div style="background:#17a2b8; color:#fff; padding:12px; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                    <span>${curL.about} / Notice</span>
                    <span id="_abt_close" style="cursor:pointer; background:rgba(0,0,0,0.2); padding:2px 8px; border-radius:6px; font-size:12px;">❌</span>
                </div>
                <div id="_abt_content" style="padding:15px; font-size:12px; color:#333; min-height:100px; max-height:400px; overflow-y:auto; white-space:pre-wrap; line-height:1.6; background:#f8f9fa;">${curL.up_check}</div>
            `;
            document.body.appendChild(modal);

            document.querySelector('#_abt_close').onclick = () => modal.remove();

            GM_xmlhttpRequest({
                method: "GET", url: ABOUT_API_URL + "?t=" + new Date().getTime(), timeout: 5000,
                onload: function(res) {
                    if (res.status === 200) { document.querySelector('#_abt_content').innerText = res.responseText; } 
                    else { document.querySelector('#_abt_content').innerText = `${curL.req_fail} (Status: ${res.status})`; }
                },
                onerror: function() { document.querySelector('#_abt_content').innerText = curL.up_fail; },
                ontimeout: function() { document.querySelector('#_abt_content').innerText = curL.req_time; }
            });
        };

        document.querySelector('#_ep_b').onclick = () => {
            const sysLang = navigator.language, sysTZ = Intl.DateTimeFormat().resolvedOptions().timeZone, scr = `${window.screen.width}x${window.screen.height}`, cores = navigator.hardwareConcurrency || 'N/A', ram = navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'N/A', ua = navigator.userAgent;
            let os = "Unknown OS", browser = "Unknown Browser";
            if (ua.includes("Win")) os = "Windows"; else if (ua.includes("Mac")) os = "MacOS"; else if (ua.includes("Linux")) os = "Linux"; else if (ua.includes("Android")) os = "Android"; else if (ua.includes("like Mac")) os = "iOS";
            if (ua.includes("Chrome")) browser = "Chrome"; else if (ua.includes("Firefox")) browser = "Firefox"; else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"; else if (ua.includes("Edge") || ua.includes("Edg/")) browser = "Edge";
            const sysInfo = `=== SYSTEM & HARDWARE RADAR ===\r\nOS: ${os}\r\nBrowser: ${browser} (${sysLang})\r\nTimezone: ${sysTZ}\r\nScreen Res: ${scr}\r\nCPU Cores: ${cores}\r\nRAM (Approx): ${ram}\r\n\r\n`;
            let allCoursesData = `=== ALL COURSES PROGRESS ===\r\n`;
            for (let i = 0; i < localStorage.length; i++) {
                let k = localStorage.key(i);
                if (k.startsWith(_K.F + '_')) {
                    let courseName = k.substring((_K.F + '_').length), courseTotal = localStorage.getItem(`${_K.P}_${courseName}`) || '0%';
                    allCoursesData += `\r\n[COURSE: ${courseName}] - Total Progress: ${courseTotal}\r\n`;
                    let d = JSON.parse(localStorage.getItem(k) || '[]');
                    d.forEach(x => { allCoursesData += `  ${x.percent==='100%'?'[DONE]':'[TODO]'} ${x.title} (${x.percent} | ${x.time})\r\n`; });
                }
            }
            allCoursesData += `\r\n`;
            const l = _LD.l(_K.L); let logData = `=== GLOBAL OPERATION LOGS ===\r\n${l.join('\r\n')}\r\n\r\n`;
            let backup = {};
            for (let i = 0; i < localStorage.length; i++) { let k = localStorage.key(i); if (k.startsWith('gm_dcu_')) backup[k] = localStorage.getItem(k); }
            let backupData = `=== SYSTEM_BACKUP_DO_NOT_EDIT ===\r\n${btoa(encodeURIComponent(JSON.stringify(backup)))}`;
            let finalOutput = `=== Hello LMS MASTER AUDIT REPORT ===\r\nDATE: ${new Date().toLocaleString()}\r\n\r\n` + sysInfo + allCoursesData + logData + backupData;
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([finalOutput], {type:'text/plain'})); a.download = `HelloLMS_Master_Audit_${Date.now()}.txt`; a.click();
        };

        document.querySelector('#_ipt_b').onclick = () => {
            let ipt = document.createElement('input'); ipt.type = 'file'; ipt.accept = '.txt';
            ipt.onchange = e => {
                let file = e.target.files[0]; if (!file) return;
                let reader = new FileReader();
                reader.onload = ev => {
                    let content = ev.target.result, match = content.match(/=== SYSTEM_BACKUP_DO_NOT_EDIT ===\s*(.*)/);
                    if (match && match[1]) {
                        try {
                            let backup = JSON.parse(decodeURIComponent(atob(match[1].trim())));
                            Object.keys(backup).forEach(k => localStorage.setItem(k, backup[k]));
                            alert(curL.import_ok); location.reload();
                        } catch(err) { alert(curL.import_err); }
                    } else { alert(curL.import_err); }
                }; reader.readAsText(file);
            }; ipt.click();
        };

        document.querySelector('#_upd_b').onclick = () => {
            const btn = document.querySelector('#_upd_b'); btn.innerText = curL.up_check; btn.disabled = true;
            GM_xmlhttpRequest({
                method: "GET", url: UPDATE_API_URL + "?t=" + new Date().getTime(), timeout: 5000,
                onload: function(res) {
                    try {
                        const data = JSON.parse(res.responseText);
                        if (parseFloat(data.version) > CURRENT_VERSION) {
                            if (confirm(`${curL.up_new}${data.version}!\n\n${curL.up_go}`) && data.url) GM_openInTab(data.url, { active: true });
                        } else { alert(curL.up_none); }
                    } catch(e) { alert(curL.up_fail); }
                    btn.innerText = curL.update; btn.disabled = false;
                },
                onerror: function() { alert(curL.up_fail); btn.innerText = curL.update; btn.disabled = false; }
            });
        };
    }

    const timeToSeconds = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        let p = timeStr.trim().split(':').reverse(), s = 0;
        for (let i = 0; i < p.length; i++) s += parseInt(p[i] || 0) * Math.pow(60, i);
        return s;
    };

    function _syncLogOnly() {
        const logBox = document.querySelector('#_lb_v');
        if(logBox) logBox.innerHTML = _LD.l(_K.L).map(x => `<div>${x}</div>`).reverse().join('');
    }

    function _sync() {
        const curL = LANG_DB[_LD.getL()] || LANG_DB.cn, sub = _LD.sub(), a = localStorage.getItem(_K.A) === 'true', m = localStorage.getItem(_K.M) !== 'false';
        const st = document.querySelector('#_st_v');
        if (st) {
            st.innerText = a ? curL.run : curL.pause; st.style.color = a ? '#2e7d32' : '#c62828';
            document.querySelector('#_sub_v').innerText = sub;
            document.querySelector('#_tp_v').innerText = localStorage.getItem(`${_K.P}_${sub}`) || "0%";
            const mtBtn = document.querySelector('#_mt_v');
            mtBtn.innerText = m ? curL.mute : curL.unmute; mtBtn.style.background = m ? "#f5f5f5" : "#e8f5e9"; mtBtn.style.color = m ? "#666" : "#2e7d32";
            
            const authTimeStr = localStorage.getItem(_K.X), timerEl = document.querySelector('#_auth_timer');
            if (authTimeStr && timerEl) {
                const remAuth = 86400000 - (Date.now() - parseInt(authTimeStr));
                if (remAuth > 0) {
                    let h = Math.floor(remAuth / 3600000).toString().padStart(2, '0'), min = Math.floor((remAuth % 3600000) / 60000).toString().padStart(2, '0'), s = Math.floor((remAuth % 60000) / 1000).toString().padStart(2, '0');
                    timerEl.innerText = `⏳ ${h}:${min}:${s}`;
                } else { localStorage.removeItem(_K.X); location.reload(); }
            }

            const storage = _LD.getList(); let todoH = "", doneH = "", totalRemSec = 0; 
            storage.forEach(item => {
                let isW = _watching && _watching.title === item.title;
                let row = `<div class="item-row ${isW?'watch-item':''} ${item.percent==='100%'?'done-item':'todo-item'}">
                    <span title="${item.title}">${isW?'▶':(item.percent==='100%'?'✔':'○')} ${item.title.length>20 ? item.title.substring(0,20)+'...' : item.title}</span>
                    <span>${isW?_watching.percent:item.percent} | ${isW?_watching.time:item.time}</span>
                </div>`;
                if (item.percent === "100%") { doneH += row; } 
                else {
                    todoH += row; let p = (isW ? _watching.time : item.time).split('/');
                    if (p.length >= 2) { let rem = timeToSeconds(p[1]) - timeToSeconds(p[0]); if (rem > 0) totalRemSec += rem; }
                }
            });

            const etaBox = document.querySelector('#_eta_box');
            if (etaBox) {
                if (totalRemSec > 0) {
                    let h = Math.floor(totalRemSec / 3600), min = Math.floor((totalRemSec % 3600) / 60), remStr = h > 0 ? `${h}h ${min}m` : `${min}m ${Math.floor(totalRemSec % 60)}s`;
                    let etaDate = new Date(Date.now() + totalRemSec * 1000);
                    let mm = (etaDate.getMonth() + 1).toString().padStart(2, '0'), dd = etaDate.getDate().toString().padStart(2, '0'), hh = etaDate.getHours().toString().padStart(2, '0'), minStr = etaDate.getMinutes().toString().padStart(2, '0');
                    etaBox.innerHTML = `<div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.03); padding:4px 8px; border-radius:6px;"><span>⏳ ${curL.rem}: <b style="color:#d84315;">${remStr}</b></span><span>${curL.eta}: <b style="color:#d84315;">${etaDate.getFullYear()}-${mm}-${dd} ${hh}:${minStr}</b></span></div>`;
                } else { etaBox.innerHTML = `<div style="background:rgba(0,0,0,0.03); padding:4px 8px; border-radius:6px; text-align:center;">⏳ ${curL.rem}: <b>0m</b></div>`; }
            }
            document.querySelector('#_tl_v').innerHTML = todoH || `<div style="color:#999;">${curL.empty}</div>`;
            document.querySelector('#_dl_v').innerHTML = doneH || `<div style="color:#999;">${curL.empty}</div>`;
        }
        _syncLogOnly();
    }

    const getPData = (titleEl, rootNode = document.body) => {
        let node = titleEl;
        let p = "0%", tm = "";
        
        while (node && node.parentElement && node.parentElement !== rootNode) {
            let titlesInParent = node.parentElement.querySelectorAll('.site-mouseover-color, .item-title-lesson');
            if (titlesInParent.length > 1) break; 
            node = node.parentElement;
        }

        let pt = node.querySelector('#per_text');
        if (pt) {
            p = pt.innerText.trim();
        } else {
            let img = node.querySelector('img[src*="player_"]');
            if (img) {
                p = img.src.includes('check') ? "100%" : "0%";
            } else {
                let text = node.innerText || "";
                let pMatch = text.match(/(\d+(?:\.\d+)?)%/);
                if (pMatch) p = pMatch[1] + "%";
            }
        }

        let contextText = node.innerText || "";
        let tMatch3 = contextText.match(/((?:\d+:)?\d+:\d+)\s*\/\s*((?:\d+:)?\d+:\d+)\s*\/\s*((?:\d+:)?\d+:\d+)/);
        let tMatch2 = contextText.match(/((?:\d+:)?\d+:\d+)\s*\/\s*((?:\d+:)?\d+:\d+)/);
        
        if (tMatch3) { tm = tMatch3[1] + " / " + tMatch3[3]; } 
        else if (tMatch2) { tm = tMatch2[1] + " / " + tMatch2[2]; } 
        else { tm = p === "100%" ? "Done" : "Ready"; }

        return { p, tm };
    };

    async function _silentScanAll() {
        const curL = LANG_DB[_LD.getL()] || LANG_DB.cn, btn = document.querySelector('#_scn_b');
        if(btn) { btn.innerText = curL.scanning; btn.style.background = "#ef6c00"; btn.style.color = "#fff"; btn.style.borderColor = "#ef6c00"; btn.disabled = true; }
        const weekNodes = document.querySelectorAll('.ibox3 .wb-week');
        let weeks = Array.from(weekNodes).map(n => n.getAttribute('var') || n.innerText.replace(/[^0-9]/g, '')).filter(Boolean);
        weeks = [...new Set(weeks)];
        if (!weeks.length) { _LD.log(curL.scan_err); if(btn) { btn.innerText = curL.scan; btn.style.background = "#fff"; btn.style.color = "#007bff"; btn.style.borderColor = "#007bff"; btn.disabled = false; } return; }
        _LD.log(`📡 启动隐藏探测器：准备遍历 ${weeks.length} 周...`);
        let storage = _LD.getList(), iframe = document.createElement('iframe');
        iframe.style.display = 'none'; document.body.appendChild(iframe);
        for (let i = 0; i < weeks.length; i++) {
            await new Promise(resolve => {
                iframe.onload = () => { setTimeout(() => { try {
                            let doc = iframe.contentDocument || iframe.contentWindow.document;
                            doc.querySelectorAll('.site-mouseover-color, .item-title-lesson').forEach(titleEl => {
                                const title = titleEl.innerText.trim(); if (!title) return;
                                const data = getPData(titleEl, doc.body), idx = storage.findIndex(x => x.title === title);
                                
                                let t_str = data.tm;
                                if (data.p === '100%') {
                                    let parts = data.tm.split('/');
                                    if (parts.length >= 2) { let tot = parts[parts.length - 1].trim(); t_str = `${tot} / ${tot}`; } 
                                    else { t_str = "Done"; }
                                }
                                const entry = { title, percent: data.p, time: t_str };

                                if (idx === -1) { storage.push(entry); } else if (parseFloat(data.p) > parseFloat(storage[idx].percent)) { storage[idx] = entry; }
                            });
                        } catch(e) {} resolve(); }, 400); 
                }; iframe.src = `/ilos/st/course/online_list_form.acl?WEEK_NO=${weeks[i]}`;
            });
        }
        iframe.remove(); _LD.setList(storage); _LD.log(curL.scan_done); _sync();
        if(btn) { btn.innerText = curL.scan; btn.style.background = "#fff"; btn.style.color = "#007bff"; btn.style.borderColor = "#007bff"; btn.disabled = false; }
    }

    function _loop() {
        const curL = LANG_DB[_LD.getL()] || LANG_DB.cn, sub = _LD.sub();
        document.querySelectorAll('.ui-dialog-buttonset button, #layer_alert .btn, .popup_close, .btn_confirm').forEach(p => { if(p.offsetParent !== null) { p.click(); _LD.log(curL.clear); } });

        if (!window.location.href.includes('online_view')) {
            let newVal = "", pText = document.body.innerText, pMatch = pText.match(/진도율[^\d]*(\d+(?:\.\d+)?)%/);
            if (pMatch) newVal = pMatch[1] + "%";
            else { let gage = document.querySelector('.graph_gage'); if (gage && gage.nextElementSibling && gage.nextElementSibling.innerText.includes('%')) { newVal = gage.nextElementSibling.innerText.trim().match(/(\d+(?:\.\d+)?)%/)[0]; } }
            if (newVal) { let oldVal = localStorage.getItem(`${_K.P}_${sub}`) || "0%"; if (parseFloat(newVal) > parseFloat(oldVal)) localStorage.setItem(`${_K.P}_${sub}`, newVal); }
        } else {
            try {
                const irWin = document.getElementById("contentViewer")?.contentWindow;
                const vt = document.querySelector(".item-title-lesson-on")?.innerText.trim() || "Video";
                if (irWin) {
                    if (!irWin._gm_shield) { irWin.alert = (m)=>{}; irWin.confirm = (m)=>{return true;}; irWin._gm_shield = true; }
                    irWin.document.querySelectorAll('.ui-dialog-buttonset button, .btn_confirm').forEach(p => { if (p.offsetParent) p.click(); });

                    const v = irWin.document.querySelector('video');
                    if (v) { 
                        v.muted = localStorage.getItem(_K.M) !== 'false'; 
                        if (v.paused && !v.ended) v.play().catch(()=>{});
                        if (!irWin._gm_has_seeked && v.readyState >= 1) {
                            let sk = JSON.parse(localStorage.getItem(_K.SK) || 'null');
                            if (sk && sk.t === vt && sk.s > 0) { v.currentTime = sk.s; _LD.log(`${curL.seek}: ${sk.raw} -> ${sk.s}s`); }
                            irWin._gm_has_seeked = true; localStorage.removeItem(_K.SK);
                        }
                        const ct = irWin.document.querySelector('.vjs-current-time-display')?.innerText.replace(/[^\d:]/g, '') || "00:00";
                        const dt = irWin.document.querySelector('.vjs-duration-display')?.innerText.replace(/[^\d:]/g, '') || "00:00";
                        _watching = { title: vt, percent: ((v.currentTime/v.duration)*100).toFixed(1)+"%", time: `${ct} / ${dt}` };

                        if (localStorage.getItem(_K.A) === 'true' && (v.ended || (v.duration > 0 && v.currentTime >= v.duration - 1))) {
                            _watching = null;
                            const nxt = document.querySelector("#continue_on");
                            if (nxt && window.getComputedStyle(nxt).display !== 'none') document.querySelector("#next_")?.click(); 
                            else document.querySelector("#close_")?.click(); 
                        }
                    } else { 
                        const checkTimeEl = document.querySelector("#checkTime");
                        let extTime = (checkTimeEl && checkTimeEl.innerText) ? `Remaining: ${checkTimeEl.innerText}s` : "Ext Player...";
                        _watching = { title: vt, percent: "Ext", time: extTime };

                        let ytFrame = irWin.document.querySelector('iframe[src*="youtube"]');
                        if (ytFrame) ytFrame.contentWindow.postMessage({ type: 'HELLOLMS_MUTE_SYNC', muted: localStorage.getItem(_K.M) !== 'false' }, '*');

                        if (localStorage.getItem(_K.A) === 'true') {
                            const nxtOn = document.querySelector("#continue_on");
                            const exitOn = document.querySelector("#exit_on");
                            if (nxtOn && window.getComputedStyle(nxtOn).display !== 'none') {
                                _watching = null; document.querySelector("#next_")?.click();
                            } else if (exitOn && window.getComputedStyle(exitOn).display !== 'none') {
                                _watching = null; document.querySelector("#close_")?.click();
                            }
                        }
                    }
                }
            } catch(e){}
        }

        if (window.location.href.includes('online_list')) {
            let storage = _LD.getList();
            document.querySelectorAll('.site-mouseover-color, .item-title-lesson').forEach(titleEl => {
                const title = titleEl.innerText.trim(); if (!title) return;
                const data = getPData(titleEl);
                const idx = storage.findIndex(x => x.title === title);
                
                let t_str = data.tm;
                if (data.p === '100%') {
                    let parts = data.tm.split('/');
                    if (parts.length >= 2) { let tot = parts[parts.length - 1].trim(); t_str = `${tot} / ${tot}`; } 
                    else { t_str = "Done"; }
                }
                const entry = { title, percent: data.p, time: t_str };

                if (idx === -1) { storage.push(entry); } else if (parseFloat(data.p) > parseFloat(storage[idx].percent)) { storage[idx] = entry; }
            });
            _LD.setList(storage);
        }

        if (localStorage.getItem(_K.A) === 'true') {
            const u = window.location.href;
            if (u.includes('submain_form')) {
                const ws = document.querySelectorAll('.ibox3.wb-on');
                for (let w of ws) { 
                    const statusText = w.querySelector('.wb-status')?.innerText || "";
                    if (statusText) { const parts = statusText.split('/'); if (parts.length === 2 && parseInt(parts[0]) < parseInt(parts[1])) { w.click(); return; } }
                }
            }
            if (u.includes('online_list')) {
                let clicked = false;
                document.querySelectorAll('.site-mouseover-color, .item-title-lesson').forEach(titleEl => {
                    if(clicked) return;
                    const data = getPData(titleEl);
                    if (parseInt(data.p) < 100 && !data.tm.includes('100%') && !data.tm.includes('Done')) { 
                        let watchedStr = data.tm.split('/')[0].trim(), watchedSec = timeToSeconds(watchedStr), seekSec = Math.max(0, watchedSec - 5); 
                        localStorage.setItem(_K.SK, JSON.stringify({ t: titleEl.innerText.trim(), s: seekSec, raw: watchedStr }));
                        _LD.log(`${curL.start}: ${titleEl.innerText.substring(0,10)}... (T:${watchedStr})`);
                        titleEl.click(); clicked = true; 
                    }
                });
                if(!clicked) { window.location.href = "/ilos/st/course/submain_form.acl"; }
            }
        }
    }

    // 🌟 【重头戏：强制前置拦截系统】 🌟
    function _checkMandatoryUpdate(callback) {
        GM_xmlhttpRequest({
            method: "GET", url: UPDATE_API_URL + "?t=" + new Date().getTime(), timeout: 4000,
            onload: function(res) {
                try {
                    const data = JSON.parse(res.responseText);
                    if (parseFloat(data.version) > CURRENT_VERSION) {
                        const curL = LANG_DB[_LD.getL()] || LANG_DB.cn;
                        const msg = curL.force_msg.replace('{1}', CURRENT_VERSION).replace('{2}', data.version);
                        const m = `<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);backdrop-filter:blur(15px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#fff;">
                            <div style="background:#1a1a1a;padding:40px;border-radius:20px;text-align:center;width:350px;border:2px solid #dc3545;box-shadow:0 0 60px rgba(220,53,69,0.4);">
                                <h2 style="color:#dc3545;margin-top:0;font-size:22px;">${curL.force_title}</h2>
                                <p style="font-size:14px;color:#ccc;line-height:1.6;margin:20px 0;">${msg}</p>
                                <button id="_force_upd_btn" style="width:100%;background:#dc3545;color:#fff;border:none;padding:15px;border-radius:10px;font-size:16px;font-weight:bold;cursor:pointer;transition:0.2s;">${curL.force_btn}</button>
                            </div>
                        </div>`;
                        document.body.insertAdjacentHTML('beforeend', m);
                        document.querySelector('#_force_upd_btn').onclick = () => GM_openInTab(data.url, { active: true });
                        // 不执行 callback，底层彻底锁死
                    } else {
                        callback(); 
                    }
                } catch(e) { callback(); } 
            },
            onerror: function() { callback(); }, 
            ontimeout: function() { callback(); } 
        });
    }

    async function _ath() {
        const l = localStorage.getItem(_K.X), curL = LANG_DB[_LD.getL()] || LANG_DB.cn;
        if (l && (Date.now() - l < 86400000)) { _run(); return; }
        const m = `<div id="_ath_m" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(15px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:monospace;pointer-events:auto;"><div style="background:#111;padding:45px;border-radius:20px;text-align:center;width:340px;border:1px solid #333;box-shadow:0 0 50px rgba(0,0,0,0.9);"><div id="_clk_v" style="color:#0f0;font-size:24px;font-weight:bold;margin-bottom:25px;letter-spacing:2px;">00:00:00</div><input type="text" id="_in_v" maxlength="6" style="width:100%;box-sizing:border-box;font-size:35px;text-align:center;letter-spacing:10px;padding:15px;background:#222;color:#0f0;border:2px solid #555;border-radius:12px;outline:none;" placeholder="------"><button id="_bt_v" style="width:100%;margin-top:30px;padding:18px;background:transparent;color:#0f0;border:2px solid #0f0;border-radius:12px;font-weight:bold;cursor:pointer;font-size:18px;transition:0.2s;">${curL.unlock}</button></div></div>`;
        document.body.insertAdjacentHTML('beforeend', m);
        const b = document.querySelector('#_bt_v'), i = document.querySelector('#_in_v'), clk = document.querySelector('#_clk_v'); i.focus();
        const clkInt = setInterval(() => { if(clk) clk.innerText = new Date().toLocaleTimeString(); }, 1000);
        const trigger = async () => { if (await _VC.v(i.value)) { localStorage.setItem(_K.X, Date.now()); document.querySelector('#_ath_m').remove(); clearInterval(clkInt); _run(); } else { alert(curL.err); i.value = ""; } };
        b.onclick = trigger; i.onkeydown = (e) => { if(e.key === 'Enter') trigger(); };
    }

    function _run() { 
        const win = getWin();
        if (typeof win._orig_confirm === 'undefined') { win._orig_confirm = win.confirm; win._orig_alert = win.alert; win._orig_prompt = win.prompt; }
        win.alert = (m) => {}; win.confirm = (m) => { return true; };
        _ui(); setInterval(_sync, 1000); setInterval(_loop, 1000); 
        setTimeout(_fireTelemetry, 3000);
    }
    
    // 🌟 拦截执行：先拦截更新，再弹出密码，最后加载主挂机引擎
    const _awake = setInterval(() => { 
        if (document.body) { 
            clearInterval(_awake); 
            _checkMandatoryUpdate(() => { _ath(); });
        } 
    }, 50);
})();
