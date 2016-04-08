package main

import (
	"fmt"
	"log"
	"net/http"
)

func serverError(w http.ResponseWriter, info interface{}) {
	str := fmt.Sprintf("err: %v", info)
	log.Printf(str)
	http.Error(w, str, 500)
}
