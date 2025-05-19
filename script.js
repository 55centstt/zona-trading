import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTBPf2N-ZGlsAnJ2BafU-rj-zfNuC3xwE",
  authDomain: "zona-trading.firebaseapp.com",
  projectId: "zona-trading",
  storageBucket: "zona-trading.appspot.com",
  messagingSenderId: "391263073098",
  appId: "1:391263073098:web:cd514e2e68d126a9cb87b3",
  measurementId: "G-S91LZY3NR6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const form = document.getElementById("articleForm");
const articlesContainer = document.getElementById("articles-container");
const searchBar = document.getElementById("searchBar");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = form["title"].value;
  const content = form["content"].value;
  const category = form["category"].value;
  const imageFile = form["image"].files[0];

  let imageUrl = "";
  if (imageFile) {
    const imageRef = ref(storage, `images/${Date.now()}-${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    imageUrl = await getDownloadURL(imageRef);
  }

  await addDoc(collection(db, "articles"), {
    title,
    content,
    category,
    imageUrl,
    timestamp: Date.now()
  });

  form.reset();
  loadArticles();
});

async function loadArticles(filter = "", search = "") {
  articlesContainer.innerHTML = "";

  const q = query(collection(db, "articles"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach(async (docRef) => {
    const data = docRef.data();
    const articleId = docRef.id;

    if (
      (filter === "" || data.category === filter || filter === "Todos") &&
      (search === "" || data.title.toLowerCase().includes(search.toLowerCase()))
    ) {
      const article = document.createElement("div");
      article.classList.add("article");

      article.innerHTML = `
        <h3>${data.title}</h3>
        ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Imagen del artículo" />` : ""}
        <p>${data.content}</p>
        <small><strong>${data.category}</strong></small>
        <div class="comments">
          <h4>Comentarios</h4>
          <div class="comment-list" id="comments-${articleId}"></div>
          <form class="comment-form" data-id="${articleId}">
            <input type="text" placeholder="Escribe tu comentario..." required />
            <button type="submit">Comentar</button>
          </form>
        </div>
      `;

      articlesContainer.appendChild(article);
      loadComments(articleId);
    }
  });
}

async function loadComments(articleId) {
  const commentContainer = document.getElementById(`comments-${articleId}`);
  commentContainer.innerHTML = "";

  const commentsRef = collection(db, `articles/${articleId}/comments`);
  const snapshot = await getDocs(commentsRef);

  snapshot.forEach((doc) => {
    const data = doc.data();
    const comment = document.createElement("div");
    comment.classList.add("comment");
    comment.textContent = data.text;
    commentContainer.appendChild(comment);
  });
}

document.addEventListener("submit", async (e) => {
  if (e.target.classList.contains("comment-form")) {
    e.preventDefault();
    const articleId = e.target.getAttribute("data-id");
    const input = e.target.querySelector("input");
    const commentText = input.value;

    if (commentText.trim() !== "") {
      const commentsRef = collection(db, `articles/${articleId}/comments`);
      await addDoc(commentsRef, { text: commentText });
      input.value = "";
      loadComments(articleId);
    }
  }
});

searchBar.addEventListener("input", () => {
  loadArticles(currentCategory, searchBar.value);
});

let currentCategory = "";

document.querySelectorAll("#filters button").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentCategory = btn.getAttribute("data-category");
    loadArticles(currentCategory, searchBar.value);
  });
});

loadArticles();
