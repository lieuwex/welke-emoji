package main

import (
	"math/rand"

	"gopkg.in/kyokomi/emoji.v1"
)

func randomEmoji() string {
	pairs := emoji.CodeMap()
	for {
		index := rand.Intn(len(pairs))
		var res string

		i := 0
		for _, val := range pairs {
			if i == index {
				res = val
				break
			}
			i++
		}

		if res != "" {
			return res
		}
	}
}

func isEmoji(s string) bool {
	pairs := emoji.CodeMap()

	if s == "" {
		return false
	}

	for _, val := range pairs {
		if val == s {
			return true
		}
	}
	return false
}
