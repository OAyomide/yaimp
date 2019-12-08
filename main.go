package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	// get port env var
	port := os.Getenv("PORT")

	if port == "" {
		log.Fatal("PORT NOT SPECIFIED")
	}
	http.Handle("/", http.FileServer(http.Dir("./client/build")))
	log.Printf("Server up and running on PORT %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
