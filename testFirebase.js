import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBb7Ag2JnF7IR5Rqejs6yi0USD71yKY5ZU",
  authDomain: "digital-roomate.firebaseapp.com",
  projectId: "digital-roomate",
  storageBucket: "digital-roomate.firebasestorage.app",
  messagingSenderId: "277961168522",
  appId: "1:277961168522:web:a20acedda80356dca7ff73",
  measurementId: "G-VE30320VSV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    console.log("Testing write...");
    const docRef = await addDoc(collection(db, "testCollection"), {
      test: "Hello",
      roomId: "TEST_ROOM",
      createdAt: new Date()
    });
    console.log("Write success! ID:", docRef.id);

    console.log("Testing read (Expenses simulation)...");
    const qExpenses = query(
      collection(db, 'expenses'), 
      where('roomId', '==', 'TEST_ROOM'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(qExpenses);
    console.log("Read success! Docs found:", snap.docs.length);

  } catch (e) {
    console.error("Firebase Error:");
    console.error(e.message);
  }
}
run();
