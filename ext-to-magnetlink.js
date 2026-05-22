// ==UserScript==
// @name         ext.to Direct Magnet Link
// @namespace    EXTTO
// @version      2.0
// @description  Replace magnet buttons with direct links on ext.to
// @match        https://ext.to/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    var maxChecks = 300;
    var check = 0;

    function getCsrf() {
        return window.csrfToken || (function() {
            var m = document.querySelector('meta[name="csrf-token"]');
            return m ? m.getAttribute('content') : null;
        })();
    }

    var iv = setInterval(function() {
        var csrf = getCsrf();
        if (typeof CryptoJS === 'undefined' || !csrf || (!window.pageToken && !window.searchPageToken)) {
            check++;
            if (check > maxChecks) clearInterval(iv);
            return;
        }
        clearInterval(iv);

        var buttons = document.querySelectorAll(
            '.download-btn-magnet, .search-magnet-btn, .download-btn-magnet-related'
        );
        if (!buttons.length) return;

        buttons.forEach(function(btn) {
            var isSearch = btn.classList.contains('search-magnet-btn');
            var endpoint = isSearch ? '/ajax/getSearchMagnet.php' : '/ajax/getTorrentMagnet.php';
            var token = isSearch ? window.searchPageToken : window.pageToken;
            var tid = btn.getAttribute('data-id');
            if (!tid) return;

            var ts = Math.floor(Date.now() / 1000);
            var hmac = CryptoJS.SHA256(tid + '|' + ts + '|' + token).toString();

            var params = { torrent_id: tid, timestamp: ts, hmac: hmac, sessid: csrf };
            if (!isSearch) params.action = 'get_magnet';

            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: new URLSearchParams(params)
            })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.success) {
                    var magnet = d.magnet || d.url;
                    if (magnet) {
                        btn.outerHTML = '<a href="' + magnet.replace(/&/g, '&amp;') + '" class="' + btn.className + '"><i class="material-icons file_download"></i></a>';
                    }
                }
            })
            .catch(function(e) {});
        });
    }, 100);
})();
