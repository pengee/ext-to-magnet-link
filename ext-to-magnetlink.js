// ==UserScript==
// @name         ext.to Direct Magnet Link
// @namespace    EXTTO
// @version      1.6
// @description  Replace magnet buttons with direct links on ext.to
// @match        https://ext.to/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    var iv = setInterval(function() {
        if (!CryptoJS || !window.pageToken || !window.csrfToken) return;

        clearInterval(iv);

        var buttons = document.querySelectorAll('.download-btn-magnet');
        if (!buttons.length) return;

        buttons.forEach(function(btn) {
            var tid = btn.getAttribute('data-id');
            var ts = Math.floor(Date.now() / 1000);
            var hmac = CryptoJS.SHA256(tid + '|' + ts + '|' + window.pageToken).toString();

            fetch('/ajax/getTorrentMagnet.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: new URLSearchParams({
                    torrent_id: tid,
                    action: 'get_magnet',
                    timestamp: ts,
                    hmac: hmac,
                    sessid: window.csrfToken
                })
            })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.success && d.magnet) {
                    btn.outerHTML = '<a href="' + d.magnet.replace(/&/g, '&amp;') + '" class="' + btn.className + '">Download Magnet</a>';
                }
            })
            .catch(function(e) { console.error('[ext-magnet] fetch error:', e); });
        });
    }, 100);
})();
