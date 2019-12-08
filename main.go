package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	var port string
	// get port env var
	osport := os.Getenv("PORT")
	if osport == "" {
		port = "11000"
	} else {
		port = osport
	}

	http.Handle("/", http.FileServer(http.Dir("./client/build")))
	log.Printf("Server up and running on PORT %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
