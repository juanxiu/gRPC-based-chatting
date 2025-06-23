package main

import (
	"log"
	"net"

	"google.golang.org/grpc"
)

func main() {
	lis, err := net.Listen("tcp", ":9000") // 리스너, tcp 연결
	if err != nil {
		log.Fatalf("포트 리슨 실패", err)
	}

	grpcServer := grpc.NewServer()

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("grpc 서버 제공 실패", err)
	}
}
