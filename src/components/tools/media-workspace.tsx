import { useRef, useState, type ChangeEvent } from "react";
import { Download, ImagePlus, Pipette, Scissors, ShieldCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageResizer } from "@/components/tools/image-resizer";
import { canvasBlob, downloadBlob, loadImage, validateFile } from "@/lib/tools/files";

type ImageToolId = "carousel-splitter" | "color-picker" | "exif-stripper";

export function MediaWorkspace({ id }: { id: string }) {
  if (id === "media-converter") return <MediaConverter />;
  if (id === "image-resizer") return <ImageResizer />;
  return <ImageWorkspace id={id as ImageToolId} />;
}

function ImageWorkspace({ id }: { id: ImageToolId }) {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [count, setCount] = useState(3);
  const [color, setColor] = useState("");
  const [slides, setSlides] = useState<Blob[]>([]);
  const [error, setError] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (!next) return;
    try {
      validateFile(next, "image");
      if (source) URL.revokeObjectURL(source);
      setFile(next);
      setSource(URL.createObjectURL(next));
      setError("");
      setSlides([]);
      setColor("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Choose a supported image.");
    }
  }

  async function exportCleanPng() {
    if (!file) return;
    setError("");
    try {
      const image = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare this image.");
      context.drawImage(image, 0, 0);
      const blob = await canvasBlob(canvas, "image/png");
      downloadBlob(blob, `${file.name.replace(/\.[^.]+$/, "")}-clean.png`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not export this image.");
    }
  }

  async function splitCarousel() {
    if (!file) return;
    setError("");
    try {
      const image = await loadImage(file);
      const total = Math.max(2, Math.min(10, Math.floor(count)));
      const segmentWidth = Math.ceil(image.naturalWidth / total);
      const outputs: Blob[] = [];
      for (let index = 0; index < total; index += 1) {
        const cropWidth = Math.min(segmentWidth, image.naturalWidth - index * segmentWidth);
        const canvas = document.createElement("canvas");
        canvas.width = cropWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Your browser could not prepare these slides.");
        context.drawImage(
          image,
          index * segmentWidth,
          0,
          cropWidth,
          image.naturalHeight,
          0,
          0,
          cropWidth,
          image.naturalHeight,
        );
        outputs.push(await canvasBlob(canvas));
      }
      setSlides(outputs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not split this image.");
    }
  }

  function sampleColor(event: React.MouseEvent<HTMLImageElement>) {
    const image = imageRef.current;
    if (!image) return;
    const bounds = image.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(
        image.naturalWidth - 1,
        Math.floor(((event.clientX - bounds.left) * image.naturalWidth) / bounds.width),
      ),
    );
    const y = Math.max(
      0,
      Math.min(
        image.naturalHeight - 1,
        Math.floor(((event.clientY - bounds.top) * image.naturalHeight) / bounds.height),
      ),
    );
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(image, 0, 0);
    const pixel = context.getImageData(x, y, 1, 1).data;
    setColor(
      `#${[pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0]
        .map((part) => part.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()}`,
    );
  }

  return (
    <div className="tool-panel">
      <label className="dropzone flex flex-col items-center gap-3 cursor-pointer">
        <ImagePlus size={30} />
        <strong>{file?.name ?? "Choose an image from your device"}</strong>
        <span className="text-sm text-muted-foreground">
          PNG, JPG, WebP or GIF · processed on this device
        </span>
        <input
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={chooseImage}
        />
      </label>
      {source && (
        <img
          ref={imageRef}
          src={source}
          alt="Selected image preview"
          onLoad={(event) => {
            const image = event.currentTarget;
            setWidth(image.naturalWidth);
            setHeight(image.naturalHeight);
          }}
          onClick={id === "color-picker" ? sampleColor : undefined}
          className="image-canvas"
        />
      )}
      {file && (
        <>
          <p className="text-sm text-muted-foreground">
            Original size: {width.toLocaleString()} × {height.toLocaleString()} px
          </p>
          {id === "exif-stripper" && (
            <>
              <p className="mt-5">
                Re-export a clean PNG without embedded camera or location metadata.
              </p>
              <Button className="mt-4" variant="tool" onClick={() => void exportCleanPng()}>
                <ShieldCheck />
                Download metadata-free PNG
              </Button>
            </>
          )}
          {id === "carousel-splitter" && (
            <>
              <div className="control-row">
                <label className="field">
                  Number of slides (2–10)
                  <input
                    className="form-input max-w-36"
                    type="number"
                    min={2}
                    max={10}
                    value={count}
                    onChange={(event) =>
                      setCount(Math.max(2, Math.min(10, Number(event.target.value))))
                    }
                  />
                </label>
                <Button variant="tool" onClick={() => void splitCarousel()}>
                  <Scissors />
                  Split into slides
                </Button>
              </div>
              {slides.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {slides.map((blob, index) => (
                    <div className="thread-post" key={index}>
                      <img
                        alt={`Slide ${index + 1}`}
                        className="w-full aspect-square object-cover"
                        src={URL.createObjectURL(blob)}
                      />
                      <p className="my-2 font-semibold">Slide {index + 1}</p>
                      <Button
                        variant="paper"
                        onClick={() =>
                          downloadBlob(blob, `slide-${String(index + 1).padStart(2, "0")}.png`)
                        }
                      >
                        <Download />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {id === "color-picker" && (
            <div className="control-row">
              <Pipette />
              <span>Click anywhere on the image to sample its color.</span>
              {color && (
                <>
                  <strong className="text-xl">{color}</strong>
                  <Button variant="paper" onClick={() => void navigator.clipboard.writeText(color)}>
                    Copy hex
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}
      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function MediaConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mediaRef = useRef<HTMLMediaElement>(null);
  const [converted, setConverted] = useState<Blob | null>(null);

  function chooseMedia(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (!next) return;
    try {
      validateFile(next, "media");
      if (source) URL.revokeObjectURL(source);
      setFile(next);
      setSource(URL.createObjectURL(next));
      setConverted(null);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Choose a recording.");
    }
  }

  async function convert() {
    const media = mediaRef.current;
    if (!media || !file) return;
    const mediaElement = media as HTMLMediaElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const captureStream = mediaElement.captureStream ?? mediaElement.mozCaptureStream;
    if (typeof MediaRecorder === "undefined" || typeof captureStream !== "function") {
      setError("This browser cannot convert recordings here. Try the latest Chrome or Edge.");
      return;
    }
    const mimeType = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "audio/webm;codecs=opus",
      "video/webm",
    ].find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) {
      setError("WebM conversion is not supported by this browser.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      media.currentTime = 0;
      const stream = captureStream.call(mediaElement);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        ...(file.type.startsWith("video/")
          ? { videoBitsPerSecond: 900_000 }
          : { audioBitsPerSecond: 96_000 }),
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      const done = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        recorder.onerror = () => reject(new Error("Recording conversion stopped unexpectedly."));
        media.onended = () => {
          if (recorder.state !== "inactive") recorder.stop();
        };
      });
      recorder.start();
      await media.play();
      const blob = await done;
      setConverted(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not convert this recording.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tool-panel">
      <label className="dropzone flex flex-col items-center gap-3 cursor-pointer">
        <Video size={30} />
        <strong>{file?.name ?? "Choose an audio or video recording"}</strong>
        <span className="text-sm text-muted-foreground">
          Up to 500 MB · processed on this device
        </span>
        <input className="sr-only" type="file" accept="audio/*,video/*" onChange={chooseMedia} />
      </label>
      {source &&
        (file?.type.startsWith("video/") ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={source}
            controls
            className="max-h-[440px] max-w-full mx-auto mt-6"
          />
        ) : (
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={source}
            controls
            className="w-full mt-6"
          />
        ))}
      {file && (
        <div className="control-row">
          <Button variant="tool" disabled={busy} onClick={() => void convert()}>
            <Video />
            {busy ? "Converting… play through to finish" : "Convert to WebM"}
          </Button>
          {converted && (
            <Button
              variant="paper"
              onClick={() => downloadBlob(converted, `${file.name.replace(/\.[^.]+$/, "")}.webm`)}
            >
              <Download />
              Download WebM
            </Button>
          )}
        </div>
      )}
      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
