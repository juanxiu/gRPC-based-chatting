package handler

import (
	"gRPC-based-chatting/chatProto"
	"io"
	"log"
	"sync"
)

type ChatHandler struct {
	chatProto.UnimplementedChatServiceServer
	// 채널별로 클라이언트 스트림을 관리
	channels map[string]map[string]chatProto.ChatService_ChatStreamServer
	mu       sync.Mutex
}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{
		channels: make(map[string]map[string]chatProto.ChatService_ChatStreamServer),
	}
}

func (h *ChatHandler) ChatStream(stream chatProto.ChatService_ChatStreamServer) error {
	var (
		userID  string
		channel string
	)

	// 최초 메시지에서 유저/채널 정보 추출
	firstMsg, err := stream.Recv()
	if err != nil {
		return err
	}
	userID = firstMsg.Sender
	channel = firstMsg.Channel

	// 스트림 등록
	h.mu.Lock()
	if h.channels[channel] == nil {
		h.channels[channel] = make(map[string]pb.ChatService_ChatStreamServer)
	}
	h.channels[channel][userID] = stream
	h.mu.Unlock()

	defer func() {
		h.mu.Lock()
		delete(h.channels[channel], userID)
		h.mu.Unlock()
	}()

	// 첫 메시지도 브로드캐스트
	h.broadcast(channel, firstMsg, userID)

	// 메시지 수신 및 브로드캐스트 루프
	for {
		msg, err := stream.Recv()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			log.Printf("stream recv error: %v", err)
			return err
		}
		h.broadcast(channel, msg, userID)
	}
}

// 브로드캐스트 함수
func (h *ChatHandler) broadcast(channel string, msg *pb.ChatMessage, senderID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for uid, s := range h.channels[channel] {
		if uid == senderID {
			continue // 자기 자신에게는 안 보냄 (원하면 제거)
		}
		go func(srv pb.ChatService_ChatStreamServer) {
			if err := srv.Send(msg); err != nil {
				log.Printf("send error: %v", err)
			}
		}(s)
	}
}
