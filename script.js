/* CONNECT — interações demonstrativas */
const postsContainer = document.getElementById("postsContainer");
const postInput = document.getElementById("postInput");
const publishButton = document.getElementById("publishButton");
const photoInput = document.getElementById("photoInput");
const photoTool = document.getElementById("photoTool");
const imagePreview = document.getElementById("imagePreview");
const toast = document.getElementById("toast");
const modalRoot = document.getElementById("modalRoot");
const searchInput = document.getElementById("searchInput");

let selectedImage = "";
let toastTimer;
let currentFilter = "recentes";
const savedPosts = new Set(JSON.parse(localStorage.getItem("connectSavedPosts") || "[]"));

[...postsContainer.querySelectorAll(".post")].forEach((post, index) => {
  if (!post.dataset.postId) post.dataset.postId = `sample-${index + 1}`;
  if (!post.dataset.created) post.dataset.created = String(index + 1);
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function openModal(title, content) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-close-modal>
      <section class="connect-modal" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">
        <div class="modal-heading">
          <h2>${escapeHTML(title)}</h2>
          <button type="button" class="modal-close" aria-label="Fechar">×</button>
        </div>
        <div class="modal-content">${content}</div>
      </section>
    </div>`;

  modalRoot.querySelector(".modal-close").addEventListener("click", closeModal);

  modalRoot.querySelector(".modal-backdrop").addEventListener("click", event => {
    if (event.target.matches("[data-close-modal]")) closeModal();
  });

  document.addEventListener("keydown", escModal, { once: true });
}

function escModal(event) {
  if (event.key === "Escape") closeModal();
}

function closeModal() {
  modalRoot.innerHTML = "";
}

function scrollToSection(id) {
  const target = document.getElementById(id);

  if (target) {
    target.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

document.getElementById("jumpToPost").addEventListener("click", () => {
  scrollToSection("criar-publicacao");
  postInput.focus();
});

document.querySelectorAll('a[href="#criar-publicacao"]').forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    scrollToSection("criar-publicacao");
    postInput.focus();
  });
});

photoTool.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Escolha um arquivo de imagem.");
    photoInput.value = "";
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

    imagePreview.innerHTML = `
      <div class="preview-wrap">
        <img src="${selectedImage}" alt="Prévia da imagem selecionada">
        <button type="button" id="removePreview" class="remove-preview">Remover foto ×</button>
      </div>`;

    document.getElementById("removePreview").addEventListener("click", () => {
      selectedImage = "";
      photoInput.value = "";
      imagePreview.innerHTML = "";
    });

    showToast("Imagem adicionada à publicação.");
  };

  reader.readAsDataURL(file);
});

document.getElementById("feelingTool").addEventListener("click", () => {
  const feelings = [
    "😊 feliz",
    "🚀 motivado",
    "💜 grato",
    "🌿 tranquilo",
    "✨ inspirado"
  ];

  const feeling = feelings[Math.floor(Math.random() * feelings.length)];

  postInput.value = postInput.value
    ? `${postInput.value} ${feeling}`
    : `Estou me sentindo ${feeling} hoje!`;

  postInput.focus();
});

function updateCommentCount(post, amount = 1) {
  const counter = post.querySelector(".comment-count");

  if (!counter) return;

  const current = Number((counter.textContent.match(/\d+/) || [0])[0]);

  counter.textContent = `${current + amount} comentários`;
}

function makePost(text, image) {
  const post = document.createElement("article");

  post.className = "post card";
  post.dataset.likes = "0";
  post.dataset.created = String(Date.now());
  post.dataset.postId = `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  post.innerHTML = `
    <div class="post-header">
      <img class="avatar" src="https://i.pravatar.cc/100?img=47" alt="Alex Morgan">

      <div class="post-author">
        <strong>Alex Morgan</strong>
        <span>@alexmorgan · agora mesmo</span>
      </div>

      <button type="button" class="more-button" aria-label="Mais opções">•••</button>
    </div>

    ${text ? `<p class="post-text">${escapeHTML(text)}</p>` : ""}

    ${image ? `<img class="post-image" src="${image}" alt="Imagem da publicação">` : ""}

    <div class="post-stats">
      <span class="like-summary">♥ 0 curtidas</span>
      <span class="comment-count">0 comentários</span>
    </div>

    <div class="post-actions">
      <button type="button" class="action-button like-button">♡ <span>Curtir</span></button>
      <button type="button" class="action-button comment-button">♧ <span>Comentar</span></button>
      <button type="button" class="action-button share-button">↗ <span>Compartilhar</span></button>
    </div>

    <div class="comments-area" hidden>
      <div class="comment-list"></div>

      <div class="comment-form">
        <input type="text" maxlength="180" placeholder="Escreva um comentário...">
        <button type="button">Enviar</button>
      </div>
    </div>`;

  return post;
}

publishButton.addEventListener("click", () => {
  const text = postInput.value.trim();

  if (!text && !selectedImage) {
    showToast("Escreva algo ou escolha uma foto antes de publicar.");
    postInput.focus();
    return;
  }

  const post = makePost(text, selectedImage);

  postsContainer.prepend(post);

  postInput.value = "";
  selectedImage = "";
  photoInput.value = "";
  imagePreview.innerHTML = "";

  applyFeedFilter();

  showToast("Sua publicação foi adicionada ao feed!");

  post.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

postsContainer.addEventListener("click", async event => {
  const button = event.target.closest("button");

  if (!button) return;

  const post = button.closest(".post");

  if (!post) return;

  if (button.classList.contains("like-button")) {
    const liked = button.classList.toggle("liked");
    const current = Number(post.dataset.likes || 0);
    const next = Math.max(0, current + (liked ? 1 : -1));

    post.dataset.likes = String(next);

    button.innerHTML = `${liked ? "♥" : "♡"} <span>${liked ? "Curtido" : "Curtir"}</span>`;

    const summary = post.querySelector(".like-summary");

    if (summary) {
      summary.textContent = `♥ ${next} curtidas`;
    }

    if (currentFilter === "populares") {
      applyFeedFilter();
    }
  }

  if (button.classList.contains("comment-button")) {
    const area = post.querySelector(".comments-area");

    area.hidden = !area.hidden;

    if (!area.hidden) {
      area.querySelector("input").focus();
    }
  }

  if (button.classList.contains("share-button")) {
    const text = post.querySelector(".post-text")?.textContent ||
      "Confira esta publicação no Connect!";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Connect",
          text
        });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast("Texto da publicação copiado!");
      } else {
        showToast("Compartilhamento demonstrativo do Connect.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("Não foi possível compartilhar agora.");
      }
    }
  }

  if (button.classList.contains("more-button")) {
    const id = post.dataset.postId ||
      `sample-${[...postsContainer.children].indexOf(post)}`;

    const isSaved = savedPosts.has(id);

    openModal("Opções da publicação", `
      <p class="modal-description">Escolha o que deseja fazer com esta publicação.</p>

      <button type="button" class="modal-action" id="savePostAction">
        ${isSaved ? "★ Remover dos salvos" : "☆ Salvar publicação"}
      </button>

      <button type="button" class="modal-action" id="copyPostAction">
        ↗ Copiar texto da publicação
      </button>

      <button type="button" class="modal-action" id="hidePostAction">
        Ocultar esta publicação
      </button>
    `);

    document.getElementById("savePostAction").addEventListener("click", () => {
      if (savedPosts.has(id)) {
        savedPosts.delete(id);
      } else {
        savedPosts.add(id);
      }

      post.dataset.postId = id;

      localStorage.setItem(
        "connectSavedPosts",
        JSON.stringify([...savedPosts])
      );

      closeModal();

      showToast(
        savedPosts.has(id)
          ? "Publicação salva!"
          : "Publicação removida dos salvos."
      );
    });

    document.getElementById("copyPostAction").addEventListener("click", async () => {
      const value = post.querySelector(".post-text")?.textContent ||
        "Publicação do Connect";

      try {
        await navigator.clipboard.writeText(value);
        showToast("Texto copiado!");
      } catch {
        showToast("Não foi possível copiar neste navegador.");
      }

      closeModal();
    });

    document.getElementById("hidePostAction").addEventListener("click", () => {
      post.remove();
      closeModal();
      showToast("Publicação ocultada deste feed.");
    });
  }
});

postsContainer.addEventListener("click", event => {
  if (!event.target.closest(".comment-form button")) return;

  const form = event.target.closest(".comment-form");
  const input = form.querySelector("input");
  const comment = input.value.trim();

  if (!comment) {
    showToast("Digite um comentário primeiro.");
    input.focus();
    return;
  }

  const line = document.createElement("div");

  line.className = "sample-comment";
  line.innerHTML = `<strong>Alex:</strong> ${escapeHTML(comment)}`;

  form.parentElement.querySelector(".comment-list").appendChild(line);

  input.value = "";

  updateCommentCount(form.closest(".post"));

  showToast("Comentário adicionado!");
});

postsContainer.addEventListener("keydown", event => {
  if (
    event.key === "Enter" &&
    event.target.matches(".comment-form input")
  ) {
    event.preventDefault();

    event.target.closest(".comment-form")
      .querySelector("button")
      .click();
  }
});

document.querySelectorAll(".follow-button").forEach(button => {
  button.addEventListener("click", () => {
    const following = button.classList.toggle("following");

    button.textContent = following ? "✓" : "＋";

    button.setAttribute(
      "aria-label",
      following ? "Deixar de seguir" : "Seguir"
    );

    button.title = following ? "Deixar de seguir" : "Seguir";

    showToast(
      following
        ? "Você começou a seguir essa pessoa!"
        : "Você deixou de seguir essa pessoa."
    );
  });
});

document.querySelectorAll(".story").forEach(story => {
  story.addEventListener("click", () => {
    const name = story.dataset.story || "Pessoa";
    const img = story.querySelector("img")?.src || "";

    if (name === "Seu momento") {
      openModal("Adicionar momento", `
        <p class="modal-description">Escolha uma imagem para criar seu momento.</p>

        <button type="button" class="modal-primary" id="storyUploadButton">
          Escolher foto
        </button>

        <input type="file" id="storyUploadInput" accept="image/*" hidden>
      `);

      document.getElementById("storyUploadButton").addEventListener("click", () => {
        document.getElementById("storyUploadInput").click();
      });

      document.getElementById("storyUploadInput").addEventListener("change", event => {
        if (event.target.files[0]) {
          closeModal();

          showToast(
            `Foto "${event.target.files[0].name}" selecionada para seu momento (demonstração).`
          );
        }
      });

      return;
    }

    openModal(
      `Momento de ${name}`,
      `
        <div class="story-viewer">
          ${img ? `<img src="${img}" alt="Momento de ${escapeHTML(name)}">` : ""}
          <p>Este é um momento demonstrativo de ${escapeHTML(name)}.</p>
        </div>
      `
    );
  });
});

document.getElementById("notificationButton").addEventListener("click", () => {
  openModal("Notificações", `
    <div class="notification-item">
      <span>💜</span>
      <div>
        <strong>Sofia Martins</strong> curtiu uma publicação sua.
        <small>Há 12 minutos</small>
      </div>
    </div>

    <div class="notification-item">
      <span>👋</span>
      <div>
        <strong>Gabriel Santos</strong> começou a seguir você.
        <small>Há 35 minutos</small>
      </div>
    </div>

    <div class="notification-item">
      <span>💬</span>
      <div>
        <strong>Mariana Costa</strong> comentou em uma publicação.
        <small>Há 1 hora</small>
      </div>
    </div>
  `);
});

document.getElementById("profileButton").addEventListener("click", () => {
  openModal("Meu perfil", `
    <div class="profile-modal">
      <img src="https://i.pravatar.cc/120?img=47" alt="Alex Morgan">

      <h3>Alex Morgan</h3>
      <p>@alexmorgan</p>

      <p>Compartilhando ideias, momentos e boas conexões. ✨</p>

      <div class="profile-numbers">
        <span><strong>${postsContainer.children.length}</strong> publicações</span>
        <span><strong>248</strong> seguidores</span>
        <span><strong>180</strong> seguindo</span>
      </div>

      <button type="button" class="modal-primary" id="editProfileButton">
        Editar perfil
      </button>
    </div>
  `);

  document.getElementById("editProfileButton").addEventListener("click", () => {
    openModal("Editar perfil", `
      <label class="modal-label">
        Nome
        <input id="profileNameInput" value="Alex Morgan">
      </label>

      <label class="modal-label">
        Biografia
        <textarea id="profileBioInput">Compartilhando ideias, momentos e boas conexões.</textarea>
      </label>

      <button type="button" class="modal-primary" id="saveProfileButton">
        Salvar alterações
      </button>
    `);

    document.getElementById("saveProfileButton").addEventListener("click", () => {
      const name = document.getElementById("profileNameInput").value.trim();

      if (!name) {
        showToast("Informe seu nome.");
        return;
      }

      document.querySelector(".top-profile span:not(.chevron)").textContent = name;

      document.querySelector(".welcome h1").innerHTML =
        `Olá, ${escapeHTML(name.split(" ")[0])}! <span>✦</span>`;

      closeModal();

      showToast("Perfil atualizado nesta demonstração.");
    });
  });
});

function openInfoPanel(section) {
  const panels = {
    mensagens: [
      "Mensagens",
      `
        <div class="message-preview">
          <strong>Mariana Costa</strong>
          <p>Oi! Tudo bem? Adorei sua última publicação. 😊</p>
          <small>Hoje · 14:32</small>
        </div>

        <div class="message-preview">
          <strong>Lucas Almeida</strong>
          <p>Vamos conversar sobre aquele projeto?</p>
          <small>Hoje · 13:10</small>
        </div>

        <p class="modal-note">
          Caixa de mensagens demonstrativa: o envio real exige um sistema com servidor.
        </p>
      `
    ],

    configuracoes: [
      "Configurações",
      `
        <label class="setting-row">
          <span>Notificações do Connect</span>
          <input type="checkbox" checked>
        </label>

        <label class="setting-row">
          <span>Modo de alto contraste</span>
          <input type="checkbox" id="contrastToggle">
        </label>

        <label class="setting-row">
          <span>Mostrar sugestões de pessoas</span>
          <input type="checkbox" checked>
        </label>
      `
    ],

    sobre: [
      "Sobre o Connect",
      `
        <p>
          O Connect é um projeto educacional criado com HTML, CSS e JavaScript
          para demonstrar a interface de uma rede social.
        </p>
      `
    ],

    privacidade: [
      "Privacidade",
      `
        <p>
          Esta versão é demonstrativa. As interações ficam no navegador
          e não existe conta ou servidor para armazenar dados pessoais.
        </p>
      `
    ],

    ajuda: [
      "Ajuda",
      `
        <p>
          Use o campo de pesquisa para filtrar publicações, os botões do feed
          para curtir e comentar e o menu de três pontos para salvar ou ocultar
          uma publicação.
        </p>
      `
    ]
  };

  const [title, body] = panels[section];

  openModal(title, body);

  if (section === "configuracoes") {
    document.getElementById("contrastToggle").addEventListener("change", event => {
      document.body.classList.toggle("high-contrast", event.target.checked);
    });
  }
}

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    const section = link.dataset.nav;

    document.querySelectorAll(".nav-link").forEach(item => {
      item.classList.remove("active");
    });

    link.classList.add("active");

    if (section === "inicio") {
      [...postsContainer.querySelectorAll(".post")].forEach(post => {
        post.hidden = false;
      });

      searchInput.value = "";
      currentFilter = "recentes";

      document.getElementById("feedFilter").value = "recentes";

      applyFeedFilter();
      scrollToSection("inicio");
    }

    else if (section === "explorar") {
      openModal("Explorar", `
        <p class="modal-description">
          Descubra assuntos populares na comunidade.
        </p>

        <button type="button" class="modal-action explore-tag" data-tag="InovaçãoDigital">
          #InovaçãoDigital · 2,4 mil publicações
        </button>

        <button type="button" class="modal-action explore-tag" data-tag="IdeiasCriativas">
          #IdeiasCriativas · 1,8 mil publicações
        </button>

        <button type="button" class="modal-action explore-tag" data-tag="VidaLeve">
          #VidaLeve · 960 publicações
        </button>
      `);

      modalRoot.querySelectorAll(".explore-tag").forEach(item => {
        item.addEventListener("click", () => {
          closeModal();

          searchInput.value = item.dataset.tag;
          searchInput.dispatchEvent(new Event("input"));

          scrollToSection("inicio");
        });
      });
    }

    else if (section === "salvos") {
      showSavedPosts();
    }

    else if (section === "perfil") {
      document.getElementById("profileButton").click();
    }

    else {
      openInfoPanel(section);
    }
  });
});

function showSavedPosts() {
  const posts = [...postsContainer.querySelectorAll(".post")];

  posts.forEach(post => {
    const id = post.dataset.postId ||
      `sample-${[...postsContainer.children].indexOf(post)}`;

    post.hidden = !savedPosts.has(id);
  });

  showToast(
    savedPosts.size
      ? "Mostrando publicações salvas nesta sessão."
      : "Você ainda não salvou publicações."
  );

  if (!savedPosts.size) {
    posts.forEach(post => post.hidden = false);
  } else {
    scrollToSection("inicio");
  }
}

function applyFeedFilter() {
  const posts = [...postsContainer.querySelectorAll(".post")];

  posts.forEach(post => post.hidden = false);

  if (currentFilter === "populares") {
    posts.sort((a, b) =>
      Number(b.dataset.likes || 0) - Number(a.dataset.likes || 0)
    );
  } else {
    posts.sort((a, b) =>
      Number(b.dataset.created || 0) - Number(a.dataset.created || 0)
    );
  }

  posts.forEach(post => postsContainer.appendChild(post));
}

document.getElementById("feedFilter").addEventListener("change", event => {
  currentFilter = event.target.value;

  applyFeedFilter();

  showToast(
    currentFilter === "populares"
      ? "Feed ordenado pelas publicações mais populares."
      : "Feed ordenado pelas mais recentes."
  );
});

searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  let visible = 0;

  [...postsContainer.querySelectorAll(".post")].forEach(post => {
    const match = post.textContent.toLocaleLowerCase("pt-BR").includes(term);

    post.hidden = !match;

    if (match) visible++;
  });

  if (term) {
    showToast(
      visible
        ? `${visible} publicação(ões) encontrada(s).`
        : "Nenhuma publicação encontrada."
    );
  }
});

searchInput.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input"));
  }
});

document.querySelectorAll(".trend").forEach(trend => {
  trend.addEventListener("click", event => {
    event.preventDefault();

    const hashtag = trend.querySelector("strong")
      ?.textContent.replace("#", "") || "";

    searchInput.value = hashtag;

    searchInput.dispatchEvent(new Event("input"));

    scrollToSection("inicio");
  });
});

document.querySelectorAll(".right-footer a").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    const key = link.getAttribute("href").slice(1);

    openInfoPanel(key);
  });
});

document.querySelectorAll(".post-image").forEach(img => {
  img.tabIndex = 0;
  img.setAttribute("role", "button");
  img.setAttribute("aria-label", "Ampliar imagem da publicação");
});

postsContainer.addEventListener("click", event => {
  const image = event.target.closest(".post-image");

  if (image && !image.closest(".post")?.querySelector(".more-button")) return;

  if (image && !event.target.closest("button")) {
    openModal(
      "Imagem da publicação",
      `<img class="modal-image" src="${image.src}" alt="${escapeHTML(image.alt)}">`
    );
  }
});
