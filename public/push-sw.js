self.addEventListener('push', function (event) {
  var data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = { title: 'Stepra', body: event.data ? event.data.text() : '' };
  }

  var title = data.title || 'Stepra';
  var options = {
    body: data.body || '',
    icon: '/logo/android-chrome-192x192.png',
    badge: '/logo/favicon-32x32.png',
    data: { url: data.url || '/dashboard' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';
  var absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(targetUrl) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    })
  );
});
