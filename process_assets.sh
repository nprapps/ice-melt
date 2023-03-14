#!/bin/bash

# by default this only processes new files
# if you want to update an existing file, delete the output first
# instructions for how to use this are in the README

# best practices: https://github.com/nprapps/bestpractices/blob/master/assets.md

# set to "error" to suppress logs
ffmpeg_log="error"

# convert images
# requires ImageMagick 7
cd src/assets/synced/images
mkdir -p resized
for img in *.jpg; do
  if [ ! -f resized/$img ]; then
    echo "Processing $img..."
    magick convert $img -resize 1600x1200\> -quality 75 -strip -sampling-factor 4:2:0 -define jpeg:dct-method=float -interlace Plane resized/$img;
  fi
done
for img in *.png; do
  if [ ! -f resized/$img ]; then
    echo "Processing $img..."
    magick convert $img -resize 1600x1200\> \
      -define png:compression-filter=5 \
      -define png:compression-level=9 \
      resized/$img;
  fi
done
for img in *.jpeg; do
  if [ ! -f resized/$img ]; then
    echo "Processing $img..."
    magick convert $img -resize 1600x1200\> \
      -define png:compression-filter=5 \
      -define png:compression-level=9 \
      resized/$img;
  fi
done

# handle silenced video
cd ../video
mkdir -p resized
for video in *.mp4; do
  # create the videos
  if [ ! -f resized/$video ]; then
    echo "Processing $video..."
    ffmpeg -n -nostats -hide_banner -loglevel $ffmpeg_log \
    -i $video \
    -an \
    -vcodec libx264 \
    -preset veryslow \
    -strict -2 \
    -pix_fmt yuv420p \
    -crf 29 \
    -vf scale=1500:-2 \
    -movflags +faststart \
    resized/$video;
  fi

  # create posters
  if [ ! -f resized/$video.jpg ]; then
    echo "Processing poster image for $video..."
    ffmpeg -n -nostats -hide_banner -loglevel $ffmpeg_log \
    -i $video \
    -vf scale=1600:-2 \
    -qscale:v 4 \
    -frames:v 1 \
    resized/$video.jpg;
  fi
done

# convert audio
cd ../audio
mkdir -p resized
for audio in *.mp3; do
  # create the audio
  if [ ! -f resized/$audio ]; then
    echo "Processing $audio..."
    lame -m s -b 96 $audio resized/$audio;
  fi
done

# convert satellite images
# cd ../map-images
# mkdir -p resized
# for img in *.jpg; do
#   echo "Processing $img..."
#   # if [ ! -f $img ]; then
#     magick convert $img -resize 2500x2500\> -quality 75 -strip -sampling-factor 4:2:0 -define jpeg:dct-method=float -interlace Plane resized/$img;
#   # fi
# done

# convert thumbnails
# cd ../thumbnails
# mkdir -p resized
# for img in *.jpg; do
#   echo "Processing $img..."
#   # if [ ! -f $img ]; then
#     magick convert $img -resize 600x600\> -quality 75 -strip -sampling-factor 4:2:0 -define jpeg:dct-method=float -interlace Plane resized/$img;
#   # fi
# done
# for img in *.jpeg; do
#   echo "Processing $img..."
#   # if [ ! -f $img ]; then
#     magick convert $img -resize 600x600\> -quality 75 -strip -sampling-factor 4:2:0 -define jpeg:dct-method=float -interlace Plane resized/$img;
#   # fi
# done
