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

const savedPosts = new Set(
  JSON.parse(localStorage.getItem("connectSavedPosts") || "[]")
);

[...postsContainer.querySelectorAll(".post")].forEach((post, index) => {
  if (!post.dataset.postId) post.dataset.postId = `sample-${index + 1}`;
  if (!post.dataset.created) post.dataset.created = String(index + 1);
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
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
        <button type="button" id="removePreview" class="remove-preview">
          Remover foto ×
        </button>
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

  const current = Number(
    (counter.textContent.match(/\d+/) || [0])[0]
  );

  counter.textContent = `${current + amount} comentários`;
}

function makePost(text, image) {
  const post = document.createElement("article");

  post.className = "post card";
  post.dataset.likes = "0";
  post.dataset.created = String(Date.now());
  post.dataset.postId =
    `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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

    button.innerHTML =
      `${liked ? "♥" : "♡"} <span>${liked ? "Curtido" : "Curtir"}</span>`;

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
      <p class="modal-description">
        Escolha o que deseja fazer com esta publicação.
      </p>

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
        <p class="modal-description">
          Escolha uma imagem para criar seu momento.
        </p>

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

/* CONNECT BOT HUB — personagens virtuais com respostas automáticas locais */

const connectBots = [
  {
    id: "luna",
    name: "Luna",
    handle: "@luna_conecta",
    avatar: "https://i.pravatar.cc/100?img=47",
    about: "Gosta de conversar sobre o dia a dia, amizades e novidades.",
    style: "gentle"
  },
  {
    id: "theo",
    name: "Theo",
    handle: "@theo.tech",
    avatar: "https://i.pravatar.cc/100?img=12",
    about: "Curte tecnologia, jogos, programação e ideias novas.",
    style: "tech"
  },
  {
    id: "maya",
    name: "Maya",
    handle: "@maya.cria",
    avatar: "https://i.pravatar.cc/100?img=44",
    about: "Ama música, fotografia, criatividade e arte.",
    style: "creative"
  },
  {
    id: "nico",
    name: "Nico",
    handle: "@nico_online",
    avatar: "https://i.pravatar.cc/100?img=13",
    about: "Bem-humorado, curioso e sempre pronto para um papo.",
    style: "fun"
  }
];

const botStorageKey = "connectBotChatsV1";

let botChats = {};

try {
  botChats = JSON.parse(localStorage.getItem(botStorageKey) || "{}");
} catch {
  botChats = {};
}

let activeBotId = null;

function saveBotChats() {
  try {
    localStorage.setItem(botStorageKey, JSON.stringify(botChats));
  } catch {
    showToast("O navegador não conseguiu salvar o histórico desta conversa.");
  }
}

function getBot(id) {
  return connectBots.find(bot => bot.id === id) || connectBots[0];
}

function botTime() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function ensureBotChat(id) {
  if (!Array.isArray(botChats[id])) {
    const bot = getBot(id);

    botChats[id] = [
      {
        from: "bot",
        text: `Oi! Eu sou ${bot.name}, um assistente virtual do Connect. 😊 ${bot.about} Sobre o que você quer conversar?`,
        time: botTime()
      }
    ];

    saveBotChats();
  }

  return botChats[id];
}

function botReply(bot, message) {
  const text = message.toLocaleLowerCase("pt-BR");

  const has = (...words) => words.some(word => text.includes(word));

  if (has("oi", "olá", "ola", "e aí", "eai", "bom dia", "boa tarde", "boa noite")) {
    const greetings = {
      luna: [
        "Oii! Que bom receber sua mensagem! Como está sendo seu dia? 🌷",
        "Olá! 😊 Me conta, o que aconteceu de interessante hoje?"
      ],

      theo: [
        "Fala! Tudo certo por aí? Qual assunto vamos explorar? 💻",
        "Opa! Online e pronto para trocar ideias. O que manda?"
      ],

      maya: [
        "Oii! ✨ Que bom ter você por aqui. Como estão as coisas?",
        "Oláá! Me conta uma novidade ou uma ideia que está na sua cabeça! 🎨"
      ],

      nico: [
        "E aíí! 😄 Cheguei! Qual é a boa de hoje?",
        "Opa, tudo tranquilo? Bora conversar!"
      ]
    };

    const options = greetings[bot.id];

    return options[Math.floor(Math.random() * options.length)];
  }

  if (has("triste", "chatead", "difícil", "cansad", "ansios", "preocup")) {
    return "Poxa, sinto muito que as coisas não estejam tão leves agora. 💜 Se quiser, pode me contar um pouco mais. Posso te ouvir e pensar em ideias com você.";
  }

  if (has("feliz", "legal", "consegui", "conquista", "vitória", "vitoria", "passei")) {
    return "Aaa, que notícia boa! 🎉 Você merece comemorar suas conquistas. O que foi que aconteceu?";
  }

  if (has("escola", "prova", "estudo", "trabalho", "aula", "professor")) {
    return bot.id === "theo"
      ? "Podemos organizar isso por partes! Qual é a matéria ou o assunto? 🧠"
      : "Boa! Estudar fica mais fácil quando a gente divide em etapas. Qual matéria está ocupando seu tempo? 📚";
  }

  if (has("jogo", "game", "godot", "program", "código", "codigo", "site", "html", "javascript")) {
    return "Esse assunto é muito interessante! 💻 Você está criando alguma coisa ou quer aprender algo novo?";
  }

  if (has("música", "musica", "filme", "série", "serie", "livro", "foto", "fotografia", "desenho")) {
    return "Adoro quando a conversa vai para esse lado! ✨ O que você tem escutado, assistido ou criado ultimamente?";
  }

  if (has("obrigad", "valeu")) {
    return "Imagina! 😊 Foi muito bom conversar com você. Pode me chamar quando quiser trocar mais ideias.";
  }

  if (has("quem é você", "quem e voce", "é robô", "e robo", "robô", "robot", "ia")) {
    return `Eu sou ${bot.name}, um personagem virtual do Connect. Não sou uma pessoa real: respondo automaticamente por meio de regras de conversa programadas no site. 🤖`;
  }

  if (has("conselho", "ajuda", "opinião", "opiniao", "não sei", "nao sei")) {
    return "Vamos pensar juntos! Me explica um pouquinho melhor a situação e o que você gostaria que acontecesse. 💜";
  }

  const replies = {
    luna: [
      "Entendi! 💜 E como você se sentiu com isso?",
      "Que interessante! Me conta mais, quero entender direitinho. 😊",
      "Faz sentido. O que você acha que vai fazer a partir daqui?"
    ],

    theo: [
      "Boa questão! 🤔 Dá para olhar por alguns ângulos. Qual parte você quer explorar primeiro?",
      "Interessante! Se a gente dividir essa ideia em etapas, fica mais fácil. Qual é o próximo detalhe?",
      "Curti o assunto! Tem algum exemplo disso que aconteceu com você?"
    ],

    maya: [
      "Isso me deu uma ideia! ✨ Como você imaginaria essa situação de um jeito criativo?",
      "Gostei de saber disso! Tem algum detalhe que você ainda não contou? 🎨",
      "Às vezes uma conversa abre caminhos novos. O que mais passou pela sua cabeça?"
    ],

    nico: [
      "Hahaha, entendi! 😄 E aí, qual foi a melhor parte?",
      "Aí sim! Conta o resto, agora fiquei curioso. 👀",
      "Boa! Se essa história fosse um post, qual seria a legenda? 😂"
    ]
  };

  const options = replies[bot.id];

  return options[Math.floor(Math.random() * options.length)];
}

function renderBotChat(id) {
  const bot = getBot(id);
  const messages = ensureBotChat(id);

  activeBotId = id;

  openModal(`Conversa com ${bot.name}`, `
    <div class="bot-chat">

      <div class="bot-chat-head">
        <img src="${bot.avatar}" alt="">

        <div>
          <strong>
            ${bot.name}
            <span class="bot-label">ROBÔ</span>
          </strong>

          <small>● Assistente virtual online</small>
        </div>
      </div>

      <div class="bot-chat-log" id="botChatLog">
        ${messages.map(message => `
          <div class="bot-bubble ${message.from === "user" ? "mine" : "theirs"}">
            ${escapeHTML(message.text)}
            <span class="bot-time">${escapeHTML(message.time || "")}</span>
          </div>
        `).join("")}
      </div>

      <form class="bot-send-form" id="botSendForm">
        <input
          id="botMessageInput"
          maxlength="500"
          autocomplete="off"
          placeholder="Escreva uma mensagem para ${bot.name}..."
        >

        <button type="submit">Enviar</button>
      </form>

    </div>

    <p class="bot-disclaimer">
      Você está conversando com um personagem automatizado.
      As mensagens ficam salvas neste navegador.
    </p>
  `);

  const log = document.getElementById("botChatLog");

  log.scrollTop = log.scrollHeight;

  document.getElementById("botMessageInput").focus();

  document.getElementById("botSendForm").addEventListener("submit", event => {
    event.preventDefault();

    const input = document.getElementById("botMessageInput");
    const message = input.value.trim();

    if (!message) return;

    messages.push({
      from: "user",
      text: message,
      time: botTime()
    });

    saveBotChats();

    log.insertAdjacentHTML(
      "beforeend",
      `
        <div class="bot-bubble mine">
          ${escapeHTML(message)}
          <span class="bot-time">${botTime()}</span>
        </div>
      `
    );

    input.value = "";

    log.insertAdjacentHTML(
      "beforeend",
      `<div class="bot-typing" id="botTyping">${bot.name} está digitando...</div>`
    );

    log.scrollTop = log.scrollHeight;

    const reply = botReply(bot, message);

    setTimeout(() => {
      const typing = document.getElementById("botTyping");

      if (typing) typing.remove();

      messages.push({
        from: "bot",
        text: reply,
        time: botTime()
      });

      saveBotChats();

      if (document.getElementById("botChatLog")) {
        log.insertAdjacentHTML(
          "beforeend",
          `
            <div class="bot-bubble theirs">
              ${escapeHTML(reply)}
              <span class="bot-time">${botTime()}</span>
            </div>
          `
        );

        log.scrollTop = log.scrollHeight;
      }
    }, 900 + Math.random() * 900);
  });
}

function openBotDirectory() {
  openModal("Mensagens · Connect", `
    <p class="modal-description">
      Escolha um assistente virtual para iniciar ou continuar uma conversa.
    </p>

    <div class="bot-list">
      ${connectBots.map(bot => `
        <button type="button" class="bot-card" data-bot-id="${bot.id}">
          <img src="${bot.avatar}" alt="">

          <span class="bot-card-info">
            <strong>
              ${bot.name}
              <span class="bot-label">ROBÔ</span>
            </strong>

            <span>${bot.about}</span>
          </span>

          <span aria-hidden="true">›</span>
        </button>
      `).join("")}
    </div>

    <p class="bot-disclaimer">
      Os perfis desta lista são personagens automatizados, não usuários humanos.
    </p>
  `);

  modalRoot.querySelectorAll("[data-bot-id]").forEach(button => {
    button.addEventListener("click", () => {
      renderBotChat(button.dataset.botId);
    });
  });
}

const botLauncher = document.createElement("button");

botLauncher.type = "button";
botLauncher.className = "bot-launcher";

botLauncher.innerHTML = `
  <span class="bot-launcher-dot"></span>
  <span>Conversar com robôs</span> 💬
`;

botLauncher.addEventListener("click", openBotDirectory);

document.body.appendChild(botLauncher);

/* Substitui o atalho antigo de mensagens pela caixa de conversa com os bots. */
document.querySelectorAll('.nav-link[data-nav="mensagens"]').forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    document.querySelectorAll(".nav-link").forEach(item => {
      item.classList.remove("active");
    });

    link.classList.add("active");

    openBotDirectory();
  }, true);
});

/* Os assistentes podem reagir às novas publicações feitas pelo usuário. */
const botPostObserver = new MutationObserver(records => {
  records.forEach(record => {
    record.addedNodes.forEach(node => {
      if (!(node instanceof HTMLElement) || !node.classList.contains("post")) return;

      if (!node.querySelector(".post-author strong")?.textContent.includes("Alex")) return;

      if (node.dataset.botReacted === "true") return;

      node.dataset.botReacted = "true";

      const bot = connectBots[
        Math.floor(Math.random() * connectBots.length)
      ];

      setTimeout(() => {
        if (!node.isConnected) return;

        const likeButton = node.querySelector(".like-button");

        if (likeButton && !likeButton.classList.contains("liked")) {
          const count = Number(node.dataset.likes || 0) + 1;

          node.dataset.likes = String(count);

          const summary = node.querySelector(".like-summary");

          if (summary) {
            summary.textContent = `♥ ${count} curtidas`;
          }
        }

        const commentArea = node.querySelector(".comments-area");

        if (commentArea) {
          commentArea.hidden = false;

          const line = document.createElement("div");

          line.className = "sample-comment";

          line.innerHTML = `
            <strong>
              ${bot.name}
              <span class="bot-label">ROBÔ</span>:
            </strong>
            ${
              bot.id === "luna"
                ? "Que bom que você compartilhou isso com a gente! 💜"
                : bot.id === "theo"
                  ? "Ideia interessante! Gostei de ver essa publicação. 🚀"
                  : bot.id === "maya"
                    ? "Adorei a energia dessa publicação! ✨"
                    : "Aí sim! Já deixou o feed mais interessante. 😄"
            }
          `;

          commentArea.querySelector(".comment-list")?.appendChild(line);

          updateCommentCount(node);
        }
      }, 2200 + Math.random() * 1800);
    });
  });
});

botPostObserver.observe(postsContainer, {
  childList: true
});
