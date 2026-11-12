
const postsContainer = document.getElementById("postsContainer");
const postInput = document.getElementById("postInput");
const publishButton = document.getElementById("publishButton");
const photoInput = document.getElementById("photoInput");
const photoTool = document.getElementById("photoTool");
const imagePreview = document.getElementById("imagePreview");
const toast = document.getElementById("toast");

let selectedImage = "";

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function escapeHTML(text) {
  return text.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

document.getElementById("jumpToPost").addEventListener("click", () => {
  document.getElementById("criar-publicacao").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
  postInput.focus();
});

photoTool.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Escolha um arquivo de imagem.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("A imagem deve ter no máximo 5 MB.");
    photoInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = event => {
    selectedImage = event.target.result;
    imagePreview.innerHTML = `<img src="${selectedImage}" alt="Prévia da imagem selecionada">`;
    showToast("Imagem adicionada à publicação.");
  };

  reader.readAsDataURL(file);
});

document.getElementById("feelingTool").addEventListener("click", () => {
  const feelings = ["😊 feliz", "🚀 motivado", "💜 grato", "🌿 tranquilo", "✨ inspirado"];
  const feeling = feelings[Math.floor(Math.random() * feelings.length)];
  postInput.value = postInput.value
    ? `${postInput.value} ${feeling}`
    : `Estou me sentindo ${feeling} hoje!`;
  postInput.focus();
});

publishButton.addEventListener("click", () => {
  const text = postInput.value.trim();

  if (!text && !selectedImage) {
    showToast("Escreva algo ou escolha uma foto antes de publicar.");
    postInput.focus();
    return;
  }

  const post = document.createElement("article");
  post.className = "post card";
  post.dataset.likes = "0";

  const imageHTML = selectedImage
    ? `<img class="post-image" src="${selectedImage}" alt="Imagem da publicação">`
    : "";

  post.innerHTML = `
    <div class="post-header">
      <img class="avatar" src="https://i.pravatar.cc/100?img=47" alt="Alex Morgan">
      <div class="post-author">
        <strong>Alex Morgan</strong>
        <span>@alexmorgan · agora mesmo</span>
      </div>
      <button class="more-button" aria-label="Mais opções">•••</button>
    </div>
    ${text ? `<p class="post-text">${escapeHTML(text)}</p>` : ""}
    ${imageHTML}
    <div class="post-stats">
      <span class="like-summary">♥ 0 curtidas</span>
      <span>0 comentários</span>
    </div>
    <div class="post-actions">
      <button class="action-button like-button">♡ <span>Curtir</span></button>
      <button class="action-button comment-button">♧ <span>Comentar</span></button>
      <button class="action-button share-button">↗ <span>Compartilhar</span></button>
    </div>
    <div class="comments-area" hidden>
      <div class="comment-form">
        <input type="text" placeholder="Escreva um comentário...">
        <button>Enviar</button>
      </div>
    </div>
  `;

  postsContainer.prepend(post);
  postInput.value = "";
  selectedImage = "";
  photoInput.value = "";
  imagePreview.innerHTML = "";

  showToast("Sua publicação foi adicionada ao feed!");
  post.scrollIntoView({ behavior: "smooth", block: "center" });
});

postsContainer.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  const post = button.closest(".post");
  if (!post) return;

  if (button.classList.contains("like-button")) {
    const liked = button.classList.toggle("liked");
    const currentLikes = Number(post.dataset.likes || 0);
    const newLikes = Math.max(0, currentLikes + (liked ? 1 : -1));

    post.dataset.likes = String(newLikes);
    button.innerHTML = `${liked ? "♥" : "♡"} <span>${liked ? "Curtido" : "Curtir"}</span>`;

    const summary = post.querySelector(".like-summary");
    if (summary) summary.textContent = `♥ ${newLikes} curtidas`;
  }

  if (button.classList.contains("comment-button")) {
    const area = post.querySelector(".comments-area");
    area.hidden = !area.hidden;

    if (!area.hidden) {
      area.querySelector("input").focus();
    }
  }

  if (button.classList.contains("share-button")) {
    const text = post.querySelector(".post-text")?.textContent || "Confira esta publicação no Connect!";
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => showToast("Texto da publicação copiado!"))
        .catch(() => showToast("Não foi possível copiar o texto."));
    } else {
      showToast("Compartilhamento demonstrativo do Connect.");
    }
  }
});

postsContainer.addEventListener("click", event => {
  if (!event.target.matches(".comment-form button")) return;

  const form = event.target.closest(".comment-form");
  const input = form.querySelector("input");
  const comment = input.value.trim();

  if (!comment) {
    showToast("Digite um comentário primeiro.");
    return;
  }

  const commentLine = document.createElement("div");
  commentLine.className = "sample-comment";
  commentLine.innerHTML = `<strong>Alex:</strong> ${escapeHTML(comment)}`;
  form.before(commentLine);
  input.value = "";
  showToast("Comentário adicionado!");
});

document.querySelectorAll(".follow-button").forEach(button => {
  button.addEventListener("click", () => {
    const following = button.classList.toggle("following");
    button.textContent = following ? "✓" : "＋";
    button.setAttribute("aria-label", following ? "Seguindo" : "Seguir");
    showToast(following ? "Você começou a seguir essa pessoa!" : "Você deixou de seguir essa pessoa.");
  });
});

document.querySelectorAll(".story").forEach(story => {
  story.addEventListener("click", () => {
    showToast(`Momento de ${story.dataset.story} — demonstração visual.`);
  });
});

document.getElementById("notificationButton").addEventListener("click", () => {
  showToast("Você está em dia com suas notificações!");
});

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
    link.classList.add("active");

    if (link.dataset.nav !== "inicio") {
      showToast(`Área "${link.textContent.trim()}" demonstrativa.`);
    }
  });
});

document.getElementById("feedFilter").addEventListener("change", event => {
  const posts = [...postsContainer.querySelectorAll(".post")];

  if (event.target.value === "populares") {
    posts.sort((a, b) => Number(b.dataset.likes) - Number(a.dataset.likes));
  } else {
    posts.reverse();
  }

  posts.forEach(post => postsContainer.appendChild(post));
});
