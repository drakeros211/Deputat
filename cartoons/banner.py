"""Вставка баннера Cloudy VPN по правилам cloudymedia.info/pravila (экономно по памяти — по кускам).
Ролик <= 2:00 — один баннер ровно посередине; > 2:00 — два баннера, на 0:30 и 1:30 итогового ролика.
На время баннера ролик стоит (стоп-кадр, звук ролика тоже), баннер 1156x490 ровно по центру (25.5% экрана),
хромакей удаляется полностью, баннер без ускорения, звук баннера выровнен (loudnorm).
Запуск: python3 banner.py input.mp4 output.mp4 [ad.mp4]"""
import os
import subprocess
import sys
import tempfile

AD_DEFAULT = "/root/.claude/uploads/68a9a9c9-7c74-5b62-b0f9-c793bad7d094/7fc83c61-CloudyVPN_GREEN.mp4"
FPS = 30
AD_LEN = 10.0
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
       "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2"]


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode())


def run(cmd):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-threads", "2"] + cmd, check=True)


def main(inp, out, ad=AD_DEFAULT):
    D = dur(inp)
    cuts = [round(D * FPS / 2)] if D <= 120 else [30 * FPS, 80 * FPS]
    tmp = tempfile.mkdtemp(prefix="banner_", dir=os.path.dirname(os.path.abspath(out)))
    parts, prev = [], 0
    for k, fr in enumerate(cuts + [None]):
        seg = os.path.join(tmp, f"seg{k}.mp4")
        a = prev / FPS
        args = ["-ss", f"{a:.4f}", "-i", inp]
        if fr is not None:
            args += ["-t", f"{(fr - prev) / FPS:.4f}"]
        run(args + ENC + [seg])
        parts.append(seg)
        if fr is None:
            break
        png = os.path.join(tmp, f"frame{k}.png")
        run(["-ss", f"{fr / FPS:.4f}", "-i", inp, "-frames:v", "1", png])
        ban = os.path.join(tmp, f"ban{k}.mp4")
        fc = (f"[0:v]scale=1080:1920,eq=brightness=-0.06,format=yuv420p[bg];"
              f"[1:v]fps={FPS},format=rgba,chromakey=0x00FE00:0.16:0.06,despill=type=green,scale=1156:490:flags=lanczos[ad];"
              f"[bg][ad]overlay=x=-38:y=715:format=auto:shortest=1,format=yuv420p[v];"
              f"[1:a]loudnorm=I=-14:TP=-1.5,aresample=44100,apad=whole_dur={AD_LEN}[a]")
        run(["-loop", "1", "-framerate", str(FPS), "-t", str(AD_LEN), "-i", png, "-i", ad, "-filter_complex", fc,
             "-map", "[v]", "-map", "[a]", "-t", str(AD_LEN)] + ENC + [ban])
        parts.append(ban)
        prev = fr
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    run(["-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", out])
    for p in parts + [lst] + [os.path.join(tmp, f) for f in os.listdir(tmp) if f.endswith(".png")]:
        if os.path.exists(p):
            os.remove(p)
    os.rmdir(tmp)
    starts, off = [], 0
    for fr in cuts:
        starts.append(fr / FPS + off); off += AD_LEN
    print(f"{out}: {dur(out):.2f}s, баннеры на {', '.join(f'{s:.1f}s' for s in starts)}")


if __name__ == "__main__":
    main(*sys.argv[1:])
