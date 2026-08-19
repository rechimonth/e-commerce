const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
if (require('firebase-admin/app').getApps().length === 0) {
  initializeApp({ projectId: 'e-commerce-project5' });
}
const db = getFirestore();
db.collection('orders').get().then(s => {
  console.log('Orders count:', s.size);
  s.forEach(d => {
    const data = d.data();
    console.log(d.id, data.status, data.userId, data.totalCents);
  });
}).catch(e => console.error(e));
