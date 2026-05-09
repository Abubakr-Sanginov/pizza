self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('Push data parse error:', e);
    data = { title: 'New notification', body: event.data ? event.data.text() : '' };
  }

  const options = {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    image: data.imageUrl || data.image,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
