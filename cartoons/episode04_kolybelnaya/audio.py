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
    dict(id="hook", pre=0.8, post=0.3, shots0=["monitor_dark"], lines=[
        Ln("LUL", "[sings softly] Баю-баюшки-баю...", None, 0.3, ["monitor_dark"]),
        Ln("LUL_wh", "[whispers] Тёма... а ты почему не спишь?", None, 0, ["monitor_close"])]),
    dict(id="flash", pre=1.3, post=0, shots0=["chance"], lines=[]),
    dict(id="rewind", pre=1.5, post=0, shots0=["rewind"], lines=[]),
    dict(id="evening", pre=0.2, post=0.2, lines=[
        Ln("M", "[hurried] Тём, я на смену. Посиди с Варей. Радионяня с камерой. Если заплачет — подойди.", None, 0.2, ["mom_door", "monitor_table"]),
        Ln("T", "[casually] Окей, мам. Варе два года, она спит как убитая.", None, 0.1, ["varya_crib"]),
        Ln("T", "[happy] А у меня наушники, чипсы и игра. Идеальная ночь.", None, 0, ["tyoma_game"])]),
    dict(id="noise", pre=0.2, post=0.2, lines=[
        Ln("T", "Где-то после двух радионяня начала шипеть.", None, 0.2, ["monitor_static"]),
        Ln("T", "[laughs] Я подумал — соседи. Радионяни ловят чужие голоса, такое бывает.", None, 0.3, ["tyoma_laugh"]),
        Ln("T", "[nervous] В шорохах кто-то дышал. Медленно. Прямо у микрофона.", None, 0.3, ["monitor_breath"], meter=85),
        Ln("T", "[whispers] А Варя во сне засмеялась. Как будто ей кто-то корчил рожицы.", None, 0, ["varya_laugh"])]),
    dict(id="lullaby", pre=1.6, post=0.2, shots0=["clock3"], lines=[
        Ln("LUL", "[sings softly] Баю-баюшки-баю, не ложися на краю...", None, 0.3, ["monitor_song", "hall_walk"]),
        Ln("T", "[whispers] Я пошёл в детскую. Варя спала одна.", None, 0.2, ["nursery_dark"]),
        Ln("T", "[scared] А карусель над кроваткой... крутилась сама.", None, 0, ["mobile_spin"], meter=70)]),
    dict(id="camera", pre=0.2, post=0.9, lines=[
        Ln("T", "[whispers] Я включил на радионяне видео.", None, 0.2, ["monitor_video_on"]),
        Ln("T", "[terrified] Над кроваткой стояла высокая худая фигура. И качала её.", None, 0.3, ["cam_figure", "cam_figure_close"], meter=45),
        Ln("T", "[whispers] Камера показывала прямой эфир. Прямо сейчас.", None, 0.3, ["cam_live"]),
        Ln("T", "[whispers] Я заглянул в детскую. Пусто. Но кроватка качалась.", None, 0.3, ["crib_rocking"]),
        Ln("T", "[barely audible] А фигура на экране поднесла палец к губам.", None, 0, ["cam_shh"])]),
    dict(id="sms", pre=0.2, post=0.2, lines=[
        Ln("T", "[panicked] Я звонил маме. Она не брала.", None, 0.2, ["call_mom"]),
        Ln("T", "А потом пришло сообщение.", None, 1.2, ["sms"]),
        Ln("LUL_wh", "[whispers] Мальчик... а как тебя зовут?", None, 0.3, ["monitor_close2"]),
        Ln("T", "[whispers] Я зажал себе рот рукой.", None, 0.5, ["tyoma_mouth"]),
        Ln("LUL_wh", "[whispers] Ничего. Я знаю.", None, 0, ["monitor_close3"], meter=25)]),
    dict(id="escape", pre=0.2, post=0.3, lines=[
        Ln("T", "[breathless] Я схватил Варю и пошёл к двери.", None, 0.2, ["grab_varya", "hall_run"]),
        Ln("T", "[terrified] На экране фигура медленно повернула голову. Прямо в камеру.", None, 0.5, ["cam_turn"]),
        Ln("T", "[terrified] Песня звучала уже не из радионяни. А из коридора.", None, 0.3, ["hall_song"], meter=10),
        Ln("T", "[breathless] Щелчок замка. Подъезд. Лестница.", None, 0, ["door_lock", "stairs"])]),
    dict(id="street", pre=0.8, post=1.0, lines=[
        Ln("T", "[crying] Светало. Я прижал Варю. Всё. Мы ушли.", None, 0, ["street_dawn"], meter=90)]),
    dict(id="mom", pre=0.3, post=0.3, lines=[
        Ln("M", "[shocked] Тёма?! Ты что тут делаешь в шесть утра с Варей?!", None, 0.2, ["mom_taxi"]),
        Ln("T", "[crying] Мам... там женщина пела...", None, 0.4, ["tyoma_cry"]),
        Ln("M", "[confused] Тём... это я пела. У радионяни есть приложение. Я всю ночь смотрела на вас. Ты уснул в два сорок.", "Тём... это я пела. У радионяни есть приложение. Я всю ночь смотрела на вас. Ты уснул в 2:40.", 0, ["mom_phone", "mom_close"])]),
    dict(id="twist", pre=0.3, post=0.0, lines=[
        Ln("T", "[whispers] А кто тогда стоял над кроваткой?", None, 0.3, ["tyoma_ask"]),
        Ln("LUL_T", "[sings softly] Баю-баюшки-баю...", None, 1.4, ["recording"], meter=2),
        Ln("M", "[whispers] Тём... откуда ты знаешь эту колыбельную? Её пела моя мама. Она умерла до твоего рождения.", None, 0.4, ["mom_scared", "recording_shh"])]),
]
END_CUT_FRACTION = 1.0
TAIL_BLACK = 0.8

VOICE = {  # ElevenLabs eleven_v3
    "T":      dict(el="Uv3rf12Omd9Asyv54Bqw"),   # Тёма — Max
    "M":      dict(el="0ArNnoIAWKlT4WweaVMY"),   # мама — Elena Gromova
    "LUL":    dict(el="GN4wbsbejSnGSa1AzjH5"),   # колыбельная — Ekaterina
    "LUL_wh": dict(el="GN4wbsbejSnGSa1AzjH5"),
    "LUL_T":  dict(el="GN4wbsbejSnGSa1AzjH5"),   # тот же голос «изо рта Тёмы»
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
    if voice in ("LUL", "LUL_wh"):
        x = bp(x, 250, 5000); x = np.tanh(x * 1.6) * 0.8          # динамик радионяни
        x = x + hp(rng.standard_normal(len(x)), 2500) * 0.012
        x = reverb(x, 1.2, 0.3)
    elif voice == "LUL_T":
        x2 = np.interp(np.arange(0, len(x), 1.12), np.arange(len(x)), x)   # подмешать «мальчишеский» слой
        y = np.zeros(len(x)); y += x; y[:len(x2)] += x2 * 0.45
        x = reverb(bp(y, 200, 4500), 1.0, 0.3)
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
                style = "creepy" if ln["voice"] in ("LUL", "LUL_wh", "LUL_T") else "mom" if ln["voice"] == "M" else "whisper" if ln["text"].startswith("[whispers]") else ("mom" if ln["voice"] == "M" else ("dima" if ln["voice"] == "D" else "normal"))
                TLn["subs"].append(dict(start=round(ct, 3), end=round(ct + cd, 3), text=c, who=who, style=style))
                ct += cd
            t += d + ln["gap"]
        t += sc["post"]
        TLn["scenes"].append(dict(id=sc["id"], start=round(s_start, 3), end=round(t, 3)))
    cut = t
    total = cut + TAIL_BLACK
    TLn["cut"] = round(cut, 3); TLn["duration"] = round(total, 3)

    nfr = int(total * FPS) + 1
    for spk in ("T", "M"):
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
    def rooster():
        t = tt(1.6); f = np.interp(t, [0, .2, .5, 1.0, 1.6], [500, 900, 1100, 850, 600])
        x = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * np.minimum(t / .05, 1) * np.minimum(1, (1.6 - t) / .3)
        return norm(reverb(bp(x, 400, 3000), 1.5, .4)[:len(t)], 1)

    def knock():
        out = np.zeros(int(1.4 * SR))
        for k, s0 in enumerate((0, .35, .7)):
            t = tt(.25); th = lp(noise(.25), 400) * np.exp(-t / .03) + np.sin(2 * np.pi * 110 * t) * np.exp(-t / .05)
            out[int(s0 * SR):int(s0 * SR) + len(t)] += th
        return norm(reverb(out, .6, .2)[:len(out)], 1)

    def scratch(d):
        x = hp(noise(d), 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt(d)) ** 2)
        return norm(x * np.sin(np.pi * tt(d) / d), 1)

    def crickets(d):
        t = tt(d); x = np.sin(2 * np.pi * 4500 * t) * (np.sin(2 * np.pi * 30 * t) > 0.3) * (np.sin(2 * np.pi * .9 * t) > 0)
        return norm(x, 1)

    def snore(d):
        t = tt(d); env = np.maximum(0, np.sin(2 * np.pi * t / 3.0)) ** 2
        return norm(lp(noise(d), 300) * env * (1 + .5 * np.sin(2 * np.pi * 30 * t)), 1)

    add(0, drone(cut), 0.16)
    add(SH["monitor_dark"], static(1.2, .3), .08)
    add(SH["chance"], stinger(1.5), .45); add(SH["chance"], static(.2), .3)
    add(SH["rewind"], static(1.5, .9) * np.linspace(.6, 1, int(1.5 * SR)), .18); add(SH["rewind"], riser(1.4)[::-1].copy(), .25)
    add(S["evening"]["start"], pad(span("evening", "evening"), 87.3), .05)
    add(SH["tyoma_game"], lp(noise(3), 3000) * .3, .03)
    add(SH["monitor_static"], static(span("noise", "noise"), .5), .07)
    add(SH["monitor_breath"], snore(3.0) if False else lp(noise(3.0), 900) * np.maximum(0, np.sin(2 * np.pi * tt(3.0) / 1.5)) ** 2, .25)
    add(SH["varya_laugh"], stinger(1.4) * np.linspace(.6, 0, int(1.4 * SR)), .12)
    add(SH["clock3"], beep(), .2)
    add(SH["mobile_spin"], music_box(4.0), .18)
    add(SH["cam_figure"], braam(2.5, 36.7), .4)
    add(SH["crib_rocking"], creak(2.5, 20, 35, 1.0), .25)
    add(SH["cam_shh"], stinger(1.8), .3)
    add(SH["sms"] + .1, ping(), .4)
    for k in (SH["monitor_close2"], SH["monitor_close3"]):
        add(k - .3, riser(.4), .15)
    hb = SH["call_mom"]
    while hb < S["escape"]["end"]:
        add(hb, heartbeat(), .3); hb += .75
    add(SH["door_lock"] + .1, creak(.3, 70, 90, 1.6), .4)
    k = SH["stairs"]
    while k < S["escape"]["end"]:
        add(k, step(), .35); k += .3
    add(S["street"]["start"], wind(span("street", "mom")), .07)
    add(S["street"]["start"], pad(span("street", "mom"), 98.0), .06)
    add(SH["mom_taxi"], lp(noise(1.5), 200) * np.linspace(1, 0, int(1.5 * SR)), .2)
    add(SH["recording"] - .2, static(.3), .3)
    add(SH["recording"], braam(3.0, 32.7), .4)
    add(SH["recording_shh"], stinger(2.0), .4)
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
