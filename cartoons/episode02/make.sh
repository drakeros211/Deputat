#!/bin/bash
# Сборка «Глубинный»: PY=<python с edge-tts и scipy> EDGE_TTS=<путь к edge-tts> ./make.sh
set -e
cd "$(dirname "$0")"
EDGE_TTS=${EDGE_TTS:-edge-tts} ${PY:-python3} audio.py
python3 assets_k.py
node render.js --workers 4
ffmpeg -v error -y -f concat -safe 0 -i build/parts.txt -c copy build/video_noaudio.mp4
ffmpeg -v error -y -i build/video_noaudio.mp4 -i build/audio_raw.wav \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:v copy -c:a aac -b:a 192k -ar 44100 -shortest \
  -movflags +faststart glubinny.mp4
