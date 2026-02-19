"use client";

import html2canvas from "html2canvas";
import type { CSSProperties, DragEvent, PointerEvent, RefObject } from "react";
import { useMemo, useRef, useState } from "react";

type PhotoSlot = {
  url: string;
  name: string;
  position: { x: number; y: number };
  size?: number;
  type?: string;
};

type TextSticker = {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: number;
  tone: "accent" | "ink";
};

type Theme = {
  id: string;
  name: string;
  background: string;
  accent: string;
  shadow: string;
};

const themes: Theme[] = [
  {
    id: "sunrise",
    name: "Sunrise Parade",
    background:
      "radial-gradient(circle at 12% 20%, rgba(255,255,255,0.65), rgba(255,255,255,0) 58%), linear-gradient(135deg, #ffd6a5 0%, #ffcad4 40%, #cdb4db 100%)",
    accent: "#ff6b6b",
    shadow: "0 30px 70px rgba(255, 155, 141, 0.45)",
  },
  {
    id: "sorbet",
    name: "Sorbet Pop",
    background:
      "radial-gradient(circle at 80% 15%, rgba(255,255,255,0.55), rgba(255,255,255,0) 50%), linear-gradient(130deg, #b8f2e6 0%, #fef6e4 45%, #f7d9d9 100%)",
    accent: "#2d6a4f",
    shadow: "0 28px 60px rgba(101, 200, 170, 0.4)",
  },
  {
    id: "night",
    name: "Berry Night",
    background:
      "radial-gradient(circle at 10% 15%, rgba(255,255,255,0.2), rgba(255,255,255,0) 45%), linear-gradient(135deg, #2f2244 0%, #5f0f40 40%, #f04e98 100%)",
    accent: "#ffe066",
    shadow: "0 30px 70px rgba(40, 10, 50, 0.6)",
  },
];

const layouts = [
  {
    id: "duo",
    name: "Split Duo",
    description: "Two photos stacked with a message panel.",
  },
  {
    id: "focus",
    name: "Hero Focus",
    description: "One bold photo with a smaller cameo.",
  },
];

const cardSizes = [
  {
    id: "standard",
    name: "Standard",
    description: "Balanced preview size.",
    previewMaxWidth: 520,
    downloadScale: 2,
  },
  {
    id: "large",
    name: "Large",
    description: "Bigger preview + sharper export.",
    previewMaxWidth: 620,
    downloadScale: 2.5,
  },
  {
    id: "xlarge",
    name: "Extra",
    description: "Largest preview + ultra export.",
    previewMaxWidth: 720,
    downloadScale: 3,
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const defaultMessage =
  "Wishing you a year filled with confetti moments, brave dreams, and extra dessert.";

const createSlot = (url: string, file: File): PhotoSlot => ({
  url,
  name: file.name,
  size: file.size,
  type: file.type,
  position: { x: 50, y: 50 },
});

const createSticker = (text = "Your text"): TextSticker => ({
  id: `sticker-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  text,
  position: { x: 70, y: 20 },
  size: 18,
  tone: "accent",
});

const formatBytes = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getPhotoGrid = (count: number) => {
  const safeCount = Math.max(1, count);
  const columns = safeCount <= 1 ? 1 : safeCount <= 4 ? 2 : 3;
  const rows = Math.ceil(safeCount / columns);
  return { columns, rows };
};

type DraggableImageProps = {
  slot: PhotoSlot | null;
  className?: string;
  placeholder: string;
  onPositionChange?: (pos: { x: number; y: number }) => void;
};

function DraggableImage({
  slot,
  className,
  placeholder,
  onPositionChange,
}: DraggableImageProps) {
  const [dragging, setDragging] = useState(false);

  const updatePosition = (
    event: PointerEvent<HTMLDivElement>,
    target: HTMLDivElement,
  ) => {
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    onPositionChange?.({ x: clamp(x, 0, 100), y: clamp(y, 0, 100) });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!slot) return;
    const target = event.currentTarget;
    setDragging(true);
    target.setPointerCapture(event.pointerId);
    updatePosition(event, target);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!slot || !dragging) return;
    updatePosition(event, event.currentTarget);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/60 bg-white/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] ${
        dragging ? "ring-2 ring-black/40" : ""
      } ${className ?? ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      {slot ? (
        <img
          src={slot.url}
          alt={slot.name}
          className="h-full w-full select-none object-cover"
          style={{
            objectPosition: `${slot.position.x}% ${slot.position.y}%`,
          }}
          crossOrigin="anonymous"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-xs font-medium text-black/50">
          <span className="uppercase tracking-[0.3em]">{placeholder}</span>
          <span className="text-[11px] normal-case tracking-normal">
            Upload to drop a photo here
          </span>
        </div>
      )}
    </div>
  );
}

type DraggableTextProps = {
  sticker: TextSticker;
  containerRef: RefObject<HTMLDivElement | null>;
  color: string;
  onPositionChange: (pos: { x: number; y: number }) => void;
};

function DraggableText({
  sticker,
  containerRef,
  color,
  onPositionChange,
}: DraggableTextProps) {
  const [dragging, setDragging] = useState(false);

  const updatePosition = (event: PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    onPositionChange({ x: clamp(x, 0, 100), y: clamp(y, 0, 100) });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePosition(event);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updatePosition(event);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className={`absolute z-20 cursor-grab select-none rounded-full border border-white/60 bg-white/40 px-3 py-1 text-sm shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition ${
        dragging ? "cursor-grabbing ring-2 ring-black/40" : ""
      }`}
      style={{
        left: `${sticker.position.x}%`,
        top: `${sticker.position.y}%`,
        transform: "translate(-50%, -50%)",
        fontSize: `${sticker.size}px`,
        color,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {sticker.text}
    </div>
  );
}

export default function Home() {
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [themeId, setThemeId] = useState(themes[0].id);
  const [layoutId, setLayoutId] = useState(layouts[0].id);
  const [cardSizeId, setCardSizeId] = useState(cardSizes[0].id);
  const [photos, setPhotos] = useState<(PhotoSlot | null)[]>([
    null,
    null,
  ]);
  const [uploading, setUploading] = useState<boolean[]>([false, false]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [stickers, setStickers] = useState<TextSticker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const theme = useMemo(
    () => themes.find((item) => item.id === themeId) ?? themes[0],
    [themeId],
  );

  const cardSize = useMemo(
    () => cardSizes.find((item) => item.id === cardSizeId) ?? cardSizes[0],
    [cardSizeId],
  );

  const previewWidthStyle = useMemo(
    () =>
      ({ "--preview-width": `${cardSize.previewMaxWidth}px` } as CSSProperties),
    [cardSize.previewMaxWidth],
  );

  const photoGrid = useMemo(
    () => getPhotoGrid(photos.length),
    [photos.length],
  );

  const photoGridStyle = useMemo(
    () =>
      ({
        gridTemplateColumns: `repeat(${photoGrid.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${photoGrid.rows}, minmax(0, 1fr))`,
      }) as CSSProperties,
    [photoGrid.columns, photoGrid.rows],
  );

  const secondaryPhotos = useMemo(() => photos.slice(1), [photos]);

  const secondaryGrid = useMemo(
    () => getPhotoGrid(secondaryPhotos.length),
    [secondaryPhotos.length],
  );

  const secondaryGridStyle = useMemo(
    () =>
      ({
        gridTemplateColumns: `repeat(${secondaryGrid.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${secondaryGrid.rows}, minmax(0, 1fr))`,
      }) as CSSProperties,
    [secondaryGrid.columns, secondaryGrid.rows],
  );

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const imagekitPublicKey =
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ?? "";

  const updatePhotoPosition = (index: number, position: PhotoSlot["position"]) => {
    setPhotos((prev) =>
      prev.map((slot, slotIndex) =>
        slotIndex === index && slot ? { ...slot, position } : slot,
      ),
    );
  };

  const updateSticker = (id: string, updates: Partial<TextSticker>) => {
    setStickers((prev) =>
      prev.map((sticker) =>
        sticker.id === id ? { ...sticker, ...updates } : sticker,
      ),
    );
  };

  const handleAddPhotoSlot = () => {
    setPhotos((prev) => [...prev, null]);
    setUploading((prev) => [...prev, false]);
  };

  const handleAddSticker = () => {
    setStickers((prev) => [...prev, createSticker()]);
  };

  const handleRemoveSticker = (id: string) => {
    setStickers((prev) => prev.filter((sticker) => sticker.id !== id));
  };

  const swapPhotos = () => {
    setPhotos((prev) => {
      if (prev.length < 2) return prev;
      const next = [...prev];
      [next[0], next[1]] = [next[1], next[0]];
      return next;
    });
  };

  const handleRemove = (index: number) => {
    setPhotos((prev) => {
      if (prev.length <= 2) {
        return prev.map((slot, slotIndex) =>
          slotIndex === index ? null : slot,
        );
      }
      return prev.filter((_, slotIndex) => slotIndex !== index);
    });
    setUploading((prev) => {
      if (prev.length <= 2) {
        return prev.map((value, slotIndex) =>
          slotIndex === index ? false : value,
        );
      }
      return prev.filter((_, slotIndex) => slotIndex !== index);
    });
    setDragOverIndex((prev) => (prev === index ? null : prev));
  };

  const handleUpload = async (index: number, file: File | null) => {
    if (!file) return;
    setError(null);

    if (!imagekitPublicKey) {
      setError(
        "Missing ImageKit public key. Add NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY in client .env.local.",
      );
      return;
    }

    try {
      setUploading((prev) =>
        prev.map((value, slotIndex) =>
          slotIndex === index ? true : value,
        ),
      );
      const authResponse = await fetch(`${apiUrl}/auth`);
      if (!authResponse.ok) {
        throw new Error("ImageKit auth failed. Is the server running?");
      }
      const authData = await authResponse.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("publicKey", imagekitPublicKey);
      formData.append("signature", authData.signature);
      formData.append("token", authData.token);
      formData.append("expire", String(authData.expire));
      formData.append("folder", "/birthday-cards");
      formData.append("useUniqueFileName", "true");

      const uploadResponse = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData?.message ?? "Upload failed.");
      }

      setPhotos((prev) =>
        prev.map((slot, slotIndex) =>
          slotIndex === index ? createSlot(uploadData.url, file) : slot,
        ),
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed. Try again.",
      );
    } finally {
      setUploading((prev) =>
        prev.map((value, slotIndex) =>
          slotIndex === index ? false : value,
        ),
      );
    }
  };

  const handleDrop = (index: number, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOverIndex(null);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleUpload(index, file);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        useCORS: true,
        scale: cardSize.downloadScale,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${recipient || "birthday-card"}.png`;
      link.click();
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Download failed. Try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6efe6] text-[#1b1b1b]">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(255,255,255,0)_55%),_radial-gradient(circle_at_80%_30%,_rgba(255,255,255,0.4),_rgba(255,255,255,0)_65%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:px-10">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-black/60">
                Birthday Card Studio
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                Build a personalized birthday card in minutes.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/70">
                Add a name, upload photos to ImageKit, drag to position them, and
                write a custom message. When it feels right, download a high-res
                card in one tap.
              </p>
            </div>
            <div className="rounded-3xl border border-black/10 bg-white/70 px-5 py-4 text-xs uppercase tracking-[0.3em] text-black/60 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
              One font. Infinite vibes.
            </div>
          </header>

          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
            <section className="flex flex-col gap-6">
              <div className="rounded-[28px] border border-black/10 bg-white/80 px-6 py-6 shadow-[0_24px_50px_rgba(0,0,0,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                      Step 1
                    </p>
                    <h2 className="mt-2 text-lg font-semibold">
                      Name & message
                    </h2>
                  </div>
                </div>
                <div className="mt-6 grid gap-4">
                  <label className="text-xs uppercase tracking-[0.25em] text-black/60">
                    Recipient name
                  </label>
                  <input
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder="e.g. Priya"
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/40"
                  />
                  <label className="text-xs uppercase tracking-[0.25em] text-black/60">
                    From
                  </label>
                  <input
                    value={sender}
                    onChange={(event) => setSender(event.target.value)}
                    placeholder="Your name"
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/40"
                  />
                  <label className="text-xs uppercase tracking-[0.25em] text-black/60">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={4}
                    className="resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black/40"
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white/80 px-6 py-6 shadow-[0_24px_50px_rgba(0,0,0,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                      Step 2
                    </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Upload photos
                  </h2>
                  <p className="mt-2 text-xs text-black/60">
                      Upload to ImageKit, drag inside the frame to reposition, or
                      drop a file straight onto a slot.
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4">
                  {photos.map((slot, slotIndex) => {
                    return (
                      <div
                        key={`photo-slot-${slotIndex}`}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverIndex(slotIndex);
                        }}
                        onDragLeave={() => setDragOverIndex(null)}
                        onDrop={(event) => handleDrop(slotIndex, event)}
                        className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition ${
                          dragOverIndex === slotIndex
                            ? "border-black/40 bg-black/5"
                            : "border-black/10 bg-white/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-[0.25em] text-black/60">
                            Photo {slotIndex + 1}
                          </p>
                          {slot ? (
                            <button
                              onClick={() => handleRemove(slotIndex)}
                              className="text-xs uppercase tracking-[0.2em] text-black/50 transition hover:text-black"
                            >
                              {photos.length > 2 ? "Remove slot" : "Remove"}
                            </button>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-black/10 bg-white">
                            {slot ? (
                              <img
                                src={slot.url}
                                alt={slot.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-black/40">
                                Empty
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                handleUpload(
                                  slotIndex,
                                  event.target.files?.[0] ?? null,
                                )
                              }
                              className="text-xs text-black/70"
                            />
                            <div className="flex flex-wrap gap-2 text-[11px] text-black/50">
                              <span>{slot?.type ?? "PNG, JPG, WEBP"}</span>
                              <span>|</span>
                              <span>{formatBytes(slot?.size)}</span>
                            </div>
                          </div>
                        </div>
                        {uploading[slotIndex] ? (
                          <p className="text-xs text-black/60">Uploading...</p>
                        ) : slot ? (
                          <p className="text-xs text-black/60">
                            Uploaded: {slot.name}
                          </p>
                        ) : (
                          <p className="text-xs text-black/50">
                            Tip: Drop a file here to upload faster.
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={swapPhotos}
                      disabled={photos.length < 2}
                      className="rounded-full border border-black/20 px-4 py-3 text-xs uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Swap first two photos
                    </button>
                    <button
                      onClick={handleAddPhotoSlot}
                      className="flex items-center gap-3 rounded-full border border-black/20 px-4 py-3 text-xs uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/30 text-base leading-none">
                        +
                      </span>
                      Add photo
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white/80 px-6 py-6 shadow-[0_24px_50px_rgba(0,0,0,0.08)]">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                    Step 3
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Layout & theme
                  </h2>
                </div>
                <div className="mt-6 grid gap-4">
                  <div className="grid gap-3">
                    {layouts.map((layout) => (
                      <label
                        key={layout.id}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                          layoutId === layout.id
                            ? "border-black/40 bg-black/5"
                            : "border-black/10 bg-white"
                        }`}
                      >
                        <span>
                          <span className="font-semibold">{layout.name}</span>
                          <span className="mt-1 block text-xs text-black/60">
                            {layout.description}
                          </span>
                        </span>
                        <input
                          type="radio"
                          name="layout"
                          value={layout.id}
                          checked={layoutId === layout.id}
                          onChange={() => setLayoutId(layout.id)}
                          className="h-4 w-4 accent-black"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="grid gap-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-black/60">
                      Card size
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {cardSizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setCardSizeId(size.id)}
                          className={`rounded-2xl border px-3 py-3 text-left text-xs uppercase tracking-[0.2em] transition ${
                            cardSizeId === size.id
                              ? "border-black/50 bg-black/5"
                              : "border-black/10 bg-white"
                          }`}
                        >
                          <span className="block text-[11px] text-black/70">
                            {size.name}
                          </span>
                          <span className="mt-1 block text-[10px] normal-case tracking-normal text-black/50">
                            {size.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {themes.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setThemeId(item.id)}
                        className={`rounded-2xl border px-3 py-3 text-left text-xs uppercase tracking-[0.2em] transition ${
                          themeId === item.id
                            ? "border-black/50 bg-black/5"
                            : "border-black/10 bg-white"
                        }`}
                      >
                        <div
                          className="h-12 w-full rounded-xl"
                          style={{ background: item.background }}
                        />
                        <span className="mt-2 block text-[11px] text-black/70">
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white/80 px-6 py-6 shadow-[0_24px_50px_rgba(0,0,0,0.08)]">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                    Step 4
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Custom text stickers
                  </h2>
                  <p className="mt-2 text-xs text-black/60">
                    Add extra text and drag it anywhere on the card preview.
                  </p>
                </div>
                <div className="mt-6 grid gap-4">
                  {stickers.map((sticker, index) => (
                    <div
                      key={sticker.id}
                      className="rounded-2xl border border-black/10 bg-white/80 px-4 py-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.25em] text-black/60">
                          Sticker {index + 1}
                        </p>
                        <button
                          onClick={() => handleRemoveSticker(sticker.id)}
                          className="text-xs uppercase tracking-[0.2em] text-black/50 transition hover:text-black"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3">
                        <input
                          value={sticker.text}
                          onChange={(event) =>
                            updateSticker(sticker.id, {
                              text: event.target.value,
                            })
                          }
                          placeholder="Write your custom text"
                          className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm outline-none transition focus:border-black/40"
                        />
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <label className="text-black/60">Size</label>
                          <input
                            type="range"
                            min={12}
                            max={36}
                            value={sticker.size}
                            onChange={(event) =>
                              updateSticker(sticker.id, {
                                size: Number(event.target.value),
                              })
                            }
                            className="w-32 accent-black"
                          />
                          <span className="text-black/60">
                            {sticker.size}px
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-black/60">Tone</span>
                          <button
                            onClick={() =>
                              updateSticker(sticker.id, { tone: "accent" })
                            }
                            className={`rounded-full border px-3 py-1 uppercase tracking-[0.2em] ${
                              sticker.tone === "accent"
                                ? "border-black/40 bg-black/5"
                                : "border-black/10 bg-white"
                            }`}
                          >
                            Accent
                          </button>
                          <button
                            onClick={() =>
                              updateSticker(sticker.id, { tone: "ink" })
                            }
                            className={`rounded-full border px-3 py-1 uppercase tracking-[0.2em] ${
                              sticker.tone === "ink"
                                ? "border-black/40 bg-black/5"
                                : "border-black/10 bg-white"
                            }`}
                          >
                            Ink
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleAddSticker}
                    disabled={stickers.length >= 3}
                    className="rounded-full border border-black/20 px-4 py-3 text-xs uppercase tracking-[0.3em] text-black/70 transition hover:border-black/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add text sticker
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white/90 px-6 py-5 shadow-[0_24px_50px_rgba(0,0,0,0.08)]">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full rounded-full bg-black px-6 py-4 text-xs uppercase tracking-[0.35em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/50"
                >
                  {downloading ? "Preparing download..." : "Download card"}
                </button>
                {error ? (
                  <p className="mt-3 text-xs text-red-600">{error}</p>
                ) : null}
              </div>
            </section>

            <section
              className="flex flex-col gap-6 sticky top-10 self-start w-full lg:w-[var(--preview-width)]"
              style={previewWidthStyle}
            >
              <div className="rounded-[32px] border border-black/10 bg-white/60 p-5 shadow-[0_24px_50px_rgba(0,0,0,0.08)]">
                <div className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Preview
                </div>
                <div className="mx-auto w-full">
                  <div
                    ref={cardRef}
                    className="relative mt-4 aspect-[3/2] w-full overflow-hidden rounded-[28px] border border-white/70 p-5"
                    style={{
                      background: theme.background,
                      boxShadow: theme.shadow,
                    }}
                  >
                    <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/30 blur-2xl" />
                    <div className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
                    <div className="relative z-10 grid h-full grid-cols-5 gap-4">
                    {layoutId === "duo" ? (
                      <>
                        <div
                          className="col-span-3 grid h-full gap-4"
                          style={photoGridStyle}
                        >
                          {photos.map((slot, index) => (
                            <DraggableImage
                              key={`preview-photo-${index}`}
                              slot={slot}
                              placeholder={`Photo ${index + 1}`}
                              onPositionChange={(pos) =>
                                updatePhotoPosition(index, pos)
                              }
                            />
                          ))}
                        </div>
                        <div className="col-span-2 flex flex-col justify-between">
                          <div>
                            <p
                              className="text-xs uppercase tracking-[0.45em]"
                                style={{ color: theme.accent }}
                              >
                                Birthday
                              </p>
                              <h2 className="mt-3 text-2xl font-semibold leading-tight">
                                Happy Birthday
                                <br />
                                {recipient || "Your Friend"}
                              </h2>
                              <div
                                className="mt-4 rounded-2xl border border-dashed px-3 py-3 text-xs leading-relaxed"
                                style={{ borderColor: theme.accent }}
                              >
                                {message || "Type your birthday message here."}
                              </div>
                            </div>
                            <div className="text-xs uppercase tracking-[0.3em] text-black/60">
                              From {sender || "You"}
                            </div>
                          </div>
                        </>
                    ) : (
                      <>
                        <div
                          className="col-span-3 grid h-full gap-4"
                          style={{
                            gridTemplateRows:
                              secondaryPhotos.length > 0
                                ? "minmax(0, 2fr) minmax(0, 1fr)"
                                : "minmax(0, 1fr)",
                          }}
                        >
                          <DraggableImage
                            slot={photos[0] ?? null}
                            placeholder="Hero Photo"
                            onPositionChange={(pos) =>
                              updatePhotoPosition(0, pos)
                            }
                            className="h-full"
                          />
                          {secondaryPhotos.length > 0 ? (
                            <div
                              className="grid h-full gap-3"
                              style={secondaryGridStyle}
                            >
                              {secondaryPhotos.map((slot, index) => (
                                <DraggableImage
                                  key={`secondary-photo-${index}`}
                                  slot={slot}
                                  placeholder={`Photo ${index + 2}`}
                                  onPositionChange={(pos) =>
                                    updatePhotoPosition(index + 1, pos)
                                  }
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="col-span-2 flex flex-col justify-between">
                          <div>
                            <p
                              className="text-xs uppercase tracking-[0.45em]"
                                style={{ color: theme.accent }}
                              >
                                Celebrate
                              </p>
                              <h2 className="mt-3 text-2xl font-semibold leading-tight">
                                {recipient || "Birthday Star"}
                              </h2>
                              <div
                                className="mt-4 rounded-2xl border border-dashed px-3 py-3 text-xs leading-relaxed"
                                style={{ borderColor: theme.accent }}
                              >
                                {message || "Type your birthday message here."}
                              </div>
                            </div>
                            <div className="text-xs uppercase tracking-[0.3em] text-black/60">
                              From {sender || "You"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {stickers.map((sticker) => (
                      <DraggableText
                        key={sticker.id}
                        sticker={sticker}
                        containerRef={cardRef}
                        color={
                          sticker.tone === "accent"
                            ? theme.accent
                            : "rgba(20,20,20,0.85)"
                        }
                        onPositionChange={(pos) =>
                          updateSticker(sticker.id, { position: pos })
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 text-xs text-black/60">
                  Drag inside a photo to reposition. Use Swap to switch photo
                  placement.
                </div>
              </div>

              <div className="rounded-[28px] border border-black/10 bg-white/80 px-6 py-5 text-xs text-black/70 shadow-[0_24px_50px_rgba(0,0,0,0.08)]">
                Tip: For best quality, use a photo wider than 1200px. The download
                button exports a PNG that matches the preview ratio.
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
