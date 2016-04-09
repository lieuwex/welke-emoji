package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func serverError(w http.ResponseWriter, info interface{}) {
	str := fmt.Sprintf("err: %v", info)
	log.Printf(str)
	http.Error(w, str, 500)
}

func fileExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return true, nil
}
