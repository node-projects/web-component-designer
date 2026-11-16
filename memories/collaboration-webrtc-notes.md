# Collaboration and WebRTC

- `mergeCollaborationHtml(base, incoming, accepted)` merges independent attributes/styles and uses the incoming edit for overlaps; the transport/coordinator supplies ordering, not browser clocks. It also supports the uncommon source/canvas combination.
- `applyCollaborationHtml(document, html, attributesChanged?)` reconciles retained items by saved ID with positional fallback. Keep live DesignItem/selection identity across remote property edits. Consumers can refresh declared custom-element properties through the attribute callback. Do not replace a whole canvas for ordinary remote property updates.
- Use `collaborationHtmlSignature` for state equality; attribute and independent CSS declaration ordering must not count as a new remote edit. Child order, text, property values and priorities remain significant.
- Comment menus/prompts use the basic designer's shared `translationService`, not a collaboration-specific callback. Preserve user comment bodies; standalone containers provide English fallback through `DefaultTranslationService`.

- Manual signaling carries `requestInitialSnapshot` in `hello` and `hello-ack`. Snapshot ownership must follow the peers' document state, not the copied signaling direction.
- `WebRtcTabCollaborationTransport` accepts an optional `rtcConfiguration` and passes it to `RTCPeerConnection`; cross-machine connections generally require appropriate STUN/TURN configuration.
- Do not add public TURN endpoints or browser-exposed long-lived provider credentials as defaults. Keep provider-specific credential generation outside the transport.
