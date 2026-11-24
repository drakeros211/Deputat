#!/bin/bash
# Полная сборка серии: звук -> графика -> кадры -> mp4.
# Использование: VOICES=<папка с голосами Piper> PY=<python с sherpa-onnx и scipy> ./make.sh
set -e
cd "$(dirname "$0")"
${PY:-python3} audio.py "$VOICES"
python3 assets.py
node render.js --workers 4
ffmpeg -v error -y -f concat -safe 0 -i build/parts.txt -c copy build/video_noaudio.mp4
ffmpeg -v error -y -i build/video_noaudio.mp4 -i build/audio_raw.wav \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:v copy -c:a aac -b:a 192k -ar 44100 -shortest \
  -movflags +faststart palata33.mp4
echo "готово: $(pwd)/palata33.mp4"
