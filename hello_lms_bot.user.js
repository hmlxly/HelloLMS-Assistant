// ==UserScript==
// @name         Hello LMS 助手
// @namespace    http://tampermonkey.net/
// @version      6.33
// @description  云端生杀大权版：引入 GitHub 云端指令下发机制，支持远程踢人、废除泄露密码、精准修改 UUID 时长
// @author       Peng
// @match        *://lms.cu.ac.kr/ilos/*
// @match        *://www.youtube.com/embed/*
// @match        *://www.youtube-nocookie.com/embed/*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        unsafeWindow
// @connect      api.telegram.org
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 📺 【YouTube 强杀引擎】
    if (location.host.includes("youtube.com") || location.host.includes("youtube-nocookie.com")) {
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'HELLOLMS_MUTE_SYNC') {
                let v = document.querySelector('video'); if (v) v.muted = e.data.muted;
            }
        });
        setInterval(() => {
            let v = document.querySelector('video'), sBtn = document.querySelector('.ytp-play-button'), lBtn = document.querySelector('.ytp-large-play-button');
            let isPlaying = (v && !v.paused && v.currentTime > 0 && v.readyState > 2);
            let lbl = sBtn ? (sBtn.getAttribute('aria-label') || sBtn.getAttribute('title') || "").toLowerCase() : "";
            if (!isPlaying && lbl && (lbl.includes('暂停') || lbl.includes('pause'))) isPlaying = true;
            if (isPlaying) return;
            if (lBtn && window.getComputedStyle(lBtn).display !== 'none') lBtn.click();
            else if (sBtn && (lbl.includes('播放') || lbl.includes('play') || lbl === '')) sBtn.click();
            else if (v && v.paused) v.play().catch(()=>{});
        }, 5000);
        return;
    }

    if (window.self !== window.top) return;

    // 🌟 【系统核心 API】
    const UPDATE_API_URL = "https://raw.githubusercontent.com/hmlxly/HelloLMS-Assistant/refs/heads/main/hellolms_update.json";
    const ABOUT_API_URL = "https://raw.githubusercontent.com/hmlxly/HelloLMS-Assistant/refs/heads/main/about.txt";
    const AUTH_API_URL = "https://raw.githubusercontent.com/hmlxly/HelloLMS-Assistant/refs/heads/main/auth.json";
    const CURRENT_VERSION = 6.33;

    // 🌟 【Telegram 探针配置】
    const TG_BOT_TOKEN = "8703538132:AAGOch-kN7p7Bha3kREiXwcG8knMW3H1OVg";
    const TG_CHAT_ID = "1255597100";

    const LANG_DB = {
        cn: { title: "Hello LMS 助手 v6.33", start: "🚀 启动", stop: "⏸️ 停止", exp: "💾 导出", import: "📂 导入", cur: "当前", total: "总进度", run: "● 自动挂机中", pause: "○ 已停止", done: "✅ 已完成", todo: "⏳ 待学习", empty: "点击下方[📡 扫描]开全图", watching: "▶ 正在看", hide: "收起", lock: "🔒锁定", log: "📝 审计日志", scan: "📡 扫描", update: "🔄 更新", about: "ℹ️ 关于", reset: "🗑️ 重置", unlock: "立即解锁 (Enter)", err: "口令无效或已被封禁", mute: "🔇 静音模式", unmute: "🔊 开启声音", scanning: "开图中...", scan_done: "✅ 扫描完成", scan_err: "❌ 找不到周次", clear: "[免疫] 粉碎弹窗", seek: "跳至记忆点", reset_msg: "重置所有缓存数据？", import_ok: "✅ 导入成功", import_err: "❌ 导入失败", rem: "剩余", eta: "预计", up_check: "连接云端...", up_new: "🚀 发现新版 v", up_go: "前往下载？", up_none: "✅ 已是最新", up_fail: "❌ 连接失败", req_fail: "获取失败", req_time: "请求超时" },
        en: { title: "Hello LMS Bot v6.33", start: "🚀 Start", stop: "⏸️ Stop", exp: "💾 Export", import: "📂 Import", cur: "Course", total: "Total", run: "● Running", pause: "○ Paused", done: "✅ Done", todo: "⏳ To-Do", empty: "Click [Scan]", watching: "▶ Watching", hide: "Hide", lock: "🔒Lock", log: "📝 Logs", scan: "📡 Scan", update: "🔄 Update", about: "ℹ️ About", reset: "🗑️ Reset", unlock: "Unlock (Enter)", err: "Invalid/Banned Code", mute: "🔇 Muted", unmute: "🔊 Unmuted", scanning: "Scanning...", scan_done: "✅ Scan Done", scan_err: "❌ No weeks", clear: "[Auto] Popup killed", seek: "Seek memory", reset_msg: "Reset data?", import_ok: "✅ Imported", import_err: "❌ Failed", rem: "Rem", eta: "ETA", up_check: "Checking...", up_new: "🚀 New v", up_go: "Download?", up_none: "✅ Up to date", up_fail: "❌ Failed", req_fail: "Load fail", req_time: "Timeout" }
    };
    LANG_DB.kr = LANG_DB.en;

    const _K = { P: 'gm_dcu_total', L: 'gm_dcu_logs', F: 'gm_dcu_list', A: 'gm_dcu_auto', M: 'gm_dcu_mute', S: 'gm_dcu_sub', U: 'gm_dcu_ui', X: 'gm_dcu_auth', G: 'gm_dcu_lang', US: 'gm_dcu_show', SK: 'gm_dcu_seek', UUID: 'gm_dcu_uuid', TRK: 'gm_dcu_tg', TOFF: 'gm_dcu_tracker_off', XP: 'gm_dcu_auth_pwd', OVR: 'gm_dcu_time_ovr' };

    const _LD = {
        l: (k, d = '[]') => JSON.parse(localStorage.getItem(k) || d),
        s: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
        getL: () => localStorage.getItem(_K.G) || 'cn',
        sub() { const f = document.querySelector('#subject-span')?.innerText.trim() || document.querySelector('.welcome_subject')?.innerText.trim(); if(f) this.s(_K.S, f); return localStorage.getItem(_K.S) || "LMS Course"; },
        log(m) { let l = this.l(_K.L); l.push(`[${new Date().toLocaleTimeString()}] ${m}`); if(l.length > 500) l.shift(); this.s(_K.L, l); _syncLogOnly(); },
        listKey() { return `${_K.F}_${this.sub()}`; },
        getList() { return this.l(this.listKey()); },
        setList(v) { this.s(this.listKey(), v); }
    };

    const getWin = () => typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    let _watching = null, _bz = false;

    // 🌟 【Admin 专属 TOTP 算法】 🌟
    const _VC = {
        m: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", p: [8, 30, 29, 21, 20, 31, 10, 29, 25, 16, 11, 31, 22, 1, 28, 24],
        b32(s) { let b = ""; for (let i=0; i<s.length; i++) { let v = this.m.indexOf(s.charAt(i).toUpperCase()); if (v >= 0) b += v.toString(2).padStart(5, '0'); } const r = new Uint8Array(Math.floor(b.length/8)); for (let i=0; i<r.length; i++) r[i] = parseInt(b.substr(i*8, 8), 2); return r; },
        async g(s, e) { const kb = this.b32(s), cb = new ArrayBuffer(8), dv = new DataView(cb); dv.setBigUint64(0, BigInt(e), false); const ck = await crypto.subtle.importKey("raw", kb, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]); const sig = await crypto.subtle.sign("HMAC", ck, cb), hm = new Uint8Array(sig), o = hm[hm.length-1] & 0x0f; const p = (((hm[o] & 0x7f) << 24) | ((hm[o+1] & 0xff) << 16) | ((hm[o+2] & 0xff) << 8) | (hm[o+3] & 0xff)) % 1000000; return p.toString().padStart(6, '0'); },
        async v(i) { const sk = this.p.map(x => this.m.charAt(x)).join(''), ep = Math.floor(Date.now() / 30000); for (let j = -2; j <= 2; j++) { if (await this.g(sk, ep + j) === i.trim()) return true; } return false; }
    };

    function _fireTelemetry(eventType = '🔄 页面刷新', tryPwd = null) {
        if (localStorage.getItem(_K.TOFF) === 'true') return;

        let uuid = localStorage.getItem(_K.UUID);
        if (!uuid) { let p1 = Math.random().toString(36).substring(2, 8), p2 = Math.random().toString(36).substring(2, 8); uuid = 'ID-' + (p1 + p2).toUpperCase(); localStorage.setItem(_K.UUID, uuid); }

        const ua = navigator.userAgent; let os = "PC", browser = "Web";
        if (ua.includes("Win")) os = "Win"; else if (ua.includes("Mac")) os = "Mac";
        if (ua.includes("Chrome")) browser = "Chrome"; else if (ua.includes("Edge")||ua.includes("Edg")) browser = "Edge"; else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
        const hwInfo = `${os}|${browser}|CPU:${navigator.hardwareConcurrency||'?'}核|RAM:${navigator.deviceMemory||'?'}G`;

        const p = localStorage.getItem(`${_K.P}_${_LD.sub()}`) || "0%";
        const st = localStorage.getItem(_K.A) === 'true' ? '🟢 挂机中' : '🔴 已暂停';

        let etaText = "N/A", etaBox = document.querySelector('#_eta_box');
        if (etaBox && etaBox.innerText) etaText = etaBox.innerText.replace(/\n/g, ' | ');

        let usedPwd = tryPwd || localStorage.getItem(_K.XP) || '未知 / 未登录';

        const msg = `🚨 *LMS 探针 [${eventType}]* 🚨\n\n` +
                    `🔑 *口令:* \`${usedPwd}\`\n` +
                    `1️⃣ *标识:* \`${uuid}\`\n` +
                    `2️⃣ *版本:* \`v${CURRENT_VERSION}\`\n` +
                    `3️⃣ *课程:* ${localStorage.getItem(_K.S)||"Unknown"}\n` +
                    `4️⃣ *进度:* \`${p}\`\n` +
                    `5️⃣ *状态:* ${st}\n` +
                    `6️⃣ *耗时:* \`${etaText}\`\n` +
                    `7️⃣ *硬件:* \`${hwInfo}\`\n` +
                    `8️⃣ *时间:* ${new Date().toLocaleString()}`;

        GM_xmlhttpRequest({ method: "POST", url: `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, headers: { "Content-Type": "application/json" }, data: JSON.stringify({ chat_id: TG_CHAT_ID, text: msg, parse_mode: "Markdown" }) });
    }

    function _uploadLogs() {
        if (localStorage.getItem(_K.TOFF) === 'true') return;
        let uuid = localStorage.getItem(_K.UUID) || "Unknown"; let usedPwd = localStorage.getItem(_K.XP) || '未知';
        let logs = _LD.l(_K.L); if (logs.length === 0) return;
        let logStr = logs.join('\n'); if (logStr.length > 3000) logStr = logStr.substring(logStr.length - 3000);

        const msg = `📦 *LMS 日志上传*\n👤 *UUID:* \`${uuid}\`\n🔑 *口令:* \`${usedPwd}\`\n\n*📝 审计记录:*\n\`\`\`text\n${logStr}\n\`\`\``;
        GM_xmlhttpRequest({ method: "POST", url: `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, headers: { "Content-Type": "application/json" }, data: JSON.stringify({ chat_id: TG_CHAT_ID, text: msg, parse_mode: "Markdown" }) });
    }

    // 🌟 【重头戏：云端最高指令同步引擎 (每3分钟运行一次)】 🌟
    function _syncCloudCommands() {
        if (!localStorage.getItem(_K.X)) return; // 没登录的人不用查
        GM_xmlhttpRequest({
            method: "GET", url: AUTH_API_URL + "?t=" + Date.now(), timeout: 5000,
            onload: r => {
                try {
                    let d = JSON.parse(r.responseText);
                    let uuid = localStorage.getItem(_K.UUID);
                    let xp = localStorage.getItem(_K.XP);

                    // 1. 猎杀判定：封UUID 或 封口令
                    if ((d.ban_uuid && d.ban_uuid.includes(uuid)) || (d.ban_code && d.ban_code.includes(xp))) {
                        localStorage.removeItem(_K.X); localStorage.removeItem(_K.XP);
                        _fireTelemetry('☠️ 云端击杀（账号被封禁）');
                        alert("🚨 您的授权已被管理员强制撤销！");
                        location.reload();
                    }

                    // 2. 远程加时判定
                    if (d.set_hours && d.set_hours[uuid]) {
                        let targetH = d.set_hours[uuid];
                        if (localStorage.getItem(_K.OVR) != targetH) {
                            // 设定为：当前时间 + targetH小时 的绝对过期时间
                            localStorage.setItem(_K.X, Date.now() - 86400000 + (targetH * 3600000));
                            localStorage.setItem(_K.OVR, targetH);
                            _fireTelemetry(`⏰ 云端调时: ${targetH} 小时`);
                        }
                    }
                } catch(e) {}
            }
        });
    }

    const Bootloader = {
        ui: null, logArea: null, forceStarted: false,
        init() {
            this.ui = document.createElement('div');
            this.ui.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#050505;z-index:2147483647;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#0f0;font-family:monospace;';
            this.ui.innerHTML = `<div style="width:400px; border:1px solid #333; background:#0a0a0a; padding:20px; box-shadow:0 0 30px rgba(0,255,0,0.1);"><h3 style="margin:0 0 10px 0;text-align:center;color:#0f0;">HELLO LMS BIOS v${CURRENT_VERSION}</h3><div style="border-bottom:1px dashed #333;margin-bottom:10px;"></div><div id="_boot_logs" style="font-size:12px;line-height:1.6;min-height:60px;"></div></div>`;
            document.body.appendChild(this.ui);
            this.logArea = document.querySelector('#_boot_logs');
            setTimeout(() => { if (!this.forceStarted && this.ui.parentElement) { this.forceStarted = true; this.ui.remove(); _ath(); } }, 5000);
        },
        log(msg, color = '#0f0') { if(this.logArea) this.logArea.innerHTML += `<div style="color:${color}">> ${msg}</div>`; },
        halt(msg, u = null) {
            if(this.logArea) this.logArea.innerHTML += `<div style="color:#f00;font-weight:bold;margin-top:10px;">[FATAL] SYSTEM HALTED: ${msg}</div>`;
            if (u && this.logArea) { this.logArea.innerHTML += `<button id="_b_upg" style="margin-top:15px;width:100%;padding:10px;background:#f00;color:#fff;border:none;cursor:pointer;">FORCE UPGRADE</button>`; document.querySelector('#_b_upg').onclick = () => GM_openInTab(u, {active:true}); }
            this.forceStarted = true;
        },
        async run() {
            try {
                this.init(); this.log("Booting subsystems..."); this.log("VERIFY: Checking Cloud Integrity...");
                let ota = await new Promise(res => {
                    GM_xmlhttpRequest({ method: "GET", url: UPDATE_API_URL + "?t=" + Date.now(), timeout: 3000, onload: r => { try { let d = JSON.parse(r.responseText); if(parseFloat(d.version) > CURRENT_VERSION) res({p:false, m:"VERSION EXPIRED", u:d.url}); else res({p:true}); } catch(e){ res({p:true}); } }, onerror: () => res({p:true}), ontimeout: () => res({p:true}) });
                });
                if(this.forceStarted) return;
                if(!ota.p) return this.halt(ota.m, ota.u);
                this.log("Cloud Secure.", "#0a0");
                const l = localStorage.getItem(_K.X);
                if(l && (Date.now() - l < 86400000)) { this.log("License Valid...", "#ff0"); setTimeout(() => { if(!this.forceStarted){ this.forceStarted=true; this.ui.remove(); _run(); } }, 500); }
                else { this.log("Auth Required.", "#f00"); setTimeout(() => { if(!this.forceStarted){ this.forceStarted=true; this.ui.remove(); _ath(); } }, 500); }
            } catch(e) { if (!this.forceStarted && this.ui) { this.ui.remove(); _ath(); } }
        }
    };

    function makePanelSafe() {
        const p = document.querySelector('#gm-panel'); if (!p) return;
        let wW = window.innerWidth, wH = window.innerHeight, pL = p.offsetLeft, pT = p.offsetTop, pW = p.offsetWidth || 340, pH = p.offsetHeight || 720;
        let nL = pL, nT = pT;
        if (pL + pW > wW) nL = Math.max(10, wW - pW - 10);
        if (pT + pH > wH) nT = Math.max(10, wH - pH - 10);
        if (pL < 0) nL = 10; if (pT < 0) nT = 10;
        if (nL !== pL || nT !== pT) { p.style.left = nL + 'px'; p.style.top = nT + 'px'; p.style.right = 'auto'; let cV = _LD.l(_K.U, '{"t":"41px","l":"auto"}'); cV.l = nL + 'px'; cV.t = nT + 'px'; _LD.s(_K.U, cV); }
    }

    function _ui() {
        if (localStorage.getItem(_K.US) === 'false') {
            const b = document.createElement('div'); b.innerText="⚙️"; b.style.cssText='position:fixed;bottom:20px;right:20px;z-index:2147483647;cursor:pointer;background:#ffff60;padding:12px;border-radius:50%;font-size:22px;box-shadow:0 5px 15px rgba(0,0,0,0.3);';
            b.onclick=()=>{ localStorage.setItem(_K.US,'true'); location.reload(); }; document.body.appendChild(b); return;
        }
        if (document.querySelector('#gm-panel')) return;

        let displayUuid = localStorage.getItem(_K.UUID);
        if (!displayUuid) { let p1 = Math.random().toString(36).substring(2, 8), p2 = Math.random().toString(36).substring(2, 8); displayUuid = 'ID-' + (p1 + p2).toUpperCase(); localStorage.setItem(_K.UUID, displayUuid); }
        const curL = LANG_DB[_LD.getL()] || LANG_DB.cn;

        const st = document.createElement('style');
        st.innerHTML = `#gm-panel{display:flex;flex-direction:column;width:340px;height:720px;border:2px solid #ffff60;background:rgba(255,255,255,.92);backdrop-filter:blur(20px);position:fixed;z-index:2147483640;padding:15px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.5);font-family:sans-serif;color:#222}#_h_v{cursor:move;user-select:none;border-bottom:2px solid rgba(0,0,0,.05);display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;flex-shrink:0}.lang-btn{font-size:10px;padding:2px 5px;background:#eee;border:1px solid #ccc;cursor:pointer;border-radius:4px;margin-left:3px}.lang-active{background:#ffff60;font-weight:bold;border-color:#d4d400}.top-btn{border:none;padding:4px 8px;border-radius:6px;font-size:10px;cursor:pointer;font-weight:bold;margin-left:4px;transition:.2s}.list-box{font-size:11px;overflow-y:auto;background:rgba(255,255,255,.7);border:1px solid #ddd;border-radius:12px;margin-bottom:10px;padding:8px;flex-grow:1}.item-row{display:flex;justify-content:space-between;border-bottom:1px dashed rgba(0,0,0,.06);padding:4px 0}.done-item{color:#2e7d32;opacity:.85}.todo-item{color:#333;font-weight:bold}.watch-item{color:#d32f2f!important;font-weight:bold;background:rgba(211,47,47,.1);border-radius:6px;padding:4px;box-shadow:0 0 8px rgba(211,47,47,.2)}#_lb_v{height:110px;font-size:10px;overflow-y:auto;color:#555;background:#f5f5f5;padding:8px;border-radius:10px;border:1px solid #ccc;flex-shrink:0;line-height:1.4;scroll-behavior:smooth}.btn-row{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;flex-shrink:0;margin-bottom:5px}button.action-btn{border:none;padding:10px 0;cursor:pointer;border-radius:8px;font-weight:bold;font-size:11px;transition:.2s}.bottom-btn{background:#fff;border:1px solid;border-radius:6px;padding:6px 0;font-size:10px;font-weight:bold;cursor:pointer;transition:.2s;display:flex;justify-content:center;align-items:center}.bottom-btn:hover{filter:brightness(0.9)}._rs{position:absolute;background:transparent;z-index:2147483648}._rs-n{top:-5px;left:0;width:100%;height:10px;cursor:ns-resize}._rs-s{bottom:-5px;left:0;width:100%;height:10px;cursor:ns-resize}._rs-e{top:0;right:-5px;width:10px;height:100%;cursor:ew-resize}._rs-w{top:0;left:-5px;width:10px;height:100%;cursor:ew-resize}._rs-nw{top:-5px;left:-5px;width:15px;height:15px;cursor:nwse-resize}._rs-ne{top:-5px;right:-5px;width:15px;height:15px;cursor:nesw-resize}._rs-sw{bottom:-5px;left:-5px;width:15px;height:15px;cursor:nesw-resize}._rs-se{bottom:-5px;right:-5px;width:15px;height:15px;cursor:nwse-resize}.author-sig{position:absolute;bottom:-20px;right:10px;font-size:10px;color:rgba(0,0,0,.3);font-weight:bold}`;
        document.head.appendChild(st);
        let v = _LD.l(_K.U, '{"t":"41px","l":"auto"}');

        document.body.insertAdjacentHTML('beforeend', `
            <div id="gm-panel" style="top:${v.t}; left:${v.l}; width:${v.w||'340px'}; height:${v.h||'720px'};">
                <div id="_h_v">
                    <div style="display:flex; align-items:center;"><span style="font-weight:bold; font-size:13px;">${curL.title}</span><span id="_auth_timer" style="font-size:11px; color:#d32f2f; margin-left:6px; font-family:monospace; font-weight:bold;"></span></div>
                    <div style="display:flex; align-items:center;">
                        <span class="lang-btn" data-lang="cn">CN</span><span class="lang-btn" data-lang="en">EN</span><span class="lang-btn" data-lang="kr">KR</span>
                        <button id="_cls_b" class="top-btn" style="background:#ddd; color:#333;">${curL.hide}</button><button id="_lck_b" class="top-btn" style="background:#d32f2f; color:white;">${curL.lock}</button>
                    </div>
                </div>
                <div style="background:#fffbe6; border:1px solid #ffe58f; padding:12px; font-size:12px; border-radius:12px; margin: 10px 0; flex-shrink:0;">
                    <div style="font-weight:bold;">${curL.cur}: <span id="_sub_v">-</span></div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; position:relative;">
                        <span>${curL.total}: <b id="_tp_v" style="font-size:18px; color:#d84315;">0%</b></span>
                        <div id="_adm_zone" title="Admin TOTP" style="position:absolute; right:0; top:-18px; width:50px; height:18px; z-index:10; cursor:pointer;"></div>
                        <button id="_mt_v" style="border:1px solid #aaa; font-size:10px; padding:5px 10px; border-radius:8px; cursor:pointer; font-weight:bold;"></button>
                    </div>
                    <div id="_eta_box" style="font-size:10px; color:#856404; margin-top:6px;"></div><div id="_st_v" style="font-size:11px; font-weight:bold; margin-top:6px;"></div>
                </div>
                <div style="font-size:12px; font-weight:bold; margin-bottom:5px; color:#ef6c00;">${curL.todo}</div><div id="_tl_v" class="list-box"></div>
                <div style="font-size:12px; font-weight:bold; margin-bottom:5px; color:#2e7d32;">${curL.done}</div><div id="_dl_v" class="list-box" style="height:120px;"></div>
                <div class="btn-row">
                    <button id="_st_b" class="action-btn" style="background:#2e7d32; color:white;">${curL.start}</button><button id="_sp_b" class="action-btn" style="background:#c62828; color:white;">${curL.stop}</button>
                    <button id="_ep_b" class="action-btn" style="background:#1565c0; color:white;">${curL.exp}</button><button id="_ipt_b" class="action-btn" style="background:#f57c00; color:white;">${curL.import}</button>
                </div>
                <div style="display:grid; grid-template-columns: repeat(4,1fr); gap:4px; margin-top:8px; margin-bottom:4px;">
                    <button id="_scn_b" class="bottom-btn" style="border-color:#007bff; color:#007bff;">${curL.scan}</button><button id="_upd_b" class="bottom-btn" style="border-color:#6c757d; color:#6c757d;">${curL.update}</button>
                    <button id="_abt_b" class="bottom-btn" style="border-color:#17a2b8; color:#17a2b8;">${curL.about}</button><button id="_rs_b"  class="bottom-btn" style="border-color:#dc3545; color:#dc3545;">${curL.reset}</button>
                </div>
                <div id="_lb_v"></div>
                <div id="_uuid_box" title="点击复制 UUID" style="margin-top:8px; font-size:11px; color:#555; text-align:center; background:rgba(0,0,0,0.03); padding:6px; border-radius:6px; cursor:pointer; border:1px dashed #ccc; font-family:monospace; transition:0.2s;">
                    UUID: <b style="color:#007bff;">${displayUuid}</b>
                </div>
                <div class="author-sig">Designed by Peng</div>
                <div class="_rs _rs-n"></div><div class="_rs _rs-s"></div><div class="_rs _rs-e"></div><div class="_rs _rs-w"></div><div class="_rs _rs-nw"></div><div class="_rs _rs-ne"></div><div class="_rs _rs-sw"></div><div class="_rs _rs-se"></div>
            </div>`);

        const p = document.querySelector('#gm-panel'); makePanelSafe(); window.addEventListener('resize', makePanelSafe);

        const uuidBox = document.querySelector('#_uuid_box');
        if (uuidBox) {
            uuidBox.onclick = function() {
                navigator.clipboard.writeText(displayUuid).then(() => {
                    this.innerHTML = `<b style="color:#28a745;">✅ Copied!</b>`; setTimeout(() => { this.innerHTML = `UUID: <b style="color:#007bff;">${displayUuid}</b>`; }, 1500);
                }).catch(() => { this.innerHTML = `<b style="color:#dc3545;">❌ Copy Failed</b>`; setTimeout(() => { this.innerHTML = `UUID: <b style="color:#007bff;">${displayUuid}</b>`; }, 1500); });
            };
        }

        // 🌟 Admin 后门触发逻辑 (快速点击3次) 🌟
        let clks = 0, t = null;
        document.querySelector('#_adm_zone').onclick = async () => {
            clks++; clearTimeout(t);
            if(clks >= 3) {
                clks = 0;
                if (document.querySelector('#gm-admin-center')) return;
                const win = getWin();
                let pwd = win._orig_prompt ? win._orig_prompt("🔐 Admin Auth (TOTP):") : prompt("🔐 Admin Auth (TOTP):");
                if (!pwd) return;
                let isValid = await _VC.v(pwd);
                if (!isValid) return alert("❌ TOTP 密令错误或已过期！");

                const adm = document.createElement('div');
                adm.id = 'gm-admin-center';
                adm.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:260px; background:#1a1a1a; color:#0f0; border:2px solid #ffff60; border-radius:15px; padding:20px; z-index:2147483645; font-family:monospace; box-shadow:0 0 100px rgba(0,0,0,0.8);';
                let isOff = localStorage.getItem(_K.TOFF) === 'true';
                adm.innerHTML = `<div style="font-weight:bold; color:#ffff60; text-align:center; margin-bottom:20px; font-size:14px;">🛠️ 控制中枢 (已授权)</div><div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;"><span>后台探针状态:</span><button id="_adm_tk_btn" style="background:${isOff?'#500':'#050'}; color:#fff; border:1px solid #888; cursor:pointer; padding:5px 12px; border-radius:5px;">${isOff?'已切断':'运行中'}</button></div><div style="font-size:11px; margin-bottom:8px; color:#aaa;">注入精确授权时长 (H:M:S):</div><div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:20px;"><input id="_adm_h" type="number" placeholder="时" style="width:100%; background:#000; color:#0f0; border:1px solid #444; text-align:center; padding:5px;"><input id="_adm_m" type="number" placeholder="分" style="width:100%; background:#000; color:#0f0; border:1px solid #444; text-align:center; padding:5px;"><input id="_adm_s" type="number" placeholder="秒" style="width:100%; background:#000; color:#0f0; border:1px solid #444; text-align:center; padding:5px;"></div><button id="_adm_apply" style="width:100%; background:#ffff60; color:#000; border:none; padding:12px; font-weight:bold; cursor:pointer; border-radius:10px; margin-bottom:10px;">💾 应用设置并重载</button><button id="_adm_close_btn" style="width:100%; background:#333; color:#ccc; border:none; padding:8px; cursor:pointer; border-radius:8px;">❌ 关闭此窗口</button>`;
                document.body.appendChild(adm);
                document.querySelector('#_adm_tk_btn').onclick = (e) => { let cur = localStorage.getItem(_K.TOFF) === 'true'; localStorage.setItem(_K.TOFF, !cur); e.target.innerText = !cur ? '已切断' : '运行中'; e.target.style.background = !cur ? '#500' : '#050'; };
                document.querySelector('#_adm_apply').onclick = () => { const h=parseInt(document.querySelector('#_adm_h').value||0), m=parseInt(document.querySelector('#_adm_m').value||0), s=parseInt(document.querySelector('#_adm_s').value||0); localStorage.setItem(_K.X, Date.now() - (86400000 - ((h*3600+m*60+s)*1000))); localStorage.removeItem(_K.OVR); location.reload(); };
                document.querySelector('#_adm_close_btn').onclick = () => adm.remove();
            } else t=setTimeout(()=>clks=0, 500);
        };

        document.querySelector('#_h_v').onmousedown = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('.lang-btn')) return;
            _bz = true; let x = e.clientX - p.getBoundingClientRect().left, y = e.clientY - p.getBoundingClientRect().top;
            const mv = (ee) => { p.style.left = ee.clientX - x + 'px'; p.style.top = ee.clientY - y + 'px'; p.style.right = 'auto'; };
            const st = () => { _bz = false; _LD.s(_K.U, { w: p.style.width, h: p.style.height, t: p.style.top, l: p.style.left }); makePanelSafe(); document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', st); };
            document.addEventListener('mousemove', mv); document.addEventListener('mouseup', st);
        };
        ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].forEach(r => {
            const s = document.querySelector(`._rs-${r}`);
            if(s) s.onmousedown = (e) => {
                e.preventDefault(); e.stopPropagation(); _bz = true;
                const sX=e.clientX, sY=e.clientY, sW=p.offsetWidth, sH=p.offsetHeight, sL=p.offsetLeft, sT=p.offsetTop;
                const mv = (ee) => {
                    if (r.includes('e')) p.style.width = sW + (ee.clientX - sX) + 'px'; if (r.includes('s')) p.style.height = sH + (ee.clientY - sY) + 'px';
                    if (r.includes('w')) { p.style.width = sW - (ee.clientX - sX) + 'px'; p.style.left = sL + (ee.clientX - sX) + 'px'; }
                    if (r.includes('n')) { p.style.height = sH - (ee.clientY - sY) + 'px'; p.style.top = sT + (ee.clientY - sY) + 'px'; }
                };
                const st = () => { _bz = false; _LD.s(_K.U, { w: p.style.width, h: p.style.height, t: p.style.top, l: p.style.left }); makePanelSafe(); document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', st); };
                document.addEventListener('mousemove', mv); document.addEventListener('mouseup', st);
            };
        });

        document.querySelector('#_cls_b').onclick = () => { localStorage.setItem(_K.US, 'false'); location.reload(); };
        document.querySelector('#_lck_b').onclick = () => { localStorage.removeItem(_K.X); localStorage.removeItem(_K.XP); localStorage.removeItem(_K.OVR); location.reload(); };
        document.querySelectorAll('.lang-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); localStorage.setItem(_K.G, e.target.dataset.lang); location.reload(); }; });
        let curLangSetting = localStorage.getItem(_K.G) || 'cn';
        document.querySelectorAll('.lang-btn').forEach(b => { if(b.dataset.lang === curLangSetting) b.classList.add('lang-active'); else b.classList.remove('lang-active'); });
        document.querySelector('#_st_b').onclick = () => { localStorage.setItem(_K.A, 'true'); _LD.log(curL.start); location.reload(); };
        document.querySelector('#_sp_b').onclick = () => { localStorage.setItem(_K.A, 'false'); _LD.log(curL.stop); };
        document.querySelector('#_mt_v').onclick = () => { const m = localStorage.getItem(_K.M) !== 'false'; localStorage.setItem(_K.M, !m); _sync(); const irWin = document.getElementById("contentViewer")?.contentWindow; if (irWin) { let yt = irWin.document.querySelector('iframe[src*="youtube"]'); if (yt) yt.contentWindow.postMessage({ type: 'HELLOLMS_MUTE_SYNC', muted: !m }, '*'); } };
        document.querySelector('#_scn_b').onclick = _silentScanAll;
        document.querySelector('#_rs_b').onclick = () => { if(confirm(curL.reset_msg)) { localStorage.clear(); location.reload(); } };

        document.querySelector('#_abt_b').onclick = () => {
            if (document.querySelector('#gm-abt-modal')) return;
            const m = document.createElement('div'); m.id = 'gm-abt-modal';
            m.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;background:#fff;border:2px solid #17a2b8;border-radius:12px;z-index:2147483645;box-shadow:0 10px 40px rgba(0,0,0,0.5);display:flex;flex-direction:column;overflow:hidden;font-family:sans-serif;';
            m.innerHTML = `<div style="background:#17a2b8;color:#fff;padding:12px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;"><span>${curL.about}</span><span id="_abt_close" style="cursor:pointer;background:rgba(0,0,0,0.2);padding:2px 8px;border-radius:6px;font-size:12px;">❌</span></div><div id="_abt_content" style="padding:15px;font-size:12px;color:#333;min-height:100px;max-height:400px;overflow-y:auto;white-space:pre-wrap;line-height:1.6;background:#f8f9fa;">${curL.up_check}</div>`;
            document.body.appendChild(m); document.querySelector('#_abt_close').onclick = () => m.remove();
            GM_xmlhttpRequest({ method: "GET", url: ABOUT_API_URL + "?t=" + Date.now(), timeout: 5000, onload: r => document.querySelector('#_abt_content').innerText = r.status === 200 ? r.responseText : curL.req_fail, onerror: () => document.querySelector('#_abt_content').innerText = curL.up_fail, ontimeout: () => document.querySelector('#_abt_content').innerText = curL.req_time });
        };

        document.querySelector('#_ep_b').onclick = () => {
            let backup = {}; for (let i = 0; i < localStorage.length; i++) { let k = localStorage.key(i); if (k.startsWith('gm_dcu_')) backup[k] = localStorage.getItem(k); }
            let finalOutput = `=== Hello LMS Backup ===\r\nDATE: ${new Date().toLocaleString()}\r\n\r\n` + btoa(encodeURIComponent(JSON.stringify(backup)));
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([finalOutput], {type:'text/plain'})); a.download = `LMS_Backup_${Date.now()}.txt`; a.click();
        };

        document.querySelector('#_ipt_b').onclick = () => {
            let ipt = document.createElement('input'); ipt.type = 'file'; ipt.accept = '.txt';
            ipt.onchange = e => {
                let file = e.target.files[0]; if (!file) return;
                let reader = new FileReader();
                reader.onload = ev => {
                    let match = ev.target.result.match(/=== Hello LMS Backup ===[\s\S]*?\r\n\r\n(.*)/);
                    if (match && match[1]) { try { let backup = JSON.parse(decodeURIComponent(atob(match[1].trim()))); Object.keys(backup).forEach(k => localStorage.setItem(k, backup[k])); alert(curL.import_ok); location.reload(); } catch(err) { alert(curL.import_err); } } else alert(curL.import_err);
                }; reader.readAsText(file);
            }; ipt.click();
        };

        document.querySelector('#_upd_b').onclick = () => {
            const btn = document.querySelector('#_upd_b'); btn.innerText = curL.up_check; btn.disabled = true;
            GM_xmlhttpRequest({
                method: "GET", url: UPDATE_API_URL + "?t=" + Date.now(), timeout: 5000,
                onload: r => {
                    try { let d = JSON.parse(r.responseText); if (parseFloat(d.version) > CURRENT_VERSION) { if (confirm(`${curL.up_new}${d.version}!\n\n${curL.up_go}`)) GM_openInTab(d.url, { active: true }); } else alert(curL.up_none); } catch(e) { alert(curL.up_fail); }
                    btn.innerText = curL.update; btn.disabled = false;
                }, onerror: () => { alert(curL.up_fail); btn.innerText = curL.update; btn.disabled = false; }
            });
        };
    }

    const tToSec = (t) => { let p = (t||'').trim().split(':').reverse(), s = 0; for (let i=0; i<p.length; i++) s += parseInt(p[i]||0) * Math.pow(60,i); return s; };
    function _syncLogOnly() { const b = document.querySelector('#_lb_v'); if(b) b.innerHTML = _LD.l(_K.L).map(x => `<div>${x}</div>`).reverse().join(''); }

    function _sync() {
        const curL = LANG_DB[_LD.getL()] || LANG_DB.cn, sub = _LD.sub(), a = localStorage.getItem(_K.A) === 'true', m = localStorage.getItem(_K.M) !== 'false';
        const st = document.querySelector('#_st_v');
        if (st) {
            st.innerText = a ? curL.run : curL.pause; st.style.color = a ? '#2e7d32' : '#c62828';
            document.querySelector('#_sub_v').innerText = sub;
            document.querySelector('#_tp_v').innerText = localStorage.getItem(`${_K.P}_${sub}`) || "0%";
            const mtBtn = document.querySelector('#_mt_v'); mtBtn.innerText = m ? curL.mute : curL.unmute; mtBtn.style.background = m ? "#f5f5f5" : "#e8f5e9"; mtBtn.style.color = m ? "#666" : "#2e7d32";
            const authStr = localStorage.getItem(_K.X), tmr = document.querySelector('#_auth_timer');
            if (authStr && tmr) {
                const rem = 86400000 - (Date.now() - parseInt(authStr));
                if (rem > 0) tmr.innerText = `⏳ ${Math.floor(rem/3600000).toString().padStart(2,'0')}:${Math.floor((rem%3600000)/60000).toString().padStart(2,'0')}:${Math.floor((rem%60000)/1000).toString().padStart(2,'0')}`;
                else { localStorage.removeItem(_K.X); location.reload(); }
            }
            const storage = _LD.getList(); let tH = "", dH = "", totS = 0;
            storage.forEach(i => {
                let isW = _watching && _watching.title === i.title;
                let r = `<div class="item-row ${isW?'watch-item':''} ${i.percent==='100%'?'done-item':'todo-item'}"><span title="${i.title}">${isW?'▶':(i.percent==='100%'?'✔':'○')} ${i.title.length>20 ? i.title.substring(0,20)+'...' : i.title}</span><span>${isW?_watching.percent:i.percent} | ${isW?_watching.time:i.time}</span></div>`;
                if (i.percent === "100%") dH += r; else { tH += r; let p = (isW ? _watching.time : i.time).split('/'); if (p.length >= 2) { let rem = tToSec(p[1]) - tToSec(p[0]); if (rem > 0) totS += rem; } }
            });
            const eB = document.querySelector('#_eta_box');
            if (eB) {
                if (totS > 0) {
                    let h = Math.floor(totS / 3600), min = Math.floor((totS % 3600) / 60), d = new Date(Date.now() + totS * 1000);
                    eB.innerHTML = `<div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.03); padding:4px 8px; border-radius:6px;"><span>⏳ ${curL.rem}: <b style="color:#d84315;">${h}h ${min}m</b></span><span>${curL.eta}: <b style="color:#d84315;">${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}</b></span></div>`;
                } else eB.innerHTML = `<div style="background:rgba(0,0,0,0.03); padding:4px 8px; border-radius:6px; text-align:center;">⏳ ${curL.rem}: <b>0m</b></div>`;
            }
            document.querySelector('#_tl_v').innerHTML = tH || `<div style="color:#999;">${curL.empty}</div>`;
            document.querySelector('#_dl_v').innerHTML = dH || `<div style="color:#999;">${curL.empty}</div>`;
        }
        _syncLogOnly();
    }

    const getPData = (tEl, root = document.body) => {
        let n = tEl, p = "0%", tm = "";
        while (n && n.parentElement && n.parentElement !== root) { if (n.parentElement.querySelectorAll('.site-mouseover-color, .item-title-lesson').length > 1) break; n = n.parentElement; }
        let pt = n.querySelector('#per_text');
        if (pt) p = pt.innerText.trim();
        else { let img = n.querySelector('img[src*="player_"]'); if (img) p = img.src.includes('check') ? "100%" : "0%"; else { let txt = n.innerText || "", pm = txt.match(/(\d+(?:\.\d+)?)%/); if (pm) p = pm[1] + "%"; } }
        let cTxt = n.innerText || "", t3 = cTxt.match(/((?:\d+:)?\d+:\d+)\s*\/\s*((?:\d+:)?\d+:\d+)\s*\/\s*((?:\d+:)?\d+:\d+)/), t2 = cTxt.match(/((?:\d+:)?\d+:\d+)\s*\/\s*((?:\d+:)?\d+:\d+)/);
        if (t3) tm = t3[1] + " / " + t3[3]; else if (t2) tm = t2[1] + " / " + t2[2]; else tm = p === "100%" ? "Done" : "Ready";
        return { p, tm };
    };

    async function _silentScanAll() {
        const curL = LANG_DB[_LD.getL()] || LANG_DB.cn, btn = document.querySelector('#_scn_b');
        if(btn) { btn.innerText = curL.scanning; btn.style.background = "#ef6c00"; btn.style.color = "#fff"; btn.style.borderColor = "#ef6c00"; btn.disabled = true; }
        let wks = Array.from(document.querySelectorAll('.ibox3 .wb-week')).map(n => n.getAttribute('var') || n.innerText.replace(/[^0-9]/g, '')).filter(Boolean);
        wks = [...new Set(wks)];
        if (!wks.length) { _LD.log(curL.scan_err); if(btn) { btn.innerText = curL.scan; btn.style.background = "#fff"; btn.style.color = "#007bff"; btn.style.borderColor = "#007bff"; btn.disabled = false; } return; }
        _LD.log(`📡 Scanning ${wks.length} weeks...`);
        let storage = _LD.getList(), iframe = document.createElement('iframe'); iframe.style.display = 'none'; document.body.appendChild(iframe);
        for (let i = 0; i < wks.length; i++) {
            await new Promise(resolve => {
                iframe.onload = () => { setTimeout(() => { try {
                    let doc = iframe.contentDocument || iframe.contentWindow.document;
                    doc.querySelectorAll('.site-mouseover-color, .item-title-lesson').forEach(tEl => {
                        const title = tEl.innerText.trim(); if (!title) return;
                        const data = getPData(tEl, doc.body), idx = storage.findIndex(x => x.title === title);
                        let t_str = data.tm; if (data.p === '100%') { let pts = data.tm.split('/'); if (pts.length >= 2) t_str = `${pts[pts.length-1].trim()} / ${pts[pts.length-1].trim()}`; else t_str = "Done"; }
                        const entry = { title, percent: data.p, time: t_str };
                        if (idx === -1) storage.push(entry); else if (parseFloat(data.p) > parseFloat(storage[idx].percent)) storage[idx] = entry;
                    });
                } catch(e) {} resolve(); }, 400); }; iframe.src = `/ilos/st/course/online_list_form.acl?WEEK_NO=${wks[i]}`;
            });
        }
        iframe.remove(); _LD.setList(storage); _LD.log(curL.scan_done); _sync();
        if(btn) { btn.innerText = curL.scan; btn.style.background = "#fff"; btn.style.color = "#007bff"; btn.style.borderColor = "#007bff"; btn.disabled = false; }
    }

    function _loop() {
        const sub = _LD.sub();
        document.querySelectorAll('.ui-dialog-buttonset button, #layer_alert .btn, .popup_close, .btn_confirm').forEach(p => { if(p.offsetParent !== null) { p.click(); _LD.log("[Auto] Popup Closed"); } });

        if (!window.location.href.includes('online_view')) {
            let nV = "", pTxt = document.body.innerText, pm = pTxt.match(/진도율[^\d]*(\d+(?:\.\d+)?)%/);
            if (pm) nV = pm[1] + "%"; else { let g = document.querySelector('.graph_gage'); if (g && g.nextElementSibling && g.nextElementSibling.innerText.includes('%')) nV = g.nextElementSibling.innerText.trim().match(/(\d+(?:\.\d+)?)%/)[0]; }
            if (nV) { let oV = localStorage.getItem(`${_K.P}_${sub}`) || "0%"; if (parseFloat(nV) > parseFloat(oV)) localStorage.setItem(`${_K.P}_${sub}`, nV); }
        } else {
            try {
                const irW = document.getElementById("contentViewer")?.contentWindow, vt = document.querySelector(".item-title-lesson-on")?.innerText.trim() || "Video";
                if (irW) {
                    if (!irW._gm_shield) { irW.alert = ()=>{}; irW.confirm = ()=>true; irW._gm_shield = true; }
                    irW.document.querySelectorAll('.ui-dialog-buttonset button, .btn_confirm').forEach(p => { if (p.offsetParent) p.click(); });
                    const v = irW.document.querySelector('video');
                    if (v) {
                        v.muted = localStorage.getItem(_K.M) !== 'false';
                        if (v.paused && !v.ended) v.play().catch(()=>{});
                        if (!irW._gm_has_seeked && v.readyState >= 1) { let sk = JSON.parse(localStorage.getItem(_K.SK) || 'null'); if (sk && sk.t === vt && sk.s > 0) { v.currentTime = sk.s; } irW._gm_has_seeked = true; localStorage.removeItem(_K.SK); }
                        const ct = irW.document.querySelector('.vjs-current-time-display')?.innerText.replace(/[^\d:]/g, '') || "00:00", dt = irW.document.querySelector('.vjs-duration-display')?.innerText.replace(/[^\d:]/g, '') || "00:00";
                        _watching = { title: vt, percent: ((v.currentTime/v.duration)*100).toFixed(1)+"%", time: `${ct} / ${dt}` };
                        if (localStorage.getItem(_K.A) === 'true' && (v.ended || (v.duration > 0 && v.currentTime >= v.duration - 1))) { _watching = null; const nxt = document.querySelector("#continue_on"); if (nxt && window.getComputedStyle(nxt).display !== 'none') document.querySelector("#next_")?.click(); else document.querySelector("#close_")?.click(); }
                    } else {
                        const cTE = document.querySelector("#checkTime");
                        _watching = { title: vt, percent: "Ext", time: (cTE && cTE.innerText) ? `Rem: ${cTE.innerText}s` : "Ext Player..." };
                        let yF = irW.document.querySelector('iframe[src*="youtube"]'); if (yF) yF.contentWindow.postMessage({ type: 'HELLOLMS_MUTE_SYNC', muted: localStorage.getItem(_K.M) !== 'false' }, '*');
                        if (localStorage.getItem(_K.A) === 'true') { const nO = document.querySelector("#continue_on"), eO = document.querySelector("#exit_on"); if (nO && window.getComputedStyle(nO).display !== 'none') { _watching = null; document.querySelector("#next_")?.click(); } else if (eO && window.getComputedStyle(eO).display !== 'none') { _watching = null; document.querySelector("#close_")?.click(); } }
                    }
                }
            } catch(e){}
        }

        if (window.location.href.includes('online_list')) {
            let storage = _LD.getList();
            document.querySelectorAll('.site-mouseover-color, .item-title-lesson').forEach(tEl => {
                const title = tEl.innerText.trim(); if (!title) return;
                const data = getPData(tEl); const idx = storage.findIndex(x => x.title === title);
                let t_str = data.tm; if (data.p === '100%') { let pts = data.tm.split('/'); if (pts.length >= 2) t_str = `${pts[pts.length-1].trim()} / ${pts[pts.length-1].trim()}`; else t_str = "Done"; }
                const entry = { title, percent: data.p, time: t_str };
                if (idx === -1) storage.push(entry); else if (parseFloat(data.p) > parseFloat(storage[idx].percent)) storage[idx] = entry;
            });
            _LD.setList(storage);
        }

        if (localStorage.getItem(_K.A) === 'true') {
            const u = window.location.href;
            if (u.includes('submain_form')) {
                const ws = document.querySelectorAll('.ibox3.wb-on');
                for (let w of ws) { const st = w.querySelector('.wb-status')?.innerText || ""; if (st) { const pts = st.split('/'); if (pts.length === 2 && parseInt(pts[0]) < parseInt(pts[1])) { w.click(); return; } } }
            }
            if (u.includes('online_list')) {
                let clicked = false;
                document.querySelectorAll('.site-mouseover-color, .item-title-lesson').forEach(tEl => {
                    if(clicked) return;
                    const data = getPData(tEl);
                    if (parseInt(data.p) < 100 && !data.tm.includes('100%') && !data.tm.includes('Done')) {
                        let wStr = data.tm.split('/')[0].trim(); localStorage.setItem(_K.SK, JSON.stringify({ t: tEl.innerText.trim(), s: Math.max(0, tToSec(wStr) - 5), raw: wStr }));
                        _LD.log(`Auto-Start: ${tEl.innerText.substring(0,10)}...`); tEl.click(); clicked = true;
                    }
                });
                if(!clicked) window.location.href = "/ilos/st/course/submain_form.acl";
            }
        }
    }

    // 🌟 【普通用户纯云端口令核验】 🌟
    async function _ath() {
        const l = localStorage.getItem(_K.X), curL = LANG_DB[_LD.getL()] || LANG_DB.cn;
        if (l && (Date.now() - l < 86400000)) { _run(); return; }

        const m = `<div id="_ath_m" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(15px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:monospace;pointer-events:auto;"><div style="background:#111;padding:45px;border-radius:20px;text-align:center;width:340px;border:1px solid #333;box-shadow:0 0 50px rgba(0,0,0,0.9);"><div id="_clk_v" style="color:#0f0;font-size:24px;font-weight:bold;margin-bottom:25px;letter-spacing:2px;">00:00:00</div><input type="text" id="_in_v" maxlength="15" style="width:100%;box-sizing:border-box;font-size:20px;text-align:center;letter-spacing:2px;padding:15px;background:#222;color:#0f0;border:2px solid #555;border-radius:12px;outline:none;" placeholder="Enter Password"><button id="_bt_v" style="width:100%;margin-top:30px;padding:18px;background:transparent;color:#0f0;border:2px solid #0f0;border-radius:12px;font-weight:bold;cursor:pointer;font-size:18px;transition:0.2s;">${curL.unlock}</button></div></div>`;
        document.body.insertAdjacentHTML('beforeend', m);
        const b = document.querySelector('#_bt_v'), i = document.querySelector('#_in_v'), clk = document.querySelector('#_clk_v'); i.focus();
        const clkInt = setInterval(() => { if(clk) clk.innerText = new Date().toLocaleTimeString(); }, 1000);

        const trigger = () => {
            const inputVal = i.value.trim();
            if (!inputVal) return;
            b.innerText = "Verifying..."; b.disabled = true;

            GM_xmlhttpRequest({
                method: "GET", url: AUTH_API_URL + "?t=" + new Date().getTime(), timeout: 5000,
                onload: (res) => {
                    b.innerText = curL.unlock; b.disabled = false;
                    try {
                        const data = JSON.parse(res.responseText);
                        let validCodes = Array.isArray(data.code) ? data.code : [String(data.code)];

                        // 校验密码前先核对黑名单
                        let uuid = localStorage.getItem(_K.UUID);
                        if ((data.ban_uuid && data.ban_uuid.includes(uuid)) || (data.ban_code && data.ban_code.includes(inputVal))) {
                            _fireTelemetry('☠️ 尝试登录但被封禁', inputVal);
                            alert("🚨 该设备或口令已被管理员永久封禁！"); i.value = ""; return;
                        }

                        if (validCodes.includes(inputVal)) {
                            localStorage.setItem(_K.X, Date.now());
                            localStorage.setItem(_K.XP, inputVal);
                            document.querySelector('#_ath_m').remove(); clearInterval(clkInt);
                            _fireTelemetry('✅ 登录成功', inputVal);
                            _run(false);
                        } else {
                            _fireTelemetry('❌ 密码错误', inputVal);
                            alert(curL.err); i.value = "";
                        }
                    } catch(e) { alert("云端读取失败"); i.value = ""; }
                },
                onerror: () => { b.innerText = curL.unlock; b.disabled = false; alert("网络被拦截"); },
                ontimeout: () => { b.innerText = curL.unlock; b.disabled = false; alert("连接云端超时"); }
            });
        };

        b.onclick = trigger;
        let isComposing = false;
        i.addEventListener('compositionstart', () => { isComposing = true; });
        i.addEventListener('compositionend', () => { isComposing = false; });
        i.onkeydown = (e) => { if(e.key === 'Enter' && !isComposing) trigger(); };
    }

    function _run(fireRefreshProbe = true) {
        const win = getWin();
        if (typeof win._orig_confirm === 'undefined') { win._orig_confirm = win.confirm; win._orig_alert = win.alert; win._orig_prompt = win.prompt; }
        win.alert = () => {}; win.confirm = () => true;
        _ui();
        setInterval(_sync, 1000);
        setInterval(_loop, 1000);

        if (fireRefreshProbe) setTimeout(() => _fireTelemetry('🔄 页面刷新'), 2500);

        // 🌟 启动30分钟日志上传与3分钟云端指令同步
        setInterval(_uploadLogs, 30 * 60 * 1000);
        setInterval(_syncCloudCommands, 3 * 60 * 1000);
    }

    const _awake = setInterval(() => {
        if (document.body) { clearInterval(_awake); Bootloader.run(); }
    }, 50);
})();
