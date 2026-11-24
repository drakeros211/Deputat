"""Серия 1 «Палата 33»: сценарий -> озвучка (Piper TTS) -> тайминги -> звуковой дизайн -> build/audio.wav + build/timeline.json
Запуск: <venv>/bin/python audio.py <путь к папке с голосами>"""
import hashlib
import json
import os
import subprocess
import sys
import wave

import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
VOICES = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("VOICES", "")
os.makedirs(f"{BUILD}/tts", exist_ok=True)
SR = 44100
FPS = 30
rng = np.random.default_rng(33)

# ---------------------------------------------------------------- СЦЕНАРИЙ
# реплика: (голос, текст для озвучки, текст субтитра или None, пауза после, кадр-шот или None)
def Ln(voice, text, sub=None, gap=0.0, shots=None, meter=None):
    return dict(voice=voice, text=text, sub=sub, gap=gap, shots=shots or [], meter=meter)


# ---------------------------------------------------------------- СЦЕНАРИЙ «Палата 33» v2
SCENES = [
    dict(id="hook", pre=0.6, post=0.2, shots0=["black"], lines=[
        Ln("L_wh", "Тём... только не поворачивайся.", shots=["black"])]),
    dict(id="flash", pre=1.3, post=0, shots0=["chance4"], lines=[]),
    dict(id="rewind", pre=1.6, post=0, shots0=["rewind"], lines=[]),
    dict(id="legend", pre=0.2, post=0.3, lines=[
        Ln("T", "В девяносто восьмом из палаты тридцать три за одну ночь пропали шестеро детей.",
           "В 98-м из палаты 33 за одну ночь пропали шестеро детей.", 0.3, ["newspaper", "newspaper_zoom"]),
        Ln("T", "Утром медсестру нашли у пустых кроватей.", None, 0.1, ["beds_nurse"]),
        Ln("N_wh", "Тише. Они спят.", None, 0.5, ["nurse_close"]),
        Ln("T", "Говорят, в три тридцать три она до сих пор делает обход.", "Говорят, в 03:33 она до сих пор делает обход.", 0.15, ["cam_far"]),
        Ln("T", "И видно её только через камеру.", None, 0, ["cam_far2"])]),
    dict(id="dima", pre=0.2, post=0.4, lines=[
        Ln("T", "Прошлой зимой туда пошёл Дима из девятого «Б».", "Прошлой зимой туда пошёл Дима из 9 «Б».", 0.2, ["school"]),
        Ln("T", "Он вернулся. Но с тех пор ни разу не моргнул.", None, 0.6, ["dima_far", "dima_close"]),
        Ln("D", "Я выспался.", None, 0, ["dima_eyes"])]),
    dict(id="dispute", pre=0.2, post=0.2, lines=[
        Ln("L", "Да это постанова, бро.", None, 0.15, ["yard"]),
        Ln("L", "Просидим там до трёх тридцати четырёх. И все заткнутся.",
           "Просидим там до 03:34. И все заткнутся.", 0.3, ["yard_lyoha", "goal"], meter=90),
        Ln("T", "Я не хотел идти. Но пошёл.", None, 0, ["gate"])]),
    dict(id="rules", pre=0.2, post=0.2, lines=[
        Ln("T", "У входа на стене кто-то написал правила.", None, 0.2, ["wall"]),
        Ln("T", "В три тридцать три — закрой глаза.", "1. В 03:33 — закрой глаза.", 0.15, ["rule1"]),
        Ln("T", "Зовут по имени — не отвечай.", "2. Зовут по имени — не отвечай.", 0.15, ["rule2"]),
        Ln("T", "Не смотри на неё через камеру.", "3. Не смотри на неё через камеру.", 0.15, ["rule3"]),
        Ln("T", "Уходи один. Даже если друг остался.", "4. Уходи один. Даже если друг остался.", 0.4, ["rule4"]),
        Ln("T", "И подпись. Дима, девятый «Б».", "И подпись: Дима, 9 «Б».", 0.3, ["signature"]),
        Ln("L", "Да он сам это всё и придумал.", None, 0, ["lyoha_laugh"], meter=70)]),
    dict(id="ward", pre=0.3, post=0.3, lines=[
        Ln("T", "Палата тридцать три.", "Палата 33.", 0.4, ["door"]),
        Ln("T", "Все кровати были заправлены. Свежим бельём.", None, 0.3, ["beds"]),
        Ln("T", "А в журнале дежурств последняя запись:", None, 0.2, ["journal"]),
        Ln("N_wh", "Три тридцать три. Все спят. Кроме двоих.", "03:33. Все спят. Кроме двоих.", 0, ["journal_zoom"], meter=50)]),
    dict(id="t0333", pre=1.4, post=0.2, shots0=["timer_zero"], lines=[
        Ln("T", "Ровно в три тридцать три я закрыл глаза.", "Ровно в 03:33 я закрыл глаза.", 0.2, ["eyes_closed"]),
        Ln("T", "А Лёха... включил камеру.", None, 1.4, ["lyoha_cam", "cam_nurse_bed"], meter=25),
        Ln("T", "И больше не сказал ни слова.", None, 0, ["lyoha_frozen"])]),
    dict(id="call", pre=0.5, post=0.2, shots0=["eyes_closed2"], lines=[
        Ln("M", "Тёма... Сынок, иди домой.", None, 0.3, ["eyes_closed2"]),
        Ln("T", "Но мама в ту ночь была на смене.", None, 0.5, ["eyes_closed2"]),
        Ln("L_wh", "Тём, открывай глаза. Уходим.", None, 0.5, ["eyes_closed3"]),
        Ln("T", "Я не открыл.", None, 0, ["eyes_closed3"], meter=10)]),
    dict(id="escape", pre=1.0, post=0.7, shots0=["eyes_closed3"], lines=[
        Ln("T", "Скрипнула каталка. Я открыл глаза.", None, 0.3, ["open_eyes"]),
        Ln("T", "Кровать Лёхи была заправлена. Ровно. Пусто.", None, 0.3, ["empty_bed"]),
        Ln("T", "Я побежал.", None, 0, ["run"])]),
    dict(id="fake", pre=0.5, post=0.3, shots0=["outside"], lines=[
        Ln("L", "Ты чего убежал, бро?", None, 0.4, ["lyoha_outside"], meter=90),
        Ln("T", "Я даже засмеялся.", None, 0, ["tyoma_relief"])]),
    dict(id="final", pre=0.4, post=0.0, shots0=["room"], lines=[
        Ln("T", "А дома мне пришло сообщение.", None, 0.2, ["room"]),
        Ln("T", "От Лёхи.", None, 2.0, ["msg"], meter=4),
        Ln("L_wh", "Тём... только не поворачивайся.", None, 0, ["behind"])]),
]
END_CUT_FRACTION = 1.0
TAIL_BLACK = 0.8

VOICE = {
    "T":    dict(voice="en-US-BrianMultilingualNeural", rate="+26%", pitch="+25Hz", shift=1.0),
    "L":    dict(voice="en-US-AndrewMultilingualNeural", rate="+22%", pitch="+0Hz", shift=1.0),
    "L_wh": dict(voice="en-US-AndrewMultilingualNeural", rate="-8%", pitch="-5Hz", shift=0.92),
    "N_wh": dict(voice="ru-RU-SvetlanaNeural", rate="+0%", pitch="-10Hz", shift=0.94),
    "M":    dict(voice="ru-RU-SvetlanaNeural", rate="-5%", pitch="+0Hz", shift=0.98),
    "D":    dict(voice="fr-FR-RemyMultilingualNeural", rate="-12%", pitch="-10Hz", shift=0.9),
}
EDGE = os.environ.get("EDGE_TTS", "edge-tts")

# ---------------------------------------------------------------- DSP-утилиты
def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output="sos")


def lp(x, f): return signal.sosfilt(sos("lowpass", f), x)
def hp(x, f): return signal.sosfilt(sos("highpass", f), x)
def bp(x, lo, hi): return signal.sosfilt(sos("bandpass", [lo, hi]), x)
def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))


def env_ad(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-np.maximum(t - a, 0) / d)


def reverb(x, decay=1.2, wet=0.35, tone=4000):
    ir_t = tt(decay * 2.5)
    ir = lp(rng.standard_normal(len(ir_t)), tone) * np.exp(-ir_t / (decay / 3))
    ir /= np.sqrt(np.sum(ir ** 2))
    y = signal.fftconvolve(x, ir)[: len(x) + len(ir_t)]
    out = np.zeros(len(y))
    out[: len(x)] += x * (1 - wet)
    return out + y * wet


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def read_wav(p):
    w = wave.open(p)
    a = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float64) / 32768
    if w.getnchannels() == 2:
        a = a.reshape(-1, 2).mean(1)
    return a


def write_wav(p, x):
    x = np.clip(x, -1, 1)
    w = wave.open(p, "w")
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype("<i2").tobytes()); w.close()


# ---------------------------------------------------------------- TTS
def synth(voice, text):
    v = VOICE[voice]
    key = hashlib.md5(f"{voice}|{text}|{v}".encode()).hexdigest()[:12]
    out = f"{BUILD}/tts/{voice}_{key}.wav"
    if not os.path.exists(out):
        mp3 = out.replace(".wav", ".mp3")
        env = dict(os.environ, SSL_CERT_FILE=os.environ.get("SSL_CERT_FILE", "/root/.ccr/ca-bundle.crt"))
        cmd = [EDGE, "--voice", v["voice"], f"--rate={v['rate']}", f"--pitch={v['pitch']}", "--text", text, "--write-media", mp3]
        if os.environ.get("HTTPS_PROXY"):
            cmd[1:1] = ["--proxy", os.environ["HTTPS_PROXY"]]
        for attempt in range(4):
            r = subprocess.run(cmd, env=env, capture_output=True, text=True)
            if r.returncode == 0 and os.path.getsize(mp3) > 1000:
                break
        else:
            raise RuntimeError(f"edge-tts failed for {voice}: {r.stderr[-300:]}")
        p = v["shift"]
        af = f"rubberband=pitch={p}:formant=preserved,aresample={SR}" if p != 1 else f"aresample={SR}"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-af", af, "-ac", "1", out], check=True)
    x = read_wav(out)
    # обрезка тишины по краям
    idx = np.where(np.abs(x) > 0.01)[0]
    x = x[max(idx[0] - 300, 0): idx[-1] + 600]
    dry = len(x) / SR
    # обработка по типу голоса
    if voice in ("L_wh", "N_wh"):
        x = hp(x, 250) * 0.9
        x = x + hp(lp(rng.standard_normal(len(x)), 7000), 2500) * np.abs(lp(np.abs(x), 30)) * 1.6
        x = reverb(x, 0.9 if voice == "N_wh" else 0.5, 0.3 if voice == "N_wh" else 0.15)
    elif voice == "M":
        x = reverb(bp(x, 200, 3500), 2.2, 0.55)  # издалека, из коридора
    elif voice == "D":
        x = reverb(x, 1.0, 0.2)
    else:
        x = reverb(x, 0.5, 0.08)
    return norm(x, 0.9), dry


# ---------------------------------------------------------------- ЗВУКИ
def drone(d):
    t = tt(d)
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t)
    x = (np.sin(2 * np.pi * 41.2 * t) + 0.8 * np.sin(2 * np.pi * 43.1 * t) + 0.3 * np.sin(2 * np.pi * 61.7 * t)) * lfo
    x += lp(noise(d), 180) * 2.5 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * t + 1))
    return norm(x, 1)


def wind(d):
    t = tt(d)
    m = 0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t) * np.sin(2 * np.pi * 0.043 * t + 2)
    return norm(bp(noise(d), 250, 1100) * m, 1)


def pad(d, root=73.4):
    t = tt(d)
    x = np.zeros(len(t))
    for f, a in ((root, 1), (root * 1.189, 0.7), (root * 1.498, 0.6), (root * 2.0, 0.4), (root * 2.83, 0.25)):
        for det in (-0.4, 0.4):
            x += a * signal.sawtooth(2 * np.pi * (f + det) * t)
    x = lp(x, 500)
    fade = np.minimum(1, np.minimum(t / 2, (d - t) / 1.5))
    return norm(x * fade, 1)


def music_box(d, start_note=0):
    """Тихая жуткая мелодия музыкальной шкатулки."""
    notes = [76, 74, 72, 71, 72, 69, 71, 68, 69, 72, 71, 69, 68, 64]
    step = 0.42
    out = np.zeros(int(d * SR) + SR * 2)
    t0 = 0.0
    i = start_note
    while t0 < d:
        f = 440 * 2 ** ((notes[i % len(notes)] - 69) / 12) * (1 + 0.004 * np.sin(i))
        n = int(1.6 * SR)
        t = np.arange(n) / SR
        tone = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.01 * t) + 0.15 * np.sin(2 * np.pi * f * 3.98 * t))
        tone *= np.exp(-t / 0.45) * np.minimum(t / 0.003, 1)
        s = int(t0 * SR)
        out[s:s + n] += tone
        t0 += step * (1.0 + 0.08 * ((i * 7) % 3))
        i += 1
    out = out[: int(d * SR)]
    return norm(reverb(out, 1.8, 0.45)[: len(out)], 1)


def creak(d, f0=35, f1=70, bright=1.0):
    n = int(d * SR)
    out = np.zeros(n)
    t = 0.0
    while t < d:
        k = t / d
        f = f0 + (f1 - f0) * np.sin(np.pi * k) + rng.normal(0, 5)
        out[int(t * SR)] = rng.uniform(0.5, 1)
        t += 1 / max(f, 10)
    res_t = np.arange(int(0.012 * SR)) / SR
    res = np.sin(2 * np.pi * 950 * bright * res_t) * np.exp(-res_t / 0.003) + 0.6 * np.sin(2 * np.pi * 1900 * bright * res_t) * np.exp(-res_t / 0.002)
    y = signal.fftconvolve(out, res)[:n]
    e = np.sin(np.pi * np.arange(n) / n) ** 0.5
    return norm(bp(y * e, 300, 5000), 1)


def drip():
    t = tt(0.25)
    f = 1900 * np.exp(-t * 6) + 900
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.04)
    return norm(reverb(x, 1.4, 0.5), 1)


def heartbeat():
    def thump(a):
        t = tt(0.3)
        return a * (np.sin(2 * np.pi * 52 * t) * np.exp(-t / 0.09) + lp(noise(0.3), 150) * np.exp(-t / 0.03) * 0.8)
    x = np.zeros(int(0.8 * SR))
    l = thump(1); x[: len(l)] += l
    s = int(0.26 * SR); d2 = thump(0.7); x[s:s + len(d2)] += d2
    return norm(x, 1)


def step():
    t = tt(0.12)
    return norm(lp(noise(0.12), 700) * np.exp(-t / 0.025) + np.sin(2 * np.pi * 80 * t) * np.exp(-t / 0.03), 1)


def static(d, dense=0.6):
    x = hp(noise(d), 800)
    g = (rng.random(int(d * 60) + 1) < dense).astype(float)
    g = np.repeat(g, SR // 60 + 1)[: len(x)]
    x = np.round(x * g * 6) / 6
    return norm(x, 1)


def stinger(d=3.0):
    t = tt(d)
    x = np.zeros(len(t))
    for f in (110, 116.5, 155.6, 233.1, 246.9, 369.9, 523):
        vib = 1 + 0.01 * np.sin(2 * np.pi * 5.5 * t + f)
        x += signal.sawtooth(2 * np.pi * f * vib * t) * 0.5
    x = lp(x, 2500)
    x += hp(noise(d), 2000) * 0.8
    e = env_ad(len(t), 0.02, 0.9)
    boom = np.sin(2 * np.pi * (55 * np.exp(-t * 1.5) + 25) * t) * np.exp(-t / 0.6) * 3
    return norm(reverb(x * e + boom, 1.5, 0.35)[: len(t)], 1)


def riser(d):
    t = tt(d)
    k = t / d
    x = np.zeros(len(t))
    for f in (220, 233, 311):
        ff = f * (1 + k * 1.2)
        x += np.sin(2 * np.pi * np.cumsum(ff) / SR)
    x += bp(noise(d), 1500, 6000) * 1.5
    return norm(x * k ** 2.2, 1)


def whoosh(d=0.45):
    t = tt(d)
    x = noise(d)
    out = np.zeros(len(x))
    seg = 512
    for i in range(0, len(x), seg):
        k = i / len(x)
        c = 300 + 3500 * np.sin(np.pi * k)
        out[i:i + seg] = bp(x[max(0, i - 2048):i + seg], c * 0.6, min(c * 1.6, 20000))[-len(x[i:i + seg]):]
    return norm(out * np.sin(np.pi * t / d) ** 2, 1)


def boom():
    t = tt(1.6)
    x = np.sin(2 * np.pi * (70 * np.exp(-t * 3) + 28) * t) * np.exp(-t / 0.5) + lp(noise(1.6), 300) * np.exp(-t / 0.15)
    return norm(x, 1)


def ping():
    out = np.zeros(int(0.5 * SR))
    for s, f in ((0, 1318.5), (0.11, 1760)):
        t = tt(0.3)
        tone = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.08)
        out[int(s * SR):int(s * SR) + len(tone)] += tone
    return norm(out, 1)


def beep():
    out = np.zeros(int(0.5 * SR))
    for s in (0, 0.2):
        t = tt(0.12)
        out[int(s * SR):int(s * SR) + len(t)] += signal.square(2 * np.pi * 1200 * t) * 0.5 * np.minimum(1, (0.12 - t) / 0.01)
    return lp(out, 6000)


def buzz(d):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * 100 * k * t) / k for k in range(1, 8))
    flick = (rng.random(int(d * 15) + 1) > 0.15).astype(float)
    flick = np.repeat(flick, SR // 15 + 1)[: len(t)]
    return norm(x * lp(flick, 40), 1)


def door_open():
    return creak(1.6, 25, 55, 0.8)


def breath_run(d):
    out = np.zeros(int(d * SR))
    t0 = 0
    while t0 < d - 0.4:
        n = int(0.28 * SR)
        b = bp(noise(0.28), 500, 3000) * np.sin(np.pi * np.arange(n) / n) ** 2
        s = int(t0 * SR); out[s:s + n] += b
        t0 += 0.36
    return norm(out, 1)


# ---------------------------------------------------------------- ТАЙМЛАЙН
def chunks_of(text):
    words, out, cur = text.split(), [], []
    for w in words:
        if w in ("—", "-") and out and not cur:
            out[-1] += " " + w; continue
        cur.append(w)
        if len(" ".join(cur)) >= 9 or w.endswith((".", ",", "?", "!", "…", ":", "—")) or len(cur) == 2:
            out.append(" ".join(cur)); cur = []
    if cur:
        out.append(" ".join(cur))
    return out


def build():
    TLn = dict(fps=FPS, scenes=[], subs=[], lines=[], shots=[], meter=[])
    clips = []
    t = 0.0
    for sc in SCENES:
        s_start = t
        for nm in sc.get("shots0", []):
            TLn["shots"].append(dict(name=nm, start=round(t, 3), scene=sc["id"]))
        t += sc["pre"]
        for i, ln in enumerate(sc["lines"]):
            x, dry = synth(ln["voice"], ln["text"])
            d = dry
            who = ln["voice"][0]
            TLn["lines"].append(dict(scene=sc["id"], who=who, voice=ln["voice"], start=round(t, 3), end=round(t + d, 3)))
            clips.append((t, x, 1.0, "voice"))
            n = len(ln["shots"])
            for k, nm in enumerate(ln["shots"]):
                st = t + k * (d + ln["gap"]) / n - (0.08 if k == 0 else 0)
                if i == 0 and k == 0 and not sc.get("shots0"):
                    st = s_start
                TLn["shots"].append(dict(name=nm, start=round(st, 3), scene=sc["id"]))
            if ln["meter"] is not None:
                TLn["meter"].append(dict(t=round(t + d * 0.6, 3), v=ln["meter"]))
            ch = chunks_of(ln["sub"] or ln["text"])
            tot = sum(len(c) + 3 for c in ch)
            ct = t
            for c in ch:
                cd = d * (len(c) + 3) / tot
                style = "whisper" if ln["voice"] in ("L_wh", "N_wh") else ("mom" if ln["voice"] == "M" else ("dima" if ln["voice"] == "D" else "normal"))
                TLn["subs"].append(dict(start=round(ct, 3), end=round(ct + cd, 3), text=c, who=who, style=style))
                ct += cd
            t += d + ln["gap"]
        t += sc["post"]
        TLn["scenes"].append(dict(id=sc["id"], start=round(s_start, 3), end=round(t, 3)))
    cut = t
    total = cut + TAIL_BLACK
    TLn["cut"] = round(cut, 3); TLn["duration"] = round(total, 3)

    nfr = int(total * FPS) + 1
    for spk in ("T", "L", "D"):
        m = np.zeros(nfr)
        for (st, x, g, kind), ln in zip(clips, TLn["lines"]):
            if ln["who"] != spk:
                continue
            hop = SR // FPS
            for k in range(0, len(x) - hop, hop):
                fi = int((st + k / SR) * FPS)
                if fi < nfr:
                    m[fi] = max(m[fi], np.sqrt(np.mean(x[k:k + hop] ** 2)))
        TLn["mouth_" + spk] = [int(v > 0.05) + int(v > 0.14) for v in m]

    S = {s["id"]: s for s in TLn["scenes"]}
    SH = {}
    for sh in TLn["shots"]:
        SH.setdefault(sh["name"], sh["start"])

    def add(at, x, g):
        clips.append((at, x, g, "sfx"))

    def span(a, b):
        return S[b]["end"] - S[a]["start"] if b in S else S[a]["end"] - S[a]["start"]

    # --- музыка и атмосфера
    add(0, drone(cut), 0.2)
    add(0, static(0.15), 0.2)
    add(SH["chance4"], stinger(1.5), 0.45)
    add(SH["chance4"], static(0.2), 0.3)
    rw = SH["rewind"]
    add(rw, static(1.6, 0.9) * np.linspace(0.6, 1, int(1.6 * SR)), 0.18)
    add(rw, riser(1.5)[::-1].copy(), 0.25)  # обратный «перемоточный» звук
    add(S["legend"]["start"], music_box(span("legend", "dima")), 0.11)
    add(SH["newspaper"], whoosh(0.4), 0.2)
    add(SH["beds_nurse"], static(0.2), 0.15)
    add(SH["nurse_close"] - 0.1, stinger(1.6) * np.linspace(1, 0.2, int(1.6 * SR)), 0.2)
    add(SH["cam_far"], beep(), 0.2)
    add(SH["cam_far"], static(0.25), 0.2)
    add(SH["school"], whoosh(0.35), 0.15)
    add(SH["dima_eyes"] - 0.05, boom(), 0.35)
    add(S["dispute"]["start"], wind(span("dispute", "dispute")), 0.1)
    add(SH["goal"], boom(), 0.3)
    add(SH["gate"], creak(1.3, 20, 45, 0.7), 0.15)
    add(S["rules"]["start"], pad(span("rules", "ward"), 73.4), 0.06)
    for nm in ("rule1", "rule2", "rule3", "rule4"):
        add(SH[nm], whoosh(0.3), 0.12)
        add(SH[nm] + 0.05, heartbeat(), 0.15)
    add(SH["signature"], stinger(1.4) * np.linspace(1, 0, int(1.4 * SR)), 0.22)
    for k in range(5):
        add(S["ward"]["start"] + 0.4 + k * 1.6, drip(), 0.1)
    add(SH["door"] + 0.3, creak(1.6, 25, 55, 0.8), 0.28)
    add(SH["journal_zoom"] - 0.6, riser(0.6), 0.15)
    add(SH["journal_zoom"], stinger(2.0), 0.3)
    # 03:33
    z = SH["timer_zero"]
    for k in range(3):
        add(z + k * 0.3, beep(), 0.25)
    add(z + 1.0, boom(), 0.45)
    add(z + 1.0, buzz(0.4) * np.linspace(1, 0, int(0.4 * SR)), 0.12)
    hb = z + 1.4
    while hb < S["call"]["end"]:
        add(hb, heartbeat(), 0.3)
        hb += 0.92 if hb < S["t0333"]["end"] else 0.75
    add(SH["cam_nurse_bed"], static(0.3), 0.35)
    add(SH["cam_nurse_bed"] + 0.05, stinger(2.2), 0.5)
    add(S["call"]["start"], pad(span("call", "escape"), 69.3), 0.07)
    wt, per = S["escape"]["start"] + 0.2, 0.3
    add(wt, creak(0.9, 30, 50, 1.3), 0.3)
    add(SH["open_eyes"], whoosh(0.4), 0.2)
    add(SH["empty_bed"] - 0.1, stinger(1.8) * np.linspace(1, 0.1, int(1.8 * SR)), 0.3)
    r0 = SH["run"]
    k = r0
    while k < S["escape"]["end"]:
        add(k, step(), 0.35); k += 0.26
    add(r0, breath_run(S["escape"]["end"] - r0 + 0.5), 0.2)
    add(S["fake"]["start"], buzz(span("fake", "fake")), 0.035)
    add(S["fake"]["start"], wind(span("fake", "fake")), 0.08)
    f0 = S["final"]["start"]
    add(f0, music_box(cut - f0, 5), 0.07)
    msg = SH["msg"]
    add(msg + 0.15, ping(), 0.4)
    add(msg + 0.6, heartbeat(), 0.3); add(msg + 1.4, heartbeat(), 0.35)
    beh = SH["behind"]
    add(beh - 0.9, creak(1.0, 18, 35, 0.6), 0.3)
    add(beh - 0.4, riser(cut - beh + 0.4), 0.15)
    add(cut - 0.05, static(0.05, 1.0), 0.5)

    n = int(total * SR)
    voice = np.zeros(n); sfx = np.zeros(n)
    for st, x, g, kind in clips:
        s0 = int(st * SR)
        if s0 >= n:
            continue
        seg = x[: n - s0] * g
        (voice if kind == "voice" else sfx)[s0:s0 + len(seg)] += seg
    venv = lp(np.abs(voice), 8)
    duck = 1 - 0.5 * np.clip(venv / 0.15, 0, 1)
    mix = voice * 0.95 + sfx * duck
    mix[int(cut * SR):] = 0
    write_wav(f"{BUILD}/audio_raw.wav", norm(mix, 0.95))
    json.dump(TLn, open(f"{BUILD}/timeline.json", "w"), ensure_ascii=False, indent=1)
    print("duration", round(total, 2))
    for s in TLn["scenes"]:
        print(s["id"], s["start"], s["end"])


build()
