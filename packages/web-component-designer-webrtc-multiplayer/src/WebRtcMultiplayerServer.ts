type ExchangeData = { offer: RTCSessionDescription, ice: RTCIceCandidate }

export class WebRtcMultiplayerServer {

    connection: RTCPeerConnection;
    dataChannel: RTCDataChannel;
    broadcastChannel: BroadcastChannel;

    useBroadcast() {
        this.broadcastChannel = new BroadcastChannel('webrtc-signaling');
        this.broadcastChannel.onmessage = (event) => {
            if (event.data.type === 'answer') {
                this.connection.setRemoteDescription(new RTCSessionDescription(event.data.answer));
            } else if (event.data.type === 'ice') {
                this.connection.addIceCandidate(new RTCIceCandidate(event.data.candidate));
            } else if (event.data.type === 'ice') {
                this.connection.addIceCandidate(new RTCIceCandidate(event.data.candidate));
            }
        };
    }

    async startServer(): Promise<ExchangeData> {
        return new Promise<ExchangeData>(async res => {
            let result: ExchangeData = { offer: null, ice: null };
            this.connection = new RTCPeerConnection();
            this.connection.onicecandidate = (event) => {
                if (event.candidate) {
                    result.ice = event.candidate;
                    if (this.broadcastChannel)
                        this.broadcastChannel.postMessage({ type: 'ice', candidate: event.candidate });
                    res(result);
                }
            };
            this.dataChannel = this.connection.createDataChannel("dataChannel");
            this.dataChannel.onopen = () => {
                //console.log("Data channel is open");
                //dataChannel.send("Hello from Client A!");
            };
            this.dataChannel.onmessage = this._message;

            let offer = await this.connection.createOffer();
            await this.connection.setLocalDescription(offer);
            this.broadcastChannel.postMessage({ type: 'offer', offer: this.connection.localDescription });
            result.offer = this.connection.localDescription;
        });
    }

    async addClientToServer(clientData: ExchangeData) {
        await this.connection.setRemoteDescription(new RTCSessionDescription(clientData.offer));
        await this.connection.addIceCandidate(new RTCIceCandidate(clientData.ice));
    }

    startClient(serverData: ExchangeData): Promise<ExchangeData> {
        return new Promise<ExchangeData>(async res => {
            let result: ExchangeData = { offer: null, ice: null };
            this.connection = new RTCPeerConnection();
            this.connection.ondatachannel = (event) => {
                this.dataChannel = event.channel;
                this.dataChannel.onopen = () => {
                    //console.log("Data channel is open");
                    //dataChannel.send("Hello from Client B!");
                };
                this.dataChannel.onmessage = this._message;
            };
            this.connection.onicecandidate = (event) => {
                if (event.candidate) {
                    result.ice = event.candidate;
                    res(result);
                }
            };

            await this.connection.setRemoteDescription(new RTCSessionDescription(serverData.offer));

            let answer = await this.connection.createAnswer();
            await this.connection.setLocalDescription(answer);
            result.offer = this.connection.localDescription;

            this.connection.addIceCandidate(new RTCIceCandidate(serverData.ice));
        });
    }

    send(data: string) {
        this.dataChannel.send(data);
    }

    _message(event: MessageEvent<any>) {
        console.log("Message from ...", event.data);
    }
}
