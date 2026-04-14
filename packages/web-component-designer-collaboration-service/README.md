# @node-projects/web-component-designer-collaboration-service

https://www.npmjs.com/package/@node-projects/web-component-designer-collaboration-service

```bash
npm i @node-projects/web-component-designer-collaboration-service
```

## Description

This package adds collaboration features to `@node-projects/web-component-designer`.

It provides:

- a per-document collaboration service
- remote selection and presence overlays
- remote cursor overlays
- comment context menu integration
- a WebRTC transport with `broadcast-channel` and manual copy/paste signaling

The package is an addon. It does not patch the default designer bootstrap automatically. You enable it explicitly on your `ServiceContainer`.

## Quick Start

```ts
import { createDefaultServiceContainer } from '@node-projects/web-component-designer';
import {
     setupCollaborationService,
     WebRtcTabCollaborationTransport,
} from '@node-projects/web-component-designer-collaboration-service';

const serviceContainer = createDefaultServiceContainer();
setupCollaborationService(serviceContainer);
```

After that, each `DocumentContainer` gets a collaboration service instance on its `instanceServiceContainer`.

```ts
const collaborationService = documentContainer.instanceServiceContainer.collaborationService;

collaborationService.attachTransport(new WebRtcTabCollaborationTransport({
     enabledSignalingChannels: ['broadcast-channel', 'manual'],
     rtcConfiguration: {
          iceServers: [
               { urls: 'stun:stun.l.google.com:19302' },
               { urls: 'turns:turn.example.com:5349?transport=tcp', username: 'demo', credential: 'secret' }
          ]
     }
}));

collaborationService.connect(
     'my-session-id',
     'peer-a',
     'Browser A'
);
```

## What `setupCollaborationService()` Adds

`setupCollaborationService(serviceContainer)` registers:

- the `collaborationService` instance factory
- the collaboration node/comment overlay extension
- the collaboration cursor overlay extension
- the collaboration comments context menu entry

If you want more control, the package also exports the individual classes:

- `DefaultCollaborationService`
- `WebRtcTabCollaborationTransport`
- `CollaborationOverlayExtensionProvider`
- `CollaborationCursorOverlayExtensionProvider`
- `CollaborationCommentsContextMenu`

## Signaling Modes

`WebRtcTabCollaborationTransport` supports two signaling channels:

- `broadcast-channel`
     Use this for same-origin tabs in the same browser.
- `manual`
     Use this for different browsers or when you want to move signaling data yourself.

Both channels are enabled by default.

```ts
const transport = new WebRtcTabCollaborationTransport({
     enabledSignalingChannels: ['manual']
});
```

## Manual Copy/Paste Signaling

The manual signaling API is useful for connecting different browsers without a backend signaling server.

For same-browser tabs you usually do not need extra RTC configuration. For different machines, browsers, subnets, VPNs, or internet connections, configure `rtcConfiguration` with suitable STUN or TURN servers. Without that, the browser only has local host candidates available, which often works on one computer but is unreliable across machines.

If your TURN credentials rotate, update them before reconnecting. `WebRtcTabCollaborationTransport` also exposes `setRtcConfiguration()` for that use case.

```ts
const transport = new WebRtcTabCollaborationTransport({
     enabledSignalingChannels: ['manual'],
     rtcConfiguration: {
          iceServers: [
               { urls: 'stun:stun.l.google.com:19302' },
               { urls: ['turn:turn.example.com:3478?transport=udp', 'turns:turn.example.com:5349?transport=tcp'], username: 'demo', credential: 'secret' }
          ]
     }
});

transport.setRtcConfiguration({
     iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turns:turn.example.com:5349?transport=tcp', username: 'demo', credential: 'next-secret' }
     ]
});

const bundle = transport.exportManualSignalingData();
await transport.importManualSignalingData(bundleFromOtherClient);
```

Typical flow:

1. Use the same collaboration session id in both clients.
2. Copy the signaling bundle from client A and import it in client B.
3. Copy the updated signaling bundle from client B and import it in client A.
4. If one client still has a newer signaling bundle because of trickled ICE candidates, copy that bundle back once more.

## Demo Notes

The demo toolbar contains a `collab` menu with:

- session id selection
- signaling-channel toggles
- copy/paste signaling bundle actions
- a help popup with the connection steps

In the demo:

1. Use the same session id in both clients.
2. For same-browser tabs, keep `broadcast signaling` enabled.
3. For different browsers, keep `manual copy/paste signaling` enabled and exchange bundles through the menu.

## Package Exports

Main exports:

- `setupCollaborationService`
- `DefaultCollaborationService`
- `WebRtcTabCollaborationTransport`
- `CollaborationCommentsContextMenu`
- `CollaborationOverlayExtensionProvider`
- `CollaborationCursorOverlayExtensionProvider`
