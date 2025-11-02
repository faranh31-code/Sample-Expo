// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBs3-ho7AwET09pKAlK42PriyBOUB5ZNlY",
  authDomain: "studio-4264885498-3df2e.firebaseapp.com",
  projectId: "studio-4264885498-3df2e",
  storageBucket: "studio-4264885498-3df2e.firebasestorage.app",
  messagingSenderId: "389611288011",
  appId: "1:389611288011:web:ea8556ae844e091847324e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
