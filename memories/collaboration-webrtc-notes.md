# Collaboration and WebRTC

- Manual signaling carries `requestInitialSnapshot` in `hello` and `hello-ack`. Snapshot ownership must follow the peers' document state, not the copied signaling direction.
- `WebRtcTabCollaborationTransport` accepts an optional `rtcConfiguration` and passes it to `RTCPeerConnection`; cross-machine connections generally require appropriate STUN/TURN configuration.
- Do not add public TURN endpoints or browser-exposed long-lived provider credentials as defaults. Keep provider-specific credential generation outside the transport.
