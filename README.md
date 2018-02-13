# Networked-AFrame Janus Adapter

[![npm](https://img.shields.io/npm/v/naf-janus-adapter.svg)](https://www.npmjs.com/package/naf-janus-adapter)

Network adapter for [networked-aframe](https://github.com/haydenjameslee/networked-aframe) that uses the Janus WebRTC server as a backend.

## Usage

The Janus adapter needs access to networked-aframe's `NAF` global variable. Include the Janus adapter **after** including networked-aframe but **before** the `networked-scene` is loaded.

### Script Tag

```html
<html>
<head>
  <script src="https://aframe.io/releases/0.7.0/aframe.min.js"></script>
  <script src="https://rawgit.com/netpro2k/networked-aframe/feature/register-adapter/dist/networked-aframe.js"></script>
  <script src="https://unpkg.com/naf-janus-adapter/dist/naf-janus-adapter.min.js"></script>
</head>
<body>
   <a-scene networked-scene="
        room: 1;
        audio: true;
        adapter: janus;
        serverURL: ws://localhost:8080;
      ">
  </a-scene>
</body>
</html>
```
