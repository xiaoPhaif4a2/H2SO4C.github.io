import { toBlob } from "html-to-image";

const WIDTH = 720;

type Options = {
  signal: AbortSignal;
  onProgress: (message: string) => void;
};

/** Render an isolated copy; expanding details and wrapping code never changes the post. */
export async function createArticleCard(root: HTMLElement, options: Options) {
  const { signal, onProgress } = options;
  const original = document.getElementById("article");
  if (!original) throw new Error("Article not found");
  const article = original.cloneNode(true) as HTMLElement;
  article.removeAttribute("id");
  article.className = "app-prose share-card-body";
  article
    .querySelectorAll("script, style, .copy-code, .heading-link")
    .forEach(el => el.remove());
  article.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
  article.querySelectorAll("details").forEach(el => (el.open = true));
  article.querySelectorAll("audio, video, iframe").forEach(el => {
    const note = document.createElement("p");
    note.className = "share-media-note";
    note.textContent = `${el.getAttribute("title") || (el.tagName === "AUDIO" ? "音频" : "视频 / 嵌入内容")}：请扫码在原文中播放或查看。`;
    el.replaceWith(note);
  });

  const frame = document.createElement("div");
  frame.className = "share-capture";
  frame.setAttribute("data-theme", "light");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${WIDTH}px;overflow:hidden;pointer-events:none`;
  const content = document.createElement("div");
  content.className = "share-card-content";
  const header = root.querySelector<HTMLTemplateElement>("[data-card-header]")!;
  const footer = root.querySelector<HTMLTemplateElement>("[data-card-footer]")!;
  content.append(
    header.content.cloneNode(true),
    article,
    footer.content.cloneNode(true)
  );
  frame.append(content);

  let missingImages = 0;
  const sourceImages = original.querySelectorAll("img");
  const images = article.querySelectorAll("img");
  // Embed first so CORS failures become visible notes instead of blank images.
  await Promise.all(
    Array.from(images, async (image, index) => {
      signal.throwIfAborted();
      const source = sourceImages[index].currentSrc || sourceImages[index].src;
      try {
        const response = await fetch(source, {
          signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
        });
        if (!response.ok) throw new Error("Image fetch failed");
        const blob = await response.blob();
        image.removeAttribute("srcset");
        image.removeAttribute("sizes");
        image
          .closest("picture")
          ?.querySelectorAll("source")
          .forEach(el => el.remove());
        image.src = await blobDataUrl(blob);
        image.loading = "eager";
        image.removeAttribute("height");
        await image.decode();
      } catch {
        signal.throwIfAborted();
        missingImages++;
        const note = document.createElement("p");
        note.className = "share-media-note";
        note.textContent = `配图${image.alt ? `「${image.alt}」` : ""}无法载入，请扫码在原文查看。`;
        image.replaceWith(note);
      }
    })
  );

  signal.throwIfAborted();
  document.body.append(frame);
  try {
    await document.fonts.ready;
    await Promise.all(
      Array.from(content.querySelectorAll("img"), image => image.decode())
    );
    signal.throwIfAborted();
    const height = Math.ceil(content.getBoundingClientRect().height);
    onProgress("正在生成完整长图…");
    frame.style.height = `${height}px`;
    // Keep the entire article in one image; scale uniformly for very large canvases.
    const pixelRatio = Math.min(
      1.5,
      16384 / height,
      Math.sqrt(16000000 / (WIDTH * height))
    );
    const image = await toBlob(frame, {
      width: WIDTH,
      height,
      pixelRatio,
      backgroundColor: "#fdfbf6",
      skipFonts: true,
      // Reset both physical and logical offscreen offsets in the exported clone.
      style: {
        position: "relative",
        left: "0",
        top: "0",
        right: "auto",
        bottom: "auto",
        insetInlineStart: "0",
        insetInlineEnd: "auto",
        insetBlockStart: "0",
        insetBlockEnd: "auto",
      },
    });
    if (!image) throw new Error("Canvas export failed");
    signal.throwIfAborted();
    return { image, missingImages };
  } finally {
    frame.remove();
  }
}

function blobDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
