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
SCENES = [
    dict(id="hook", pre=0.9, post=0.5, lines=[
        ("T_wh", "Это видео я не должен был выкладывать.", None, 0, None)]),
    dict(id="street", pre=0.4, post=0.3, lines=[
        ("T", "Йоу, это Тёма.", None, 0.15, None),
        ("T", "Короче. Мы с Лёхой решили снять тикток в заброшке.", None, 0.35, None),
        ("L", "Бу! Ха-ха! Видел бы ты своё лицо, бро!", None, 0, "scare")]),
    dict(id="gate", pre=0.5, post=0.3, lines=[
        ("T", "Детская больница «Берёзка». Закрыта с девяносто восьмого.", "Детская больница «Берёзка». Закрыта с 98-го.", 0.3, None),
        ("T", "Говорят, ровно в три ноль три тут начинается ночной обход.", "Говорят, ровно в 03:03 тут начинается ночной обход.", 0.15, None),
        ("T", "И медсестру видно только через камеру.", None, 0.35, None),
        ("L", "Да расслабься, бро. Это сказки для пятиклашек.", None, 0, None)]),
    dict(id="inside", pre=0.3, post=0.9, lines=[
        ("T", "Внутри пахло хлоркой.", None, 0.25, "corridor"),
        ("T", "Хотя больницу закрыли больше двадцати лет назад.", None, 0.4, "doll"),
        ("T", "А колесо у коляски... ещё крутилось.", None, 0, "wheel")]),
    dict(id="ward", pre=0.6, post=0.3, lines=[
        ("T", "Палата тридцать три.", "Палата 33.", 0.6, "door"),
        ("T", "Все кровати были заправлены. Свежим бельём.", None, 0.4, "beds"),
        ("L_sc", "Бро... пошли отсюда.", None, 0, "lyoha")]),
    dict(id="nurse", pre=1.8, post=0.9, lines=[
        ("T_wh", "Лёх. Ты её видишь?", None, 0.8, "cam_far"),
        ("L_sc", "Где? Там никого нет.", None, 1.0, "eyes"),
        ("T_wh", "Она стала ближе.", None, 0, "cam_near")]),
    dict(id="run", pre=0.2, post=0.5, lines=[
        ("T", "Мы побежали.", None, 0.2, "run"),
        ("T", "Я не оглядывался. Лёха бежал сзади. Я слышал его шаги.", None, 0.7, None),
        ("L_cr", "Да расслабься, бро.", None, 0, "outside")]),
    dict(id="home", pre=0.4, post=0.6, lines=[
        ("T", "Дома я пересмотрел видео.", None, 0.25, "face"),
        ("T", "На сорок седьмой секунде...", "На 47-й секунде...", 0.5, "video"),
        ("L_wh", "Тём. Это не я.", None, 0, None)]),
    dict(id="msg", pre=0.5, post=0.3, lines=[
        ("T", "Но Лёха шёл со мной до самого подъезда.", None, 0.4, None),
        ("T", "Тогда... с кем я шёл?", None, 0, None)]),
    dict(id="end", pre=1.8, post=0.0, lines=[
        ("T", "Если досмотрел, значит, ты тоже не спишь.", "Если досмотрел, значит, ты тоже не с", 0, None)]),
]
END_CUT_FRACTION = 0.84   # последнюю фразу обрываем на полуслове
TAIL_BLACK = 0.7

# Голоса: модель, скорость (length_scale), сдвиг высоты
VOICE = {
    "T":    dict(model="dmitri", speed=1.18, pitch=1.13),
    "T_wh": dict(model="dmitri", speed=1.02, pitch=1.10),
    "L":    dict(model="ruslan", speed=1.15, pitch=1.04),
    "L_sc": dict(model="ruslan", speed=1.05, pitch=1.06),
    "L_cr": dict(model="ruslan", speed=0.88, pitch=0.80),
    "L_wh": dict(model="ruslan", speed=0.95, pitch=0.97),
}

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
_tts = {}


def tts_engine(model):
    if model not in _tts:
        import sherpa_onnx
        d = f"{VOICES}/vits-piper-ru_RU-{model}-medium"
        cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{d}/ru_RU-{model}-medium.onnx",
                                                       tokens=f"{d}/tokens.txt", data_dir=f"{d}/espeak-ng-data"),
            num_threads=4))
        _tts[model] = sherpa_onnx.OfflineTts(cfg)
    return _tts[model]


def synth(voice, text):
    v = VOICE[voice]
    key = hashlib.md5(f"{voice}|{text}|{v}".encode()).hexdigest()[:12]
    out = f"{BUILD}/tts/{voice}_{key}.wav"
    if not os.path.exists(out):
        raw = out.replace(".wav", "_raw.wav")
        a = tts_engine(v["model"]).generate(text, sid=0, speed=v["speed"])
        s = np.array(a.samples)
        w = wave.open(raw, "w"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(a.sample_rate)
        w.writeframes((np.clip(s, -1, 1) * 32767).astype("<i2").tobytes()); w.close()
        p = v["pitch"]
        af = f"rubberband=pitch={p}:formant=preserved,aresample={SR}" if p != 1 else f"aresample={SR}"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", af, "-ac", "1", out], check=True)
    x = read_wav(out)
    # обрезка тишины по краям
    idx = np.where(np.abs(x) > 0.01)[0]
    x = x[max(idx[0] - 300, 0): idx[-1] + 600]
    dry = len(x) / SR
    # обработка по типу голоса
    if voice == "T_wh" or voice == "L_wh":
        x = hp(x, 300) * 0.9
        x = x + hp(lp(noise(len(x) / SR), 6000), 2500) * np.abs(lp(np.abs(x), 30)) * 1.5  # «шёпотный» воздух
        x = reverb(x, 0.8, 0.25)
    elif voice == "L_cr":
        low = subprocess.run  # placeholder to keep flake quiet
        x2 = np.interp(np.arange(0, len(x), 0.94), np.arange(len(x)), x)  # чуть ниже второй слой
        y = np.zeros(max(len(x), len(x2)))
        y[: len(x)] += x; y[: len(x2)] += x2 * 0.6
        x = reverb(lp(y, 5000), 2.0, 0.45)
    elif voice == "L_sc":
        x = reverb(x, 0.9, 0.2)
    else:
        x = reverb(x, 0.6, 0.12)
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
def build():
    timeline = dict(fps=FPS, scenes=[], subs=[], lines=[])
    clips = []  # (start, array, gain)
    t = 0.0
    for sc in SCENES:
        s_start = t
        t += sc["pre"]
        shots = []
        for i, (voice, text, sub, gap, shot) in enumerate(sc["lines"]):
            x, dry = synth(voice, text)
            if sc["id"] == "end":
                x = x[: int(dry * SR * END_CUT_FRACTION)]
                dry = len(x) / SR
            if shot:
                shots.append(dict(name=shot, start=round(t - (0.25 if i else sc["pre"] * 0.9), 3)))
            d = dry
            spk = voice[0]
            timeline["lines"].append(dict(scene=sc["id"], who=spk, voice=voice, start=round(t, 3), end=round(t + d, 3)))
            gain = 1.0
            clips.append((t, x, gain, "voice"))
            # субтитры: делим на куски по 1–3 слова пропорционально длине
            words = (sub or text).split()
            chunks, cur = [], []
            for w in words:
                cur.append(w)
                if len(" ".join(cur)) >= 11 or w.endswith((".", ",", "?", "!", "…")) or len(cur) == 3:
                    chunks.append(" ".join(cur)); cur = []
            if cur:
                chunks.append(" ".join(cur))
            total = sum(len(c) + 2 for c in chunks)
            ct = t
            for c in chunks:
                cd = d * (len(c) + 2) / total
                timeline["subs"].append(dict(start=round(ct, 3), end=round(ct + cd, 3), text=c, who=spk,
                                             style="whisper" if voice.endswith("wh") else ("creepy" if voice == "L_cr" else "normal")))
                ct += cd
            t += d + gap
        t += sc["post"]
        if sc["id"] == "end":
            t += 0.0
        timeline["scenes"].append(dict(id=sc["id"], start=round(s_start, 3), end=round(t, 3), shots=shots))
    cut = t
    total = cut + TAIL_BLACK
    timeline["cut"] = round(cut, 3)
    timeline["duration"] = round(total, 3)

    # ---- рот: огибающая голоса каждого говорящего по кадрам
    nfr = int(total * FPS) + 1
    for spk in ("T", "L"):
        m = np.zeros(nfr)
        for (st, x, g, kind), ln in zip(clips, timeline["lines"]):
            if ln["who"] != spk:
                continue
            hop = SR // FPS
            for k in range(0, len(x) - hop, hop):
                fi = int((st + k / SR) * FPS)
                if fi < nfr:
                    m[fi] = max(m[fi], np.sqrt(np.mean(x[k:k + hop] ** 2)))
        timeline["mouth_" + spk] = [int(v > 0.06) + int(v > 0.16) for v in m]

    # ---- звуковой дизайн
    S = {s["id"]: s for s in timeline["scenes"]}
    shot = {(s["id"], sh["name"]): sh["start"] for s in timeline["scenes"] for sh in s["shots"]}
    L = lambda sid, i: [l for l in timeline["lines"] if l["scene"] == sid][i]

    def add(at, x, g):
        clips.append((at, x, g, "sfx"))

    # музыка/атмосфера
    add(0, drone(cut), 0.22)
    add(0, music_box(S["street"]["start"] + 0.3), 0.10)
    add(0, static(0.25), 0.25); add(0.42, static(0.35, 0.8), 0.3)
    add(S["hook"]["end"] - 0.25, static(0.3), 0.2)
    add(S["street"]["start"], wind(S["inside"]["start"] - S["street"]["start"]), 0.10)
    add(S["street"]["start"], buzz(S["gate"]["start"] - S["street"]["start"]), 0.035)
    sc_t = shot[("street", "scare")]
    add(sc_t + 0.15, stinger(1.2) * np.linspace(1, 0, int(1.2 * SR)), 0.35)
    add(S["gate"]["start"], whoosh(), 0.3)
    add(S["gate"]["start"] + 0.4, creak(1.4, 20, 45, 0.7), 0.18)
    add(S["gate"]["start"], pad(S["ward"]["end"] - S["gate"]["start"], 73.4), 0.06)
    for k in range(6):
        add(S["inside"]["start"] + 0.5 + k * 1.37, drip(), 0.12)
    add(shot[("inside", "doll")], whoosh(0.35), 0.18)
    add(shot[("inside", "wheel")], creak(S["inside"]["end"] - shot[("inside", "wheel")], 18, 30, 1.2), 0.16)
    add(shot[("ward", "door")] + 0.5, door_open(), 0.3)
    add(shot[("ward", "lyoha")], heartbeat(), 0.35)
    # 03:03
    n0 = S["nurse"]["start"]
    add(n0 + 0.1, beep(), 0.3)
    add(n0 + 0.15, static(0.5), 0.35)
    add(n0 + 0.6, boom(), 0.35)
    add(n0, pad(S["nurse"]["end"] - n0, 69.3), 0.08)
    hb_t = n0 + 1.2
    while hb_t < S["nurse"]["end"] - 0.4:
        add(hb_t, heartbeat(), 0.38)
        hb_t += max(0.5, 0.95 - (hb_t - n0) * 0.04)
    # колёса каталки — ускоряются
    wt, per = n0 + 1.6, 0.55
    while wt < S["nurse"]["end"]:
        add(wt, creak(0.16, 40, 60, 1.4), 0.12 + 0.12 * (wt - n0) / (S["nurse"]["end"] - n0))
        wt += per; per = max(0.17, per * 0.9)
    add(shot[("nurse", "eyes")] - 0.05, whoosh(0.3), 0.2)
    near = shot[("nurse", "cam_near")]
    add(near - 1.0, riser(1.0), 0.3)
    add(near, stinger(2.4), 0.55)
    add(near, static(0.25), 0.35)
    # бег
    r0 = S["run"]["start"]
    out_t = shot[("run", "outside")]
    k = r0
    while k < out_t - 0.2:
        add(k, step(), 0.35); k += 0.27
    add(r0, breath_run(out_t - r0), 0.18)
    add(r0, drone(out_t - r0) * 0.8, 0.2)
    add(out_t, boom(), 0.25)
    add(out_t, buzz(S["run"]["end"] - out_t), 0.04)
    add(L("run", 2)["start"] - 0.6, riser(0.6), 0.15)
    # дома
    h0 = S["home"]["start"]
    add(h0, whoosh(0.4), 0.2)
    add(h0, music_box(S["msg"]["end"] - h0, 3), 0.06)
    add(shot[("home", "video")], static(0.3), 0.3)
    add(L("home", 2)["start"] - 0.1, stinger(2.0), 0.35)
    add(S["msg"]["start"] + 0.1, ping(), 0.4)
    add(S["msg"]["start"], heartbeat(), 0.25)
    add(L("msg", 1)["start"] - 0.2, heartbeat(), 0.3)
    e0 = S["end"]["start"]
    add(e0, riser(cut - e0), 0.10)
    add(e0 + 0.2, static(0.2), 0.2)
    add(cut - 0.06, static(0.06, 1.0), 0.6)

    # ---- сведение
    n = int(total * SR)
    voice = np.zeros(n)
    sfx = np.zeros(n)
    for st, x, g, kind in clips:
        s = int(st * SR)
        if s >= n:
            continue
        seg = x[: n - s] * g
        (voice if kind == "voice" else sfx)[s:s + len(seg)] += seg
    # дакинг: эффекты тише во время голоса
    venv = lp(np.abs(voice), 8)
    duck = 1 - 0.45 * np.clip(venv / 0.15, 0, 1)
    mix = voice * 0.95 + sfx * duck
    # абсолютная тишина после обрыва
    mix[int(cut * SR):] = 0
    mix = norm(mix, 0.95)
    write_wav(f"{BUILD}/audio_raw.wav", mix)
    json.dump(timeline, open(f"{BUILD}/timeline.json", "w"), ensure_ascii=False, indent=1)
    print("duration", total, "cut", cut)
    for s in timeline["scenes"]:
        print(s["id"], s["start"], s["end"], [(x["name"], x["start"]) for x in s["shots"]])


build()
