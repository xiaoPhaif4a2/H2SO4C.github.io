class PostShare extends HTMLElement {
  private listeners?: AbortController;
  private generation?: AbortController;
  private imageUrls: string[] = [];
  private previousOverflow?: string;

  connectedCallback() {
    this.listeners?.abort();
    this.listeners = new AbortController();
    const { signal } = this.listeners;
    const urlInput = this.querySelector<HTMLInputElement>("[data-share-url]")!;
    const status = this.querySelector<HTMLElement>("[data-share-status]")!;
    const dialog = this.querySelector<HTMLDialogElement>("dialog")!;
    const cardStatus = this.querySelector<HTMLElement>("[data-card-status]")!;
    const results = this.querySelector<HTMLElement>("[data-card-results]")!;
    const generate = this.querySelector<HTMLButtonElement>(
      "[data-generate-card]"
    )!;
    const retry = this.querySelector<HTMLButtonElement>("[data-retry-card]")!;
    const title = this.dataset.title ?? "文章";

    urlInput.addEventListener("click", () => urlInput.select(), { signal });
    this.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach(button => {
      button.hidden = false;
      button.addEventListener(
        "click",
        async () => {
          const text =
            button.dataset.copy === "url"
              ? urlInput.value
              : `【${title}】${urlInput.value}`;
          try {
            await copyText(text);
            status.textContent =
              button.dataset.copy === "url"
                ? "短链接已复制。"
                : "分享文案已复制。";
          } catch {
            status.textContent = `自动复制被浏览器拦截，请手动复制：${text}`;
          }
        },
        { signal }
      );
    });

    const native = this.querySelector<HTMLButtonElement>(
      "[data-native-share]"
    )!;
    native.hidden = typeof navigator.share !== "function";
    native.addEventListener(
      "click",
      async () => {
        try {
          await navigator.share({
            title,
            text: `【${title}】`,
            url: urlInput.value,
          });
        } catch (error) {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            status.textContent = "系统分享暂不可用，可以复制分享文案。";
          }
        }
      },
      { signal }
    );

    const buildCards = async () => {
      if (this.generation && !this.generation.signal.aborted) return;
      this.releaseImages();
      results.replaceChildren();
      retry.hidden = true;
      results.setAttribute("aria-busy", "true");
      const generation = new AbortController();
      this.generation = generation;
      const { signal: generationSignal } = generation;
      cardStatus.textContent = "正在整理全文与配图…";
      try {
        const { createArticleCards } = await import("./share-card");
        generationSignal.throwIfAborted();
        const { images, missingImages } = await createArticleCards(this, {
          signal: generationSignal,
          onProgress: text => (cardStatus.textContent = text),
        });
        generationSignal.throwIfAborted();
        const filename = title
          .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
          .slice(0, 80);
        images.forEach((blob, index) => {
          const url = URL.createObjectURL(blob);
          this.imageUrls.push(url);
          const figure = document.createElement("figure");
          figure.className = "share-result";
          const image = new Image();
          image.src = url;
          image.alt = `${title} · 正文长图 ${index + 1}/${images.length}`;
          const download = document.createElement("a");
          download.className = "share-download";
          download.href = url;
          download.download = `${filename}-${index + 1}.png`;
          download.textContent = `下载图片 ${index + 1}/${images.length}`;
          figure.append(download, image);
          results.append(figure);
        });
        cardStatus.textContent = `已生成 ${images.length} 张正文长图。${
          missingImages > 0
            ? `有 ${missingImages} 张配图无法读取，已保留提示，请扫码在原文查看。`
            : ""
        }`;
      } catch {
        if (!generationSignal.aborted) {
          cardStatus.textContent = "生成失败，请重试，或复制文章链接分享。";
          retry.hidden = false;
        }
      } finally {
        if (this.generation === generation) {
          this.generation = undefined;
          results.removeAttribute("aria-busy");
        }
      }
    };

    generate.hidden = false;
    generate.addEventListener(
      "click",
      () => {
        this.previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialog.showModal();
        if (this.imageUrls.length === 0) void buildCards();
      },
      { signal }
    );
    retry.addEventListener("click", () => void buildCards(), { signal });
    this.querySelector("[data-close-card]")!.addEventListener(
      "click",
      () => dialog.close(),
      { signal }
    );
    dialog.addEventListener(
      "close",
      () => {
        this.generation?.abort();
        this.restoreScroll();
      },
      { signal }
    );
  }

  disconnectedCallback() {
    this.listeners?.abort();
    this.generation?.abort();
    this.releaseImages();
    this.restoreScroll();
  }

  private restoreScroll() {
    if (this.previousOverflow === undefined) return;
    document.body.style.overflow = this.previousOverflow;
    this.previousOverflow = undefined;
  }

  private releaseImages() {
    this.imageUrls.forEach(url => URL.revokeObjectURL(url));
    this.imageUrls = [];
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const previousFocus = document.activeElement;
    const input = document.createElement("textarea");
    input.value = text;
    input.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.append(input);
    input.select();
    try {
      if (!document.execCommand("copy")) throw new Error("Copy failed");
    } finally {
      input.remove();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    }
  }
}

if (!customElements.get("post-share")) {
  customElements.define("post-share", PostShare);
}
