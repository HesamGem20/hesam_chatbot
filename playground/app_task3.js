import './scss/style.scss';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  addDoc,
  collection,
  Timestamp,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  fromMillis,
  doc,
  deleteDoc
} from 'firebase/firestore';
import scrollIntoView from 'scroll-into-view-if-needed';
import config from './db_config.js';

const app = initializeApp(config);
const db = getFirestore(app);

async function sendMessage(message) {
  const createdAt = Timestamp.now();
  const messageWithTimestamp = { ...message, createdAt };
  const docRef = await addDoc(collection(db, 'messages'), messageWithTimestamp);
  document.querySelector('#message').value = '';
  console.log('Document written with ID: ', docRef.id);
}

function createMessage() {
  const message = document.querySelector('#message').value;
  const username = document.querySelector('#nickname').value;
  const date = Timestamp.now();
  return { message, username, date };
}

function displayMessage(doc) {
  const message = doc.data();
  const id = doc.id;
  const messageHTML = /*html*/ `
    <div class="message" data-id="${id}">
      <i class="fas fa-user"></i>
      <div>
        <span class="username">
          ${message.username}
          <time>${new Date(message.date.toDate()).toLocaleString('hu-HU')}</time>
        </span>
        <br />
        <span class="message-text">${message.message}</span>
      </div>
      <div class="message-edit-buttons">
        <i class="fas fa-trash-alt"></i>
        <i class="fas fa-pen"></i>
      </div>
    </div>
  `;
  const messages = document.querySelector('#messages');
  messages.insertAdjacentHTML('beforeend', messageHTML);
  scrollIntoView(messages, {
    scrollMode: 'if-needed',
    block: 'end'
  });
  const deleteButton = messages.querySelector(`[data-id="${id}"] .fa-trash-alt`);
  deleteButton.addEventListener('click', () => {
    removeMessage(id);
    deleteMessage(id);
  });
}

async function displayAllMessages() {
  const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    displayMessage(doc);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#send').addEventListener('click', () => {
    const message = createMessage();
    if (message.message && message.username) {
      sendMessage(message);
    }
  });
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    const message = createMessage();
    if (message.message && message.username) {
      sendMessage(message);
    }
  }
});

onSnapshot(collection(db, 'messages'), (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      displayMessage(change.doc);
      console.log('added', change.doc.data());
    }
    if (change.type === 'modified') {
      console.log('modified', change.doc.data());
    }
    if (change.type === 'removed') {
      console.log('removed', change.doc.data());
    }
  });
});

async function removeMessage(id) {
  const message = document.querySelector(`[data-id="${id}"]`);
  message.remove();
}

async function deleteMessage(id) {
  await deleteDoc(doc(db, 'messages', id));
  console.log(`Document with ID ${id} deleted`);
}