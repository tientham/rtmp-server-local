# Local RTMP Server [macOS supported]

### Usage

  - yarn
  - yarn start
  - Then from other terminal, launch following command:
  - ffmpeg -re -i <input_mp4_file>.mp4 -c:v libx264 -f flv rtmp://<local_ip_address>/live 

### Additional
