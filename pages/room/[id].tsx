"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { io } from "socket.io-client";
import useSocket from "../hooks/sockets";

const ICE_SERVICE: any = {
  iceService: [
    {
      urls: "stun:openrelay.metered.ca:80",
    },
  ],
};

const Room = () => {
  useSocket();

  const router = useRouter();
  const userVideoRef = useRef<any>();
  const peerVideoRef = useRef<any>();
  const rtcConnectionRef = useRef<any>(null);
  const socketRef = useRef<any>();
  const userStreamRef = useRef<any>();
  const hostRef = useRef(false);
  const [micActive, setMicActive] = useState<any>();
  const [cameraActive, setCameraActive] = useState<any>();
  const { id } = router.query;
  console.log(id);
  
  useEffect(() => {
    socketRef.current = io();
    socketRef.current.emit("join", id);
    socketRef.current.on("joined", handleRoomJoined);
    socketRef.current.on("created", handleRoomCreated);
    socketRef.current.on("ready", initiateCall);
    socketRef.current.on("leave", onPeerLeave);
    socketRef.current.on("full", () => {
      window.location.href = "/";
    });
    socketRef.current.on("offer", handleReceivedOffer);
    socketRef.current.on("answer", handleAnswer);
    socketRef.current.on("ice-candidate", handlerNewIceCandidateMsg);
    return () => {
      socketRef.current?.disconnect();
    };
  }, [id]);

  const handleRoomCreated = () => {
    hostRef.current = true;
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: { width: 500, height: 500 },
      })
      .then((stream) => {
        userStreamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          userVideoRef.current.onloadedmetadata = () => {
            userVideoRef.current?.play();
          };
        }
      })
      .catch((err) => {
        console.error("Error getting user media:", err);
      });
  };
  const handleRoomJoined = () => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: { width: 500, height: 500 },
      })
      .then((stream) => {
        userStreamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          userVideoRef.current.onloadedmetadata = () => {
            userVideoRef.current?.play();
          };
        }
        socketRef.current?.emit("ready", id);
      })
      .catch((err) => {
        console.error("Error getting user media:", err);
      });
  };



   const initiateCall = () => {
    if (hostRef.current && userStreamRef.current) {
      rtcConnectionRef.current = createPeerConnection();
      rtcConnectionRef.current.addTrack(userStreamRef.current.getTracks()[0], userStreamRef.current);
      rtcConnectionRef.current.addTrack(userStreamRef.current.getTracks()[1], userStreamRef.current);

      rtcConnectionRef.current
        .createOffer()
        .then((offer : any) => {
          rtcConnectionRef.current?.setLocalDescription(offer);
          socketRef.current?.emit('offer', offer, id);
        })
        .catch((error : any)  => {
          console.error('Error creating offer:', error);
        });
    }
  };

  const onPeerLeave = () => {
    hostRef.current = true;

    if (peerVideoRef.current && peerVideoRef.current.srcObject) {
      peerVideoRef.current.srcObject
        .getTracks()
        .forEach((track:any) => track.stop()); // Stops receiving all track of Peer.
    }

    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.ontrack = null;
      rtcConnectionRef.current.onicecandidate = null;
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    }
  }

  const createPeerConnection = () => {
    const connection = new RTCPeerConnection(ICE_SERVICE);

    connection.onicecandidate = handleICECandidateEvent;

    connection.ontrack = handleTrackEvent;
    return connection;
  };

  const handleReceivedOffer = (offer: RTCSessionDescriptionInit) => {
    if (!hostRef.current && userStreamRef.current) {
      rtcConnectionRef.current = createPeerConnection();
      rtcConnectionRef.current.addTrack(userStreamRef.current.getTracks()[0], userStreamRef.current);
      rtcConnectionRef.current.addTrack(userStreamRef.current.getTracks()[1], userStreamRef.current);

      rtcConnectionRef.current.setRemoteDescription(offer);

      rtcConnectionRef.current
        .createAnswer()
        .then((answer : any) => {
          rtcConnectionRef.current?.setLocalDescription(answer);
          socketRef.current?.emit('answer', answer, id);
        })
        .catch((error :any) => {
          console.error('Error creating answer:', error);
        });
    }
  };

  const handleAnswer = (answer: any) => {
    rtcConnectionRef.current
      .setRemoteDescription(answer)
      .catch((err: any) => console.log(err));
  };

  const handleICECandidateEvent = (event: any) => {
    if (event.candidate) {
      socketRef.current.emit("ice candidate", event.candidate, id);
    }
  };

  const handlerNewIceCandidateMsg = (incoming: any) => {
    const candidate = new RTCIceCandidate(incoming);
    rtcConnectionRef.current
      .addIceCandidate(candidate)
      .catch((e: any) => console.log(e));
  };
  const handleTrackEvent = (e: any) => {
   if (peerVideoRef.current) {
      peerVideoRef.current.srcObject = e.streams[0];
    }
  };

  const toggleMediaStream = (type: 'audio' | 'video', state: boolean) => {
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach((track :any) => {
        if (track.kind === type) {
          track.enabled = !state;
        }
      });
    }
  };;
  const toggleMic = () => {
    toggleMediaStream("audio", micActive);
    setMicActive((prev: any) => !prev);
  };

  const toggleCamera = () => {
    toggleMediaStream("video", cameraActive);
    setCameraActive((prev: any) => !prev);
  };

  const leaveRoom = () => {
    socketRef.current.emit("leave", id);

    if (userVideoRef.current.srcObject) {
      userVideoRef.current.srcObject
        .getTracks()
        .forEach((track : any) => track.stop());
    }
    if (peerVideoRef.current.srcObject) {
      peerVideoRef.current.srcObject
        .getTracks()
        .forEach((track: any) => track.stop());
    }

    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.ontrack = null;
      rtcConnectionRef.current.onicecandidate = null;
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    }
    router.push("/");
  };
  return (
    <div>
      <video autoPlay ref={userVideoRef} />
      <video autoPlay ref={peerVideoRef} />
      <button onClick={toggleMic} type="button">
        {micActive ? 'Mute Mic' : 'UnMute Mic'}
      </button>
      <button onClick={leaveRoom} type="button">
        Leave
      </button>
      <button onClick={toggleCamera} type="button">
        {cameraActive ? 'Stop Camera' : 'Start Camera'}
      </button>
    </div>
  );
};

export default Room;
