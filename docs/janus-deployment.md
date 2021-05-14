# Janus deployment on Ubuntu 20.04

This tutorial should work on Ubuntu 20.04 on a GCP instance or Scaleway instance.

You need to build from source several components: libwebsocket, libsrtp, libnice, usrsctp, janus-gateway and janus-plugin-sfu.

You can follow the build instructions below but you should use latest versions if possible to have the latest security updates.
This documentation won't necessary be updated.

Look at the [README history of janus-gateway](https://github.com/meetecho/janus-gateway/commits/master/README.md) to see if the build instructions
for some components changed, this happened several times. The build instructions below was up to date the Mar 25, 2021.
Look at the changes in master or releases in the different repositories of the components you need to build to see if you can update them.

Follow at least the [janus-gateway](https://github.com/meetecho/janus-gateway) and the [https://github.com/mozilla/janus-plugin-sfu](janus-plugin-sfu) repositories and the [janus mailing-list](https://groups.google.com/g/meetecho-janus) for updates.

Historical note: janus-gateway may change its API version and both [janus-plugin-rs](https://github.com/mozilla/janus-plugin-rs)
(the C to Rust binding) and janus-plugin-sfu (Rust only) may need to be adapted.
It was the case for the janus upgrade from 0.9.x to 0.10.x (api_version 14 to 15).
You may look at the [PR #61](https://github.com/mozilla/janus-plugin-sfu/pull/61) for
some pointers how to do that if you want to contribute the next needed upgrade.

## Automatic security upgrades with unattended-upgrades (optional)

It depends of the security policy and machine image update policy you have.
If you're using immutable machine image and redeploy image updates regularly,
you can skip it. Otherwise I advice you to enable security updates automatically.
This may be already configured or not based on the cloud provider you use.

Install the packages:

    apt install unattended-upgrades update-notifier-common

Edit the file:

    vi /etc/apt/apt.conf.d/50unattended-upgrades

and configure:

    Unattended-Upgrade::Automatic-Reboot "true";
    Unattended-Upgrade::Automatic-Reboot-Time "08:00";

Create the file:

    vi /etc/apt/apt.conf.d/20auto-upgrades

to add the following content:

    APT::Periodic::Update-Package-Lists "1";
    APT::Periodic::Unattended-Upgrade "1";

This should get you covered, but please verify yourself some days later that
the security updates are done! You can look at the file
`/var/log/apt/history.log` to see if packages has been updated.

Please note that the components you build in the next section are not covered
by this automatic security updates, you will need to verify regularly yourself
if there are security issues in those components, rebuild them and restart the
service.

## Build it

Here are the build instructions that produced a good working deployment at the
time of writing this tutorial:

```
sudo apt-get -y update && sudo apt-get install -y libmicrohttpd-dev \
    libjansson-dev \
    libssl-dev \
    libglib2.0-dev \
    libopus-dev \
    libogg-dev \
    libconfig-dev \
    libssl-dev \
    pkg-config \
    gengetopt \
    libtool \
    automake \
    build-essential \
    subversion \
    git \
    cmake \
    unzip \
    zip \
    cargo \
    wget

cd /tmp
LIBWEBSOCKET="3.2.3" && wget https://github.com/warmcat/libwebsockets/archive/v$LIBWEBSOCKET.tar.gz && \
tar xzvf v$LIBWEBSOCKET.tar.gz && \
cd libwebsockets-$LIBWEBSOCKET && \
mkdir build && \
cd build && \
cmake -DLWS_MAX_SMP=1 -DLWS_WITHOUT_EXTENSIONS=0 -DCMAKE_INSTALL_PREFIX:PATH=/usr -DCMAKE_C_FLAGS="-fpic" .. && \
make && sudo make install

cd /tmp
SRTP="2.3.0" && wget https://github.com/cisco/libsrtp/archive/v$SRTP.tar.gz && \
tar xfv v$SRTP.tar.gz && \
cd libsrtp-$SRTP && \
./configure --prefix=/usr --enable-openssl && \
make shared_library && sudo make install

cd /tmp
# libnice 2021-02-21 11:10 (post 0.1.18)
sudo apt-get -y --no-install-recommends install ninja-build meson && \
sudo apt-get remove -y libnice-dev libnice10 && \
sudo apt-get install -y gtk-doc-tools libgnutls28-dev && \
git clone https://gitlab.freedesktop.org/libnice/libnice && \
cd libnice && \
git checkout 36aa468c4916cfccd4363f0e27af19f2aeae8604 && \
meson --prefix=/usr build && \
ninja -C build && \
sudo ninja -C build install

cd /tmp
# datachannel build
# Jan 13, 2021 0.9.5.0 07f871bda23943c43c9e74cc54f25130459de830
git clone https://github.com/sctplab/usrsctp.git && cd usrsctp && \
git checkout 0.9.5.0 && \
./bootstrap && \
./configure --prefix=/usr --disable-programs --disable-inet --disable-inet6 && \
make && sudo make install

cd /tmp
# 2021-04-06 12:36 d52e33259de3088ff964440fafd17ca58f8ba9bc (v0.11.1)
git clone https://github.com/meetecho/janus-gateway.git && cd janus-gateway && \
git checkout d52e33259de3088ff964440fafd17ca58f8ba9bc && \
sh autogen.sh && \
CFLAGS="${CFLAGS} -fno-omit-frame-pointer" ./configure --prefix=/usr \
--disable-all-plugins --disable-all-handlers && \
make && sudo make install && sudo make configs

cd /tmp
git clone -b master https://github.com/mozilla/janus-plugin-sfu.git && cd janus-plugin-sfu && \
cargo build --release && \
sudo mkdir -p /usr/lib/janus/plugins && \
sudo mkdir -p /usr/lib/janus/events && \
sudo cp /tmp/janus-plugin-sfu/target/release/libjanus_plugin_sfu.so /usr/lib/janus/plugins && \
sudo cp /tmp/janus-plugin-sfu/janus.plugin.sfu.cfg.example /usr/etc/janus/janus.plugin.sfu.cfg
```

## Configure it

`/usr/etc/janus/janus.jcfg` config file (keep the original but change these values):

```
general: {
  session_timeout = 38
  debug_level = 4  # use 5 to have more logs
  debug_timestamps = true
  admin_secret = "CHANGE_IT"
}
media: {
  rtp_port_range = "51610-65535"
}
nat: {
  nice_debug = false  # set it to true to have more logs
  ignore_mdns = true
  nat_1_1_mapping = "YOUR_PUBLIC_IP"
}
transports: {
  disable = "libjanus_pfunix.so"
}
```

About the `session_timeout = 38` value, see [this discussion](https://github.com/mozilla/janus-plugin-sfu/pull/73#issuecomment-776649237).

`/usr/etc/janus/janus.transport.websockets.jcfg` config file (these values only):

```
general: {
  json = "indented"
  ws = true
  ws_port = 8188
  wss = false
}

admin: {
  admin_ws = false
  admin_ws_port = 7188
  admin_wss = false
}

certificates: {
}
```

You can change some options like `max_room_size` option in `/usr/etc/janus/janus.plugin.sfu.cfg`

example:

```
[general]
max_room_size = 15
max_ccu = 1000
message_threads = 3
```

## Security rules

For GCP, you need to open 443 TCP and the rtp port range 51610-65535 UDP for Ingress and Egress in your firewall rules.

For Scaleway, you need to open 443 TCP and have a stateful security group for the rtp port range to work.

Add a DNS A record preprod.example.com to your public ip.
Of course modify preprod.example.com by a subdomain you own and replace it by your subdomain in the instructions and config files.

## Verify janus is starting

Now to test, in your ssh terminal run:

    janus

When you start janus, with a working deployment you should have something like this:

```
Janus commit: caaba91081ba8e5578a24bca1495a8572f08e65c
Compiled on:  Tue Mar 16 08:37:18 UTC 2021

Logger plugins folder: /usr/lib/janus/loggers
[WARN] 	Couldn't access logger plugins folder...
---------------------------------------------------
  Starting Meetecho Janus (WebRTC Server) v0.11.1
---------------------------------------------------

Checking command line arguments...
Debug/log level is 4
Debug/log timestamps are enabled
Debug/log colors are enabled
[Sat Apr  3 09:15:18 2021] Adding 'vmnet' to the ICE ignore list...
[Sat Apr  3 09:15:18 2021] Using x.x.x.x as local IP...
[Sat Apr  3 09:15:18 2021] Token based authentication disabled
[Sat Apr  3 09:15:18 2021] Initializing recorder code
[Sat Apr  3 09:15:18 2021] RTP port range: 51610 -- 65535
[Sat Apr  3 09:15:18 2021] Using nat_1_1_mapping for public IP: YOUR_PUBLIC_IP
[Sat Apr  3 09:15:18 2021] Initializing ICE stuff (Full mode, ICE-TCP candidates disabled, half-trickle, IPv6 support disabled)
[Sat Apr  3 09:15:18 2021] ICE port range: 51610-65535
[Sat Apr  3 09:15:18 2021] [WARN] mDNS resolution disabled, .local candidates will be ignored
[Sat Apr  3 09:15:18 2021] Configuring Janus to use ICE aggressive nomination
[Sat Apr  3 09:15:18 2021] Crypto: OpenSSL >= 1.1.0
[Sat Apr  3 09:15:18 2021] No cert/key specified, autogenerating some...
[Sat Apr  3 09:15:18 2021] Fingerprint of our certificate: FA:B9:C7:D9:9F:C8:58:0D:30:34:34:B4:57:1C:E5:0C:10:A2:AA:3F:A9:7F:A3:18:0B:05:BC:79:9D:CF:D2:AF
[Sat Apr  3 09:15:18 2021] Event handler plugins folder: /usr/lib/janus/events
[Sat Apr  3 09:15:18 2021] Sessions watchdog started
[Sat Apr  3 09:15:18 2021] Setting event handlers statistics period to 5 seconds
[Sat Apr  3 09:15:18 2021] Plugins folder: /usr/lib/janus/plugins
[Sat Apr  3 09:15:18 2021] Loading plugin 'libjanus_plugin_sfu.so'...
[Sat Apr  3 09:15:18 2021] Joining Janus requests handler thread
[Sat Apr  3 09:15:18 2021] Loaded SFU plugin configuration: Config { auth_key: None, max_room_size: 15, max_ccu: 1000, message_threads: 3 }
[Sat Apr  3 09:15:18 2021] Janus SFU plugin initialized!
[Sat Apr  3 09:15:18 2021] Transport plugins folder: /usr/lib/janus/transports
[Sat Apr  3 09:15:18 2021] [WARN] Transport plugin 'libjanus_pfunix.so' has been disabled, skipping...
[Sat Apr  3 09:15:18 2021] Loading transport plugin 'libjanus_http.so'...
[Sat Apr  3 09:15:18 2021] HTTP transport timer started
[Sat Apr  3 09:15:18 2021] Admin/monitor HTTP webserver started (port 8088, /admin path listener)...
[Sat Apr  3 09:15:18 2021] JANUS REST (HTTP/HTTPS) transport plugin initialized!
[Sat Apr  3 09:15:18 2021] Loading transport plugin 'libjanus_websockets.so'...
[Sat Apr  3 09:15:18 2021] [WARN] libwebsockets has been built without IPv6 support, will bind to IPv4 only
[Sat Apr  3 09:15:18 2021] libwebsockets logging: 0
[Sat Apr  3 09:15:18 2021] WebSockets server started (port 8188)...
[Sat Apr  3 09:15:18 2021] JANUS WebSockets transport plugin initialized!
[Sat Apr  3 09:15:18 2021] WebSockets thread started
```

stop it with ctrl+c

## Start janus as a service

To start janus when the machine boots up, you can start janus as a systemd service with a janus user.
First log in as root:

    sudo -i

Create a file `/etc/systemd/system/janus.service` with this content:

```
[Unit]
Description=Janus WebRTC Server
Documentation=https://janus.conf.meetecho.com/
After=network.target

[Service]
Type=forking
User=janus
ExecStart=/usr/bin/janus -ob --log-stdout
Restart=on-failure
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

Thanks to this [comment](https://github.com/meetecho/janus-gateway/pull/2591#issuecomment-812480322) for the example.

And start the service like that:

```
addgroup --system janus
adduser --system --home / --shell /bin/false --no-create-home --ingroup janus --disabled-password --disabled-login janus
systemctl daemon-reload # to take into account the /etc/systemd/system/janus.service file
systemctl start janus
systemctl enable janus
systemctl status janus
```

Logs will be in journald. To consult the logs:

    journalctl -f -u janus.service --since today

To limit the logs that are kept, write for example `SystemMaxUse=100M` in `/etc/systemd/journald.conf`
Use `journalctl --vacuum-size=100M` to force purging the logs now.
More info on https://unix.stackexchange.com/questions/139513/how-to-clear-journalctl

## install nodejs LTS

Install nodejs LTS (14.x) from https://github.com/nodesource/distributions

Execute this:

    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs

## download examples

Connected as the ubuntu user:

    git clone https://github.com/networked-aframe/naf-janus-adapter
    cd naf-janus-adapter

Do a build if last build in the repo is not recent enough:

    npm install
    npm run build

Copy the dist folder in the examples folder so nginx can find it:

    cp -rf dist examples/

modify the serverURL url in the html file `examples/index.html` with `wss://preprod.example.com/janus`

## nginx configuration

Install nginx and certbot:

    sudo apt-get install -y nginx python3-certbot-nginx

Generate letsencrypt certificate first while you still have `/etc/nginx/sites-enabled/default`:

    sudo certbot certonly --deploy-hook "nginx -s reload" --webroot -w /var/www/html -d preprod.example.com

Create the `/etc/nginx/dhparam.pem` file:

    sudo curl --silent -o /etc/nginx/dhparam.pem https://ssl-config.mozilla.org/ffdhe2048.txt

Create `/etc/nginx/sites-available/site`:

```
server {
  listen      [::]:80;
  listen      80;
  server_name preprod.example.com;
  # allow letsencrypt
  location ~ /\.well-known {
    allow all;
    root /var/www/html;
    try_files $uri $uri/ =404;
  }
  return 301 https://preprod.example.com$request_uri;
}

server {
  listen      [::]:443 ssl http2;
  listen      443 ssl http2;
  server_name preprod.example.com;
  keepalive_timeout   70;
  root /home/ubuntu/naf-janus-adapter/examples;
  # allow letsencrypt
  location ~ /\.well-known {
    allow all;
    root /var/www/html;
    try_files $uri $uri/ =404;
  }
  location /janus {
    proxy_pass http://127.0.0.1:8188;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
  location / {
    root /home/ubuntu/naf-janus-adapter/examples;
  }
  ssl_certificate /etc/letsencrypt/live/preprod.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/preprod.example.com/privkey.pem;
  ssl_session_timeout 1d;
  ssl_session_cache shared:MozSSL:10m;  # about 40000 sessions
  ssl_session_tickets off;  # curl https://ssl-config.mozilla.org/ffdhe2048.txt > /etc/nginx/dhparam.pem
  ssl_dhparam /etc/nginx/dhparam.pem;  # see https://ssl-config.mozilla.org/#server=nginx&server-version=1.14.0&config=intermediate
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers off;  # HSTS (ngx_http_headers_module is required) (15768000 seconds = 6 months)
  add_header Strict-Transport-Security max-age=15768000;  ssl_stapling on;
  ssl_stapling_verify on;
  ssl_trusted_certificate /etc/letsencrypt/live/preprod.example.com/chain.pem;
  resolver 8.8.8.8 8.8.4.4;
}
```

In the nginx conf above, change the path /home/ubuntu/naf-janus-adapter/examples if necessary.

Enable the new config:

    ln -s /etc/nginx/sites-available/site /etc/nginx/sites-enabled/site
    rm /etc/nginx/sites-enabled/default
    nginx -t
    systemctl restart nginx

You can do a quick check of your nginx conf
If you go to https://preprod.example.com/janus and it shows 403, then the
websocket part is probably ok.

Go to https://preprod.example.com to access the example.

## Testing the example

In browser logs you should see:

```
connecting to wss://preprod.example.com/janus
broadcastDataGuaranteed called without a publisher
broadcastData called without a publisher
pub waiting for sfu
pub waiting for data channels & webrtcup
Sending new offer for handle: n {session: r, id: 483089393870788}
ICE state changed to connected
pub waiting for join
Sending new offer for handle: n {session: r, id: 483089393870788}
publisher ready
ICE state changed to connected
new server time offset: -193.45ms
```

In janus logs you should have something like this:

```
[Sat Apr  3 09:21:41 2021] Processing JSEP offer from 0x7fdf10004ef0: Sdp { v=0
o=- 4998836701810448042 2 IN IP4 1.1.1.1
s=-
t=0 0
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 1.1.1.1
a=sendrecv
 }
[Sat Apr  3 09:21:41 2021] [WARN] [483089393870788] Failed to add some remote candidates (added 0, expected 1)
[Sat Apr  3 09:21:41 2021] [483089393870788] The DTLS handshake has been completed
[Sat Apr  3 09:21:41 2021] WebRTC media is now available on 0x7fdf10004ef0.
[Sat Apr  3 09:21:41 2021] Processing join-time subscription from 0x7fdf10004ef0: Subscription { notifications: true, data: true, media: None }.
[Sat Apr  3 09:21:42 2021] [483089393870788] Negotiation update, checking what changed...
[Sat Apr  3 09:21:42 2021] Processing JSEP offer from 0x7fdf10004ef0: Sdp { v=0
o=- 4998836701810448042 3 IN IP4 1.1.1.1
s=-
t=0 0
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 1.1.1.1
a=sendrecv
m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126
c=IN IP4 1.1.1.1
a=sendrecv
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid
a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id
a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id
a=rtpmap:111 opus/48000/2
a=rtcp-fb:111 transport-cc
a=fmtp:111 minptime=10;useinbandfec=1;usedtx=1;stereo;sprop-stereo
a=rtpmap:103 ISAC/16000
a=rtpmap:104 ISAC/32000
a=rtpmap:9 G722/8000
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:106 CN/32000
a=rtpmap:105 CN/16000
a=rtpmap:13 CN/8000
a=rtpmap:110 telephone-event/48000
a=rtpmap:112 telephone-event/32000
a=rtpmap:113 telephone-event/16000
a=rtpmap:126 telephone-event/8000
 }
[Sat Apr  3 09:21:42 2021] [WARN] [483089393870788] Failed to add some remote candidates (added 0, expected 1)
# When I close the window
[Sat Apr  3 09:48:36 2021] Hanging up WebRTC media on 0x7fdf10004ef0.
[Sat Apr  3 09:48:36 2021] [483089393870788] WebRTC resources freed; 0x7fdf34001a70 0x7fdf34001920
[Sat Apr  3 09:48:36 2021] [WSS-0x7fdf10000b20] Destroying WebSocket client
[Sat Apr  3 09:48:36 2021] Destroying session 7233936804242019; 0x7fdf34001920
[Sat Apr  3 09:48:36 2021] Detaching handle from Janus SFU plugin; 0x7fdf34001a70 0x7fdf10004ef0 0x7fdf34001a70 0x7fdf340017d0
[Sat Apr  3 09:48:36 2021] Destroying SFU session 0x7fdf10004ef0...
[Sat Apr  3 09:48:36 2021] [483089393870788] Handle and related resources freed; 0x7fdf34001a70 0x7fdf34001920
```

In the websocket messages exchanged, you have this (open Chrome Network tab,
and on the websocket resource, click on Messages tab):

```
{"janus":"create","transaction":"0"}
{"janus": "success","transaction": "0","data": {"id": 4332580640433269}}
{"session_id":4332580640433269,"janus":"attach","transaction":"1","plugin":"janus.plugin.sfu","force-bundle":true,"force-rtcp-mux":true}
{"janus": "success","session_id": 4332580640433269,"transaction": "1","data": {"id": 2534645948739130}}
{"session_id":4332580640433269,"janus":"message","transaction":"2","handle_id":2534645948739130,"body":{},"jsep":{"type":"offer","sdp":"..."}}
{"session_id":4332580640433269,"janus":"trickle","transaction":"3","handle_id":2534645948739130,"candidate":{"candidate":"...","sdpMid":"0","sdpMLineIndex":0}}
{"session_id":4332580640433269,"janus":"trickle","transaction":"4","handle_id":2534645948739130,"candidate":{"candidate":"...","sdpMid":"0","sdpMLineIndex":0}}
{"session_id":4332580640433269,"janus":"trickle","transaction":"5","handle_id":2534645948739130,"candidate":{"candidate":"candidate:2087201215 1 udp 2122129151 MY_IP 39264 typ host generation 0 ufrag Ts8C network-id 2","sdpMid":"0","sdpMLineIndex":0}}
{"janus": "ack","session_id": 4332580640433269,"transaction": "3"}
{"janus": "ack","session_id": 4332580640433269,"transaction": "2","hint": "Processing."}
{"janus": "event","session_id": 4332580640433269,"transaction": "2","sender": 2534645948739130,"plugindata": {"plugin": "janus.plugin.sfu","data": {"success": true}},"jsep": {"type": "answer","sdp": "..."}}
{"janus": "ack","session_id": 4332580640433269,"transaction": "4"}
{"janus": "ack","session_id": 4332580640433269,"transaction": "5"}
{"session_id":4332580640433269,"janus":"trickle","transaction":"6","handle_id":2534645948739130,"candidate":null}
{"janus": "ack","session_id": 4332580640433269,"transaction": "6"}
{"janus": "webrtcup","session_id": 4332580640433269,"sender": 2534645948739130}
```

If you have something like this:

```
Creating new session: 1828495247198092; 0x7fa380015890
Creating new handle in session 1828495247198092: 7076818936776347; 0x7fa380015890 0x7fa3800166a0
Initializing SFU session 0x7fa380013bd0...
[7076818936776347] Creating ICE agent (ICE Full mode, controlled)
[WARN] [7076818936776347] Skipping disabled/unsupported media line...
Processing JSEP offer from 0x7fa380013bd0: Sdp { v=0
o=mozilla...THIS_IS_SDPARTA-87.0 771674382979274585 0 IN IP4 1.1.1.1
s=-
t=0 0
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
c=IN IP4 1.1.1.1
a=sendrecv
 }
[WARN] [7076818936776347] Skipping disabled/unsupported media line...
[WARN] [7076818936776347] ICE failed for component 1 in stream 1, but let's give it some time... (trickle received, answer received, alert not set)
[WSS-0xfa0400] Destroying WebSocket client
Destroying session 1828495247198092; 0x7fa380015890
Detaching handle from Janus SFU plugin; 0x7fa3800166a0 0x7fa380013bd0 0x7fa3800166a0 0x7fa380006d50
Hanging up WebRTC media on 0x7fa380013bd0.
[7076818936776347] WebRTC resources freed; 0x7fa3800166a0 0x7fa380015890
Destroying SFU session 0x7fa380013bd0...
[7076818936776347] Handle and related resources freed; 0x7fa3800166a0 0x7fa380015890
```

and in websocket messages:

```
{"janus": "event","session_id": 4332580640433269,"transaction": "2","sender": 2534645948739130,"plugindata": {"plugin": "janus.plugin.sfu","data": {"success": true}},"jsep": {"type": "answer","sdp": "..."}}
{ "janus": "hangup","session_id": 4332580640433269,"sender": 2534645948739130,"reason": "ICE failed"}
```

then you have an issue with your security rules. Double check you opened the
rtp port range.

On Firefox, you can go to `about:webrtc` to see the ICE candidates.

On Chrome: `chrome://webrtc-internals`

## Docker deployment

Not in the scope of this tutorial, but if you're interested in a docker or k8s
deployment, you can easily create a Dockerfile from the commands of the "Build
it" section above.

You should watch this conference about janus docker deployment too:
[Janus & Docker: friends or foe? Alessandro Amirante @ Meetecho](
https://www.januscon.it/2019/talk.php?t=docker)
