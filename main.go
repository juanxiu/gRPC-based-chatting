package chat

import (
	"log"
	"net"

	"gRPC-based-chatting/chatProto"
	"gRPC-based-chatting/handler"
	"gRPC-based-chatting/kafka"

	"google.golang.org/grpc"
)

func main() {

	// 1. kafka producer 생성
	producer, err := kafka.NewChatProducer("localhost:9092", "chat-topic")
	if err != nil {
		log.Fatalf("Kafka producer 생성 실패: %v", err)
	}
	defer producer.Close()

	// 2. grpc 서버 생성
	grpcServer := grpc.NewServer()

	// 3. 채널별 브로드캐스트 핸들러 생성 및 서비스 등록
	chatHandler := handler.NewChatHandler(producer) // handler 함수 문제
	chatProto.RegisterChatServiceServer(grpcServer, chatHandler)

	// 4. 서버 실행
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("서버 리스닝 실패: %v", err)
	}
	log.Println("gRPC 서버 시작: :50051")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("gRPC 서버 종료: %v", err)
	}

}
