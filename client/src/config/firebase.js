import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBpkCl57TiqLZ8fiDBZsZitb3VK60MJ2w",
  authDomain: "fraud-detect-72f11.firebaseapp.com",
  projectId: "fraud-detect-72f11",
  storageBucket: "fraud-detect-72f11.firebasestorage.app",
  messagingSenderId: "1077076139393",
  appId: "1:1077076139393:web:c2f0d58ab9c1024f3e1c80",
  measurementId: "G-WNE9J5WS0Q"
};

const app = initializeApp(firebaseConfig);

let analytics = null;

if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch {
    analytics = null;
  }
}

export { app, analytics };
export default app;