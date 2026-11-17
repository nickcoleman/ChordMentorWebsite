// Device switch: shows the app's screens as they look on iPhone, iPad or Mac.
// Loaded in <head> (not deferred) so the right screens show on first paint.
// Picks the visitor's own device the first time; a choice made with the switch is remembered.
(function () {
  var KEY = 'cm-device', DEVICES = ['iphone', 'ipad', 'mac'];
  var root = document.documentElement;

  function guess() {
    var ua = navigator.userAgent;
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ipad';
    if (/iPhone|iPod|Android.*Mobile/.test(ua)) return 'iphone';
    if (/Android/.test(ua)) return 'ipad';
    if (/Macintosh/.test(ua)) return 'mac';
    return 'iphone';
  }
  function saved() {
    try { var d = localStorage.getItem(KEY); return DEVICES.indexOf(d) >= 0 ? d : null; } catch (e) { return null; }
  }
  function set(device, remember) {
    root.setAttribute('data-device', device);
    var buttons = document.querySelectorAll('[data-device-pick]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-device-pick') === device));
    }
    if (remember) { try { localStorage.setItem(KEY, device); } catch (e) {} }
  }

  set(saved() || guess(), false);

  document.addEventListener('DOMContentLoaded', function () {
    set(root.getAttribute('data-device'), false);
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-device-pick]');
      if (b) set(b.getAttribute('data-device-pick'), true);
    });
  });
})();
