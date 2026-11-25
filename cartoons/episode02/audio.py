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

def Ln(voice, text, sub=None, gap=0.0, shots=None, meter=None):
    return dict(voice=voice, text=text, sub=sub, gap=gap, shots=shots or [], meter=meter)


# ---------------------------------------------------------------- СЦЕНАРИЙ «Глубинный»
SCENES = [
    dict(id="hook", pre=1.0, post=0.3, shots0=["alert"], lines=[
        Ln("T_wh", "[whispers] Оно смотрит прямо на наш дом.", None, 0, ["alert_shake"])]),
    dict(id="flash", pre=1.3, post=0, shots0=["chance7"], lines=[]),
    dict(id="rewind", pre=1.5, post=0, shots0=["rewind"], lines=[]),
    dict(id="calm", pre=0.2, post=0.2, lines=[
        Ln("T", "[thoughtful] Всё началось с рыбы.", None, 0.1, ["fish"]),
        Ln("T", "Тысячи дохлых рыб на берегу водохранилища.", None, 0.2, ["fish_close"]),
        Ln("R", "Сейсмологи фиксируют слабые толчки. Повода для паники нет.", None, 0.2, ["radio_city"]),
        Ln("T", "[nervous] А вода у меня в кружке... шла кругами.", None, 0.2, ["cup"]),
        Ln("L", "[laughs] Бро, это просто грузовик проехал.", None, 0, ["lyoha_kitchen"])]),
    dict(id="night", pre=0.2, post=0.3, lines=[
        Ln("T", "[excited] Ночью мы пошли на набережную. Снять светящуюся воду.", None, 0.15, ["embank", "glow_water"]),
        Ln("T", "[whispers] Вода и правда светилась. Изнутри.", None, 0.4, ["glow_close"]),
        Ln("L", "[scared] Тём... что это под водой?", None, 0.2, ["shadow_under"]),
        Ln("T", "[whispers] Тень. Длиной в три автобуса.", None, 0.3, ["shadow_top"]),
        Ln("T", "[nervous] И тут во всём городе погас свет.", None, 0, ["blackout"])]),
    dict(id="rise", pre=1.2, post=0.2, shots0=["ridge"], lines=[
        Ln("T", "[scared] Из воды поднялся хребет.", None, 0.2, ["ridge"]),
        Ln("T", "[terrified] Потом голова. Размером с дом.", None, 2.6, ["head_rise", "roar"]),
        Ln("T", "[shouting] От его рёва лопнули все окна на набережной!", None, 0, ["glass"], meter=60)]),
    dict(id="panic", pre=0.6, post=0.2, shots0=["sirens"], lines=[
        Ln("T", "Завыли сирены.", None, 0.1, ["sirens"]),
        Ln("T", "[breathless] Люди бежали. Над водой зависли вертолёты.", None, 0.2, ["crowd", "helis"]),
        Ln("T", "[shouting] А потом треснул мост!", None, 0.6, ["bridge"], meter=45),
        Ln("T", "[panicked] Мама была на ночной смене. В больнице прямо у воды.", None, 0.2, ["phone_mom"]),
        Ln("L", "[shouting] Тём, ты куда?! Беги от него!", None, 0.2, ["lyoha_run"]),
        Ln("T", "[determined] Я побежал. Не от него. К нему.", None, 0, ["run_to"], meter=30)]),
    dict(id="twist", pre=0.3, post=0.3, lines=[
        Ln("L", "[scared] Бро... по новостям второй объект. Он в три раза больше.", None, 0.3, ["radar"]),
        Ln("T", "Он стоял по пояс в воде. Спиной к городу.", None, 0.2, ["back_view"]),
        Ln("T", "[amazed] Он не нападал. Он закрывал нас собой.", None, 0.3, ["shield"]),
        Ln("T", "[whispers] Он от чего-то убегал.", None, 0, ["shield_close"])]),
    dict(id="fight", pre=1.0, post=0.2, shots0=["boil"], lines=[
        Ln("T", "[scared] Вода закипела.", None, 0.2, ["boil"]),
        Ln("T", "[terrified] Из глубины поднялось что-то тёмное. Без единого огонька.", None, 0.5, ["dark_rise", "dark_close"], meter=15),
        Ln("T", "[shouting] Он загорелся так ярко, что ночь стала днём!", None, 2.0, ["glow_max", "impact"]),
        Ln("T", "[crying] Я закрыл маму собой.", None, 0, ["cover_mom"], meter=7)]),
    dict(id="end", pre=1.3, post=0.0, shots0=["silence"], lines=[
        Ln("T", "[quietly] Потом стало тихо. Телефон снова пискнул.", None, 0.3, ["alert2"]),
        Ln("T", "[whispers] Я подошёл к окну.", None, 0.4, ["to_window"]),
        Ln("T", "[whispers] А там, во всё окно... был глаз.", None, 0.5, ["eye"]),
        Ln("T", "[whispers] Он смотрел на наш дом. [sad] И, кажется... просил помочь.", None, 0, ["eye_close"])]),
]
END_CUT_FRACTION = 1.0
TAIL_BLACK = 0.8

VOICE = {  # ElevenLabs eleven_v3: голоса из библиотеки (нативный русский)
    "T":    dict(el="Uv3rf12Omd9Asyv54Bqw"),   # Тёма — Max (Alive and Emotional)
    "T_wh": dict(el="Uv3rf12Omd9Asyv54Bqw"),
    "L":    dict(el="lsAmGFzUYusakA482527"),   # Лёха — Andrey Permikin
    "R":    dict(el="EDpEYNf6XIeKYRzYcx4I"),   # радио — Mariia
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
    key = hashlib.md5(f"{voice}|{text}|{v}|v3".encode()).hexdigest()[:12]
    out = f"{BUILD}/tts/{voice}_{key}.wav"
    if not os.path.exists(out):
        import urllib.request, ssl
        mp3 = out.replace(".wav", ".mp3")
        body = json.dumps(dict(text=text, model_id="eleven_v3", voice_settings=dict(stability=0.5))).encode()
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{v['el']}?output_format=mp3_44100_128", data=body,
                                     headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("ELEVEN_API_KEY", "proxy-injected")})
        ctx = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE", "/root/.ccr/ca-bundle.crt"))
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, context=ctx, timeout=120) as r:
                    open(mp3, "wb").write(r.read())
                break
            except Exception as e:
                err = e
        else:
            raise RuntimeError(f"ElevenLabs failed for {voice}: {err} {getattr(err, 'read', lambda: b'')()[:300]}")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-af", f"aresample={SR}", "-ac", "1", out], check=True)
    x = read_wav(out)
    # обрезка тишины по краям
    idx = np.where(np.abs(x) > 0.01)[0]
    x = x[max(idx[0] - 300, 0): idx[-1] + 600]
    dry = len(x) / SR
    # обработка по типу голоса
    if voice == "R":
        x = bp(x, 400, 3200); x = np.tanh(x * 3) * 0.6
        x = x + hp(rng.standard_normal(len(x)), 3000) * 0.02
    elif voice in ("L_wh", "N_wh", "T_wh"):
        x = reverb(hp(x, 120), 0.5, 0.12)
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


def roar(d=3.2):
    t = tt(d); k = t / d
    f0 = 70 + 50 * np.sin(np.pi * np.minimum(k * 1.3, 1)) - 25 * k
    ph = 2 * np.pi * np.cumsum(f0) / SR
    x = signal.sawtooth(ph) + 0.6 * signal.sawtooth(ph * 1.5 + 1) + 0.4 * signal.sawtooth(ph * 0.5)
    growl = 1 + 0.6 * np.sin(2 * np.pi * 23 * t) * rng.uniform(.5, 1)
    x = x * growl
    out = np.zeros(len(t)); seg = 2048
    for i in range(0, len(t), seg):
        kk = i / len(t); c = 300 + 1400 * np.sin(np.pi * min(kk * 1.2, 1))
        out[i:i + seg] = bp(x[max(0, i - 4096):i + seg], c * .5, c * 2)[-len(x[i:i + seg]):]
    out += bp(noise(d), 200, 2500) * 1.2 * np.sin(np.pi * k) ** .5
    sub = np.sin(2 * np.pi * (40 - 10 * k) * t) * 1.5
    env = np.minimum(t / .25, 1) * np.minimum(1, (d - t) / .8)
    return norm(reverb((out + sub) * env, 3.0, 0.45)[: len(t)], 1)


def siren(d):
    t = tt(d)
    f = 520 + 330 * (0.5 - 0.5 * np.cos(2 * np.pi * t / 5))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return norm(reverb(x * np.minimum(t / 1.5, 1), 2.5, 0.5)[: len(t)], 1)


def helicopter(d):
    t = tt(d)
    pulses = (np.sin(2 * np.pi * 13 * t) > 0.6).astype(float)
    x = lp(noise(d), 400) * lp(pulses, 60) * 3 + lp(noise(d), 120) * 0.5
    return norm(x * np.minimum(t / 1.0, 1), 1)


def glass(d=1.4):
    n = int(d * SR); out = np.zeros(n)
    out[: int(.15 * SR)] += hp(noise(.15), 2000) * np.exp(-tt(.15) / .05) * 2
    for i in range(70):
        s0 = int(rng.uniform(0, d - .2) * SR); tl = tt(.12); fq = rng.uniform(2500, 7000)
        out[s0:s0 + len(tl)] += np.sin(2 * np.pi * fq * tl) * np.exp(-tl / .02) * rng.uniform(.2, .8)
    return norm(reverb(out, 1.0, .3)[:n], 1)


def braam(d=3.0, root=36.7):
    t = tt(d)
    x = sum(signal.sawtooth(2 * np.pi * f * t) for f in (root, root * 1.006, root * 2, root * 2.997, root * 1.5))
    cut = 150 + 1200 * np.exp(-t / .5)
    out = np.zeros(len(t)); seg = 2048
    for i in range(0, len(t), seg):
        out[i:i + seg] = lp(x[max(0, i - 4096):i + seg], cut[i])[-len(x[i:i + seg]):]
    env = np.minimum(t / .05, 1) * np.exp(-t / (d * .6))
    return norm(reverb(out * env, 2.5, .4)[: len(t)], 1)


def taiko():
    t = tt(1.2)
    return norm(np.sin(2 * np.pi * (90 * np.exp(-t * 8) + 45) * t) * np.exp(-t / .25) + lp(noise(1.2), 500) * np.exp(-t / .04), 1)


def alert_tone(d=1.6):
    t = tt(d)
    x = (np.sin(2 * np.pi * 853 * t) + np.sin(2 * np.pi * 960 * t)) * (np.sin(2 * np.pi * 2 * t) > -0.2)
    return norm(x, 1)


def bubbles(d):
    out = np.zeros(int(d * SR))
    for i in range(int(d * 12)):
        s0 = int(rng.uniform(0, d - .2) * SR); tl = tt(.15); f = rng.uniform(150, 500)
        out[s0:s0 + len(tl)] += np.sin(2 * np.pi * f * (1 + tl * 6) * tl) * np.exp(-tl / .04)
    return norm(lp(out, 2000), 1)


def rumble(d):
    t = tt(d)
    return norm(lp(noise(d), 80) * (0.6 + 0.4 * np.sin(2 * np.pi * .3 * t)) + np.sin(2 * np.pi * 31 * t) * .3, 1)


def crowd(d):
    t = tt(d); x = np.zeros(len(t))
    for i in range(8):
        x += bp(noise(d), rng.uniform(300, 600), rng.uniform(1200, 2500)) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(.5, 2) * t + i))
    return norm(x, 1)


# ---------------------------------------------------------------- ТАЙМЛАЙН
def chunks_of(text):
    import re
    text = re.sub(r"\[[^\]]*\]\s*", "", text).strip()
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
                style = "radio" if ln["voice"] == "R" else "whisper" if ln["voice"] in ("L_wh", "N_wh", "T_wh") else ("mom" if ln["voice"] == "M" else ("dima" if ln["voice"] == "D" else "normal"))
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
    add(0, rumble(cut), 0.12)
    add(SH["alert"], alert_tone(1.8), 0.22)
    add(SH["alert"] + .3, rumble(2.5), 0.35)
    add(SH["chance7"], braam(2.0), 0.5)
    add(SH["chance7"], static(.2), .3)
    add(SH["rewind"], static(1.5, .9) * np.linspace(.6, 1, int(1.5 * SR)), .18)
    add(SH["rewind"], riser(1.4)[::-1].copy(), .25)
    add(S["calm"]["start"], wind(span("calm", "calm")), .08)
    add(S["calm"]["start"], pad(span("calm", "night"), 65.4), .07)
    add(SH["cup"] + .2, rumble(2.0), .3)
    add(S["night"]["start"], wind(span("night", "night")), .1)
    add(SH["glow_water"], bubbles(span("night", "night") - 2), .12)
    add(SH["shadow_under"], heartbeat(), .3); add(SH["shadow_under"] + .9, heartbeat(), .3)
    add(SH["shadow_top"], braam(2.5, 30.9), .3)
    add(SH["blackout"] + .5, boom(), .4)
    add(SH["blackout"] + .5, buzz(.3) * np.linspace(1, 0, int(.3 * SR)), .15)
    # подъём
    add(S["rise"]["start"], rumble(span("rise", "rise")), .35)
    add(SH["ridge"], braam(3.0), .45)
    add(SH["head_rise"], riser(1.5), .2)
    for k in range(3):
        add(SH["head_rise"] + k * .8, taiko(), .4)
    add(SH["roar"], roar(3.4), .85)
    add(SH["roar"] + .4, glass(1.6), .4)
    add(SH["glass"], glass(1.2), .3)
    # паника
    add(S["panic"]["start"], siren(span("panic", "twist")), .16)
    add(SH["crowd"], crowd(span("panic", "panic") - (SH["crowd"] - S["panic"]["start"])), .12)
    add(SH["helis"], helicopter(span("panic", "twist") - (SH["helis"] - S["panic"]["start"])), .18)
    add(SH["bridge"], boom(), .5); add(SH["bridge"] + .2, creak(1.5, 15, 30, .4), .4)
    add(SH["phone_mom"], ping(), .3)
    add(SH["run_to"], braam(2.0), .35)
    k = SH["run_to"]
    while k < S["panic"]["end"]:
        add(k, step(), .3); k += .27
    for k in range(4):
        add(S["panic"]["start"] + 2 + k * 2.4, taiko(), .3)
    # поворот
    add(SH["radar"], beep(), .3)
    add(S["twist"]["start"], pad(span("twist", "twist"), 55.0), .12)
    add(SH["shield"], braam(3.0, 41.2), .35)
    # схватка
    add(S["fight"]["start"], rumble(span("fight", "fight")), .45)
    add(SH["boil"], bubbles(3.0), .35)
    add(SH["dark_rise"], braam(3.5, 27.5), .6)
    add(SH["dark_close"], stinger(2.5), .35)
    add(SH["glow_max"] - 1.0, riser(1.1), .35)
    add(SH["glow_max"], roar(2.8), .6)
    add(SH["impact"], boom(), .9); add(SH["impact"], glass(1.5), .4); add(SH["impact"] + .05, static(.3), .3)
    add(SH["impact"], whoosh(1.2), .5)
    for k in range(6):
        add(S["fight"]["start"] + .5 + k * 1.6, taiko(), .35)
    # финал
    add(SH["alert2"] + 1.2, alert_tone(1.2), .2)
    add(SH["eye"] - .1, braam(3.0, 32.7), .45)
    add(SH["eye_close"], heartbeat(), .3); add(SH["eye_close"] + 1.0, heartbeat(), .3)
    add(SH["eye_close"], music_box(cut - SH["eye_close"]), .1)
    add(SH["eye_close"] + .5, rumble(cut - SH["eye_close"]) , .25)
    add(cut - .05, static(.05, 1.0), .5)

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
