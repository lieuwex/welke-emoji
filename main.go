package main

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
)

const defaultPort = "1337"

type idInfo struct {
	correct, incorrect int
	emoji              string
}

var idMap = make(map[string]*idInfo)

func getIDInfo(id string) *idInfo {
	info, has := idMap[id]
	if has {
		return info
	}

	info = &idInfo{
		correct:   0,
		incorrect: 0,
		emoji:     randomEmoji(),
	}
	idMap[id] = info
	return info
}

func frontHandler(w http.ResponseWriter, r *http.Request) {
	file := r.URL.Path[1:]
	if file == "" {
		file = "index.html"
	}
	http.ServeFile(w, r, "client/"+file)
}

func checkHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[7:]

	bytes, err := ioutil.ReadAll(r.Body)
	if err != nil {
		serverError(w, err)
		return
	}
	body := string(bytes)

	if !isEmoji(body) {
		http.Error(w, "input is not an emoji", 400)
		return
	}

	info, has := idMap[id]
	if !has {
		http.Error(w, "no info with id found", 400)
		return
	}

	if info.emoji == body {
		w.Write([]byte("1"))
		info.correct++
	} else {
		w.Write([]byte("0"))
		info.incorrect++
	}
}

func audioHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[7:]
	if strings.TrimSpace(id) == "" {
		http.Error(w, "invalid id", 400)
		return
	}

	info := getIDInfo(id)
	log.Printf("%s: %#v\n", id, info)

	path, err := getAudio(id, info.emoji)
	if err != nil {
		serverError(w, err)
		return
	}

	http.ServeFile(w, r, path)
}

func emojiHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[7:]
	if strings.TrimSpace(id) == "" {
		http.Error(w, "invalid id", 400)
		return
	}

	info := getIDInfo(id)
	w.Write([]byte(info.emoji))
}

func main() {
	if err := clearDir("audio"); err != nil {
		panic(err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	http.HandleFunc("/", frontHandler)
	http.HandleFunc("/check/", checkHandler)
	http.HandleFunc("/audio/", audioHandler)
	http.HandleFunc("/emoji/", emojiHandler)

	log.Print("listening on " + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
