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
  onSnapshot
} from 'firebase/firestore';
import scrollIntoView from 'scroll-into-view-if-needed';
import config from './db_config.js';

const app = initializeApp(config);
const db = getFirestore(app);

/**
 * sends a message to the database
 * @param {object} message
 */
async function sendMessage(message) {
  // Add a new document with a generated id.
  const docRef = await addDoc(collection(db, 'messages'), message);
  document.querySelector('#message').value = '';
  console.log('Document written with ID: ', docRef.id);
}

/**
 * Creates the message object from the input fields
 * @returns {object} the message object
 */
function createMessage() {
  const message = document.querySelector('#message').value;
  const username = document.querySelector('#nickname').value;
  const date = Timestamp.now();

  // const messageObj = { message: message, username: username, date: date}
  // const messageObj = { message, username, date };
  // return messageObj;
  return { message, username, date };
}

function displayMessage(message) {
  const messageHTML = /*html*/ `
          <div class="message">
            <i class="fas fa-user"></i>
            <div>
              <span class="username">
                ${message.username}
                <time>just now</time>
              </span>
              <br />
              <span class="message-text">${message.message}</span>
            </div>
            <div class="message-edit-buttons">
              <i class="fas fa-trash-alt"></i>
              <i class="fas fa-pen"></i>
            </div>
          </div>
        </div>
  `;
  const messages = document.querySelector('#messages');
  messages.insertAdjacentHTML('beforeend', messageHTML);
  scrollIntoView(messages, {
    scrollMode: 'if-needed',
    block: 'end'
  });
}

async function displayAllMessages() {
  // query the database for all messages
  // loop over the messages and call displayMessage for each message
  const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    displayMessage(doc.data());
  });
}

// to make sure that the HTML is loaded before we try to access it
window.addEventListener('DOMContentLoaded', () => {
  // displayAllMessages();
  document.querySelector('#send').addEventListener('click', () => {
    const message = createMessage();
    if (message.message && message.username) {
      sendMessage(message);
      // displayMessage(message);
    }
  });
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    const message = createMessage();
    if (message.message && message.username) {
      sendMessage(message);
      // displayMessage(message);
    }
  }
});

onSnapshot(collection(db, 'messages'), (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      displayMessage(change.doc.data());
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
