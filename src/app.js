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
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
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
  return { message, username };
}

function displayMessage(doc) {
  const message = doc.data();
  const id = doc.id;
  const messageHTML = `
    <div class="message" data-id="${id}">
      <i class="fas fa-user"></i>
      <div>
        <span class="username">
          ${message.username}
          <time>${new Date(message.createdAt.toDate()).toLocaleString('hu-HU')}</time>
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
  const editButton = messages.querySelector(`[data-id="${id}"] .fa-pen`);
  editButton.addEventListener('click', () => {
    displayEditMessage(id);
  });
}

async function displayAllMessages() {
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    displayMessage(doc);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  displayAllMessages();
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
      updateMessage(change.doc);
    }
    if (change.type === 'removed') {
      console.log('removed', change.doc.data());
      deleteMessage(change.doc.id);
    }
  });
});

async function removeMessage(id) {
  try {
    await deleteDoc(doc(db, 'messages', id));
    console.log('Document deleted with ID: ', id);
  } catch (error) {
    console.error('Error removing document: ', error);
  }
}

async function updateMessage(doc) {
  const message = doc.data();
  const id = doc.id;
  const messageHTML = `
    <div class="message" data-id="${id}">
      <i class="fas fa-user"></i>
      <div>
        <span class="username">
          ${message.username}
          <time>${new Date(message.createdAt.toDate()).toLocaleString('hu-HU')}</time>
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
  const messageElement = document.querySelector(`[data-id="${id}"]`);
  messageElement.outerHTML = messageHTML;
  const deleteButton = document.querySelector(`[data-id="${id}"] .fa-trash-alt`);
  deleteButton.addEventListener('click', () => {
    removeMessage(id);
    deleteMessage(id);
  });
  const editButton = document.querySelector(`[data-id="${id}"] .fa-pen`);
  editButton.addEventListener('click', () => {
    displayEditMessage(id);
  });
}

async function deleteMessage(id) {
  try {
    await deleteDoc(doc(db, 'messages', id));
    console.log('Document deleted with ID: ', id);
  } catch (error) {
    console.error('Error removing document: ', error);
  }
}

async function editMessage(id, message) {
  try {
    const messageWithTimestamp = { ...message, updatedAt: serverTimestamp() };
    await updateDoc(doc(db, 'messages', id), messageWithTimestamp);
    console.log('Document updated with ID: ', id);
  } catch (error) {
    console.error('Error updating document: ', error);
  }
}

function displayEditMessage(id) {
  const messageElement = document.querySelector(`[data-id="${id}"]`);
  const messageTextElement = messageElement.querySelector('.message-text');
  const messageText = messageTextElement.innerText;
  const editFormHTML = `
    <div class="edit-form">
      <textarea id="edit-message">${messageText}</textarea>
      <button id="edit-send">Update</button>
    </div>
  `;
  messageElement.innerHTML = editFormHTML;
  const editSendButton = messageElement.querySelector('#edit-send');
  editSendButton.addEventListener('click', () => {
    const newMessage = document.querySelector('#edit-message').value;
    if (newMessage) {
      editMessage(id, { message: newMessage });
    }
  });
}
