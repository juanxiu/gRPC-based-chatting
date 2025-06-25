package chat

import (
	"log"

	"golang.org/x/net/context"
)

func main() {
	// kafka producer start
	kafkaProducer, err := producer.NewChatProducer("localhost:9092", "chat-topic")
	if err != nil {
		log.Fatalf("Kafka producer 생성 실패: %v", err)
	}
	defer kafkaProducer.Producer.Close()
}
