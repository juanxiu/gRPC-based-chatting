package main

import (
	"context"
	"flag"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "gRPC-based-chatting/chatProto"
)

var (
	serverAddr = flag.String("addr", "localhost:50051", "the address to connect to")
)

type Client struct {
	conn   *grpc.ClientConn
	client pb.ChatServiceClient
}

// TODO: log 설정 필요

// gRPC 서버에 연결 및 새로운 클라이언트 생성
func newClient() (*Client, error) {
	// gRPC 서버에 연결
	// TODO: TLS 인증서 설정 필요, 현재는 설정 안함
	conn, err := grpc.NewClient(*serverAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	// 클라이언트 생성
	client := pb.NewChatServiceClient(conn)

	return &Client{
		conn:   conn,
		client: client,
	}, nil
}

// 양방향 스트리밍 채팅 시작
func (c *Client) startChat() error {
	// TODO: context 설정
	ctx := context.TODO()

	// 양방향 스트림 생성
	stream, err := c.client.ChatStream(ctx)
	if err != nil {
		return err
	}

	defer stream.CloseSend()

	go c.receiveMessages(stream)

	// TODO: Wails 작성 후 변경
	// return c.sendMessages(stream)
	return nil
}

// 서버로부터 메시지 수신
func (c *Client) receiveMessages(stream pb.ChatService_ChatStreamClient) error {
	for {
		_, err := stream.Recv()
		if err != nil {
			return err
		}
	}
}

// 서버로 메시지 송신
// func (c *Client) sendMessages(stream pb.ChatService_ChatStreamClient) error {
// 	for {
// 		// TODO: Wails로부터 메시지를 받아 직렬화
// 		if err := stream.Send(msg); err != nil {
// 			return err
// 		}
// 	}
// }

// 클라이언트 연결 종료
func (c *Client) close() error {
	if c.conn != nil {
		if err := c.conn.Close(); err != nil {
			return err
		}
	}
	return nil
}

func main() {
	flag.Parse()

	// 클라이언트 생성
	client, err := newClient()
	if err != nil {
		return
	}
	defer client.close()

	// 채팅 시작
	if err := client.startChat(); err != nil {
		return
	}
}
