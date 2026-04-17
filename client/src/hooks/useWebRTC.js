import { useRef, useState, useCallback } from "react";

export const useWebRTC = (socket) => {
  const peerConnectionRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const startLocalStream = useCallback(async (type = "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error getting media:", error);
      throw error;
    }
  }, []);

  const createPeerConnection = useCallback(
    (toUserId, callId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Send ICE candidates to remote peer
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("ice-candidate", { toUserId, candidate, callId });
        }
      };

      // Receive remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      return pc;
    },
    [socket],
  );

  const createOffer = useCallback(
    async (toUserId, callId) => {
      const pc = createPeerConnection(toUserId, callId);

      // Add local stream tracks to connection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Listen for answer
      socket.on("answer", async ({ answer }) => {
        if (pc.signalingState !== "closed") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      // Listen for ICE candidates from remote
      socket.on("ice-candidate", async ({ candidate }) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("offer", { toUserId, offer, callId });
    },
    [socket, localStream, createPeerConnection],
  );

  const handleOffer = useCallback(
    async (fromUserId, offer, callId, stream) => {
      const pc = createPeerConnection(fromUserId, callId);

      // Add local stream
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Listen for ICE candidates
      socket.on("ice-candidate", async ({ candidate }) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { toUserId: fromUserId, answer, callId });
    },
    [socket, createPeerConnection],
  );

  const endCall = useCallback(
    ({ toUserId, callId }) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (toUserId) {
        socket.emit("call-ended", { toUserId, callId });
      }
    },
    [socket],
  );

  const stopLocalStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    peerConnectionRef,
    startLocalStream,
    createOffer,
    handleOffer,
    endCall,
    stopLocalStream,
  };
};
