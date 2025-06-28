package handler

import (
	"gRPC-based-chatting/chatProto"
	"gRPC-based-chatting/kafka"
	"io"
	"log"
	"sync"

	"google.golang.org/protobuf/proto"
)

type ChatHandler struct {
	chatProto.UnimplementedChatServiceServer // proto 에 정의된 ChatService
	Producer                                 *kafka.ChatProducer
	// 채널별로 클라이언트 스트림을 관리
	channels map[string]map[string]chatProto.ChatService_ChatStreamServer
	mu       sync.Mutex
}

func NewChatHandler(producer *kafka.ChatProducer) *ChatHandler { // kafka 발행도 하도록
	return &ChatHandler{
		Producer: producer,
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
	userID = *firstMsg.Sender
	channel = *firstMsg.Channel

	// 메시지를 kafka 로 전송
	marshaled, err := proto.Marshal(firstMsg)
	if err != nil {
		log.Printf("marchal(직렬화) error: %v", err)
	} else {
		go h.Producer.SendAsyncMessage(channel+":"+userID, marshaled)
	}

	// 스트림 등록: 클라이언트의 stream을 해당 채널의 map에 등록
	h.mu.Lock()
	if h.channels[channel] == nil {
		h.channels[channel] = make(map[string]chatProto.ChatService_ChatStreamServer)
	}
	h.channels[channel][userID] = stream
	h.mu.Unlock()

	defer func() {
		h.mu.Lock()
		delete(h.channels[channel], userID)
		h.mu.Unlock()
	}()

	// 첫 메시지도 브로드캐스트
	h.BroadcastFromKafka(channel, firstMsg)

	// 메시지 수신 및 브로드캐스트 루프
	for {
		msg, err := stream.Recv() // 클라이언트 메시지 하나씩 읽어오기
		if err == io.EOF {
			return nil
		}
		if err != nil {
			log.Printf("stream recv error: %v", err)
			return err
		}
		h.BroadcastFromKafka(channel, msg) // 브로드 캐스트 함수 호출
	}
}

// consumer에서 호출할 broadcast 함수
func (h *ChatHandler) BroadcastFromKafka(channel string, msg *chatProto.ChatMessage) {
	log.Printf("[Kafka] 채널=%s, sender=%s, content=%s", channel, msg.GetSender(), msg.GetContent()) // 메시지 수신 로그
	h.mu.Lock()
	defer h.mu.Unlock()
	for _, s := range h.channels[channel] {
		go func(srv chatProto.ChatService_ChatStreamServer) {
			if err := srv.Send(msg); err != nil {
				log.Printf("send error: %v", err)
			}
		}(s)
	}
}

// 채널별 유저 ID 목록(복사본) 반환
func (h *ChatHandler) GetChannels() map[string][]string {

	h.mu.Lock()         // 다른 고루틴이 접근 못하도록 락
	defer h.mu.Unlock() // 리턴되면 락 풀기

	// 복사본 생성
	result := make(map[string][]string)
	for channel, users := range h.channels {
		userIDs := make([]string, 0, len(users))
		for userID := range users {
			userIDs = append(userIDs, userID)
		}
		result[channel] = userIDs
	}
	return result
}
